import re
import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatMessage
from .serializers import ChatMessageSerializer, ChatRequestSerializer
from .services.context_builder import build_messages_for_llm
from .services.gigachat import get_llm_client, LLMError
from .services.workout_parser import extract_workout_suggestion, extract_workout_imports, extract_workout_renames
from .services.import_detector import looks_like_workout_import, build_import_messages, split_diary_into_chunks


logger = logging.getLogger(__name__)


RATE_LIMIT_MESSAGES = 30
RATE_LIMIT_WINDOW_SECONDS = 60

# Паттерн для очистки XML-тегов, которые LLM иногда копирует из промпта.
# Убираем <user-data>...</user-data> и другие служебные теги.
# Делаем это ДО extract_workout_suggestion, чтобы не ломать парсинг <workout>.
_CLEANUP_TAGS_RE = re.compile(
    r'<(?!/?workout\b)(?!/?import\b)(?!/?rename\b)[a-zA-Z][a-zA-Z0-9_-]*(?:\s[^>]*)?>.*?</[a-zA-Z][a-zA-Z0-9_-]*>',
    re.DOTALL | re.IGNORECASE,
)


def _clean_llm_response(text: str) -> str:
    """
    Убирает XML-артефакты из ответа модели.
    Сохраняем <workout>...</workout> — он нужен парсеру.
    Всё остальное (<user-data>, <context> и т.п.) — вырезаем.
    """
    cleaned = _CLEANUP_TAGS_RE.sub('', text)
    # Подчищаем лишние пробелы/переносы после удаления тегов
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
    return cleaned


def _is_rate_limited(user) -> bool:
    window_start = timezone.now() - timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)
    recent_count = ChatMessage.objects.filter(
        user=user,
        role='user',
        created_at__gte=window_start,
    ).count()
    return recent_count >= RATE_LIMIT_MESSAGES


class ChatView(APIView):
    """
    POST /ai/chat/
    Вход:  { "message": "текст пользователя" }
    Выход: { "user_message": {...}, "assistant_message": {...} }
    """
    permission_classes = [permissions.IsAuthenticated]

    def _llm_error_response(self, user, user_msg, error_text: str):
        """Возвращает 200-ответ с fallback-сообщением, чтобы фронт не падал."""
        logger.exception('LLM error for user %s: %s', user.username, error_text)
        fallback_text = (
            'Сейчас не могу ответить — сервис ИИ-тренера временно недоступен. '
            'Попробуй ещё раз через минуту.'
        )
        assistant_msg = ChatMessage.objects.create(
            user=user,
            role='assistant',
            content=fallback_text,
        )
        return Response(
            {
                'user_message': ChatMessageSerializer(user_msg).data,
                'assistant_message': ChatMessageSerializer(assistant_msg).data,
                'error': error_text,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_message_text = serializer.validated_data['message'].strip()
        file_content = serializer.validated_data.get('file_content', '').strip()
        file_name = serializer.validated_data.get('file_name', '').strip()

        if not user_message_text:
            return Response(
                {'error': 'Сообщение не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if _is_rate_limited(request.user):
            return Response(
                {'error': 'Слишком много сообщений. Подожди минуту и попробуй снова.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Текст для LLM: включаем содержимое файла (если есть) как контекст.
        # В историю чата сохраняем только набранный текст — чтобы история оставалась чистой.
        if file_content:
            llm_user_text = f"{user_message_text}\n\n---\nСодержимое прикреплённого файла:\n{file_content}"
        else:
            llm_user_text = user_message_text

        # Сохраняем сообщение пользователя ДО запроса в LLM —
        # если модель упадёт, сообщение останется в истории.
        user_msg = ChatMessage.objects.create(
            user=request.user,
            role='user',
            content=user_message_text,
            file_name=file_name,
        )

        # Детектируем: это журнал тренировок для импорта или обычный вопрос?
        is_import = looks_like_workout_import(llm_user_text)
        client = get_llm_client()

        # Импорт: режем большие дневники на чанки и парсим каждый отдельно,
        # потому что у DeepSeek max_tokens = 8K, а 30+ тренировок в JSON туда не лезут.
        if is_import:
            chunks = split_diary_into_chunks(llm_user_text)
            workout_suggestion = None
            workout_renames = None
            workout_imports: list | None = None
            visible_text = ''

            if len(chunks) > 1:
                logger.info('Import: разбиваю дневник на %s чанков', len(chunks))
                aggregated: list = []
                failed_chunks = 0
                for idx, chunk in enumerate(chunks, 1):
                    chunk_messages = build_import_messages(chunk)
                    try:
                        chunk_reply = client.chat(chunk_messages, max_tokens=8000)
                    except LLMError:
                        logger.exception('LLM error на чанке %s/%s', idx, len(chunks))
                        failed_chunks += 1
                        continue
                    chunk_reply = _clean_llm_response(chunk_reply)
                    _, chunk_imports = extract_workout_imports(chunk_reply)
                    if chunk_imports:
                        aggregated.extend(chunk_imports)

                workout_imports = aggregated or None
                if workout_imports:
                    n = len(workout_imports)
                    note = f' (часть из {failed_chunks} блоков не удалось обработать)' if failed_chunks else ''
                    visible_text = (
                        f'Распознал {n} тренировок из файла{note}. '
                        f'Нажми кнопку ниже, чтобы добавить их в журнал.'
                    )
                else:
                    visible_text = (
                        'Не смог распарсить ни одной тренировки. '
                        'Проверь, что в файле есть даты в формате DD.MM.YYYY.'
                    )
            else:
                # Один чанк — обычный путь, но с увеличенным лимитом токенов.
                llm_messages = build_import_messages(llm_user_text)
                try:
                    raw_reply = client.chat(llm_messages, max_tokens=8000)
                except LLMError as e:
                    return self._llm_error_response(request.user, user_msg, str(e))
                except Exception as e:
                    logger.exception('Unexpected LLM error')
                    return Response(
                        {'error': f'Внутренняя ошибка: {e}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                raw_reply = _clean_llm_response(raw_reply)
                visible_text, workout_imports = extract_workout_imports(raw_reply)

                # Если модель вернула <import>... но без закрывающего тега — значит, упёрлась в max_tokens.
                if not workout_imports and '<import>' in raw_reply.lower() and '</import>' not in raw_reply.lower():
                    visible_text = (
                        'Не успел сформировать ответ — журнал слишком большой даже для чанка. '
                        'Попробуй прислать его в виде .txt файла (тогда я разобью на части автоматически).'
                    )
        else:
            history_qs = ChatMessage.objects.filter(user=request.user).exclude(pk=user_msg.pk)
            llm_messages = build_messages_for_llm(request.user, history_qs, llm_user_text)
            try:
                raw_reply = client.chat(llm_messages, max_tokens=2048)
            except LLMError as e:
                return self._llm_error_response(request.user, user_msg, str(e))
            except Exception as e:
                logger.exception('Unexpected LLM error')
                return Response(
                    {'error': f'Внутренняя ошибка: {e}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            raw_reply = _clean_llm_response(raw_reply)
            visible_text, workout_suggestion = extract_workout_suggestion(raw_reply)
            visible_text, workout_imports = extract_workout_imports(visible_text)
            visible_text, workout_renames = extract_workout_renames(visible_text)

        if not visible_text:
            if workout_renames:
                n = len(workout_renames)
                label = f'{n} тренировк' + ('у' if n == 1 else 'и' if n in (2, 3, 4) else 'ок')
                visible_text = f'Готово — придумал названия для {label}. Нажми кнопку ниже, чтобы применить.'
            elif workout_imports:
                n = len(workout_imports)
                if n == 1:
                    label = '1 тренировку'
                elif n in (2, 3, 4):
                    label = f'{n} тренировки'
                else:
                    label = f'{n} тренировок'
                visible_text = f'Распознал {label}. Нажми кнопку ниже, чтобы добавить их в журнал.'
            elif workout_suggestion:
                visible_text = 'Вот тренировка, которую я составил. Можешь добавить её одним кликом.'
            elif is_import:
                visible_text = (
                    'Не смог распарсить журнал тренировок — проверь, что в файле есть '
                    'даты в формате DD.MM.YYYY и упражнения в формате «NхM» или «NхMхWкг».'
                )

        assistant_msg = ChatMessage.objects.create(
            user=request.user,
            role='assistant',
            content=visible_text,
            workout_suggestion=workout_suggestion,
            workout_imports=workout_imports,
            workout_renames=workout_renames,
        )

        return Response(
            {
                'user_message': ChatMessageSerializer(user_msg).data,
                'assistant_message': ChatMessageSerializer(assistant_msg).data,
            },
            status=status.HTTP_200_OK,
        )


class HistoryView(APIView):
    """
    GET    /ai/history/  — история текущего пользователя
    DELETE /ai/history/  — очистить историю
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user).order_by('created_at')
        return Response({
            'messages': ChatMessageSerializer(messages, many=True).data,
        })

    def delete(self, request):
        ChatMessage.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)