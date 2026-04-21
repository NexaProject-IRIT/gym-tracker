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
from .services.workout_parser import extract_workout_suggestion


logger = logging.getLogger(__name__)


RATE_LIMIT_MESSAGES = 30
RATE_LIMIT_WINDOW_SECONDS = 60

# Паттерн для очистки XML-тегов, которые GigaChat иногда копирует из промпта.
# Убираем <user-data>...</user-data> и другие служебные теги.
# Делаем это ДО extract_workout_suggestion, чтобы не ломать парсинг <workout>.
_CLEANUP_TAGS_RE = re.compile(
    r'<(?!/?workout\b)[a-zA-Z][a-zA-Z0-9_-]*(?:\s[^>]*)?>.*?</[a-zA-Z][a-zA-Z0-9_-]*>',
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

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_message_text = serializer.validated_data['message'].strip()

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

        # Сохраняем сообщение пользователя ДО запроса в LLM —
        # если модель упадёт, сообщение останется в истории.
        user_msg = ChatMessage.objects.create(
            user=request.user,
            role='user',
            content=user_message_text,
        )

        history_qs = ChatMessage.objects.filter(user=request.user).exclude(pk=user_msg.pk)
        llm_messages = build_messages_for_llm(request.user, history_qs, user_message_text)

        client = get_llm_client()
        try:
            raw_reply = client.chat(llm_messages)
        except LLMError as e:
            logger.exception('LLM error for user %s', request.user.username)
            fallback_text = (
                'Сейчас не могу ответить — сервис ИИ-тренера временно недоступен. '
                'Попробуй ещё раз через минуту.'
            )
            assistant_msg = ChatMessage.objects.create(
                user=request.user,
                role='assistant',
                content=fallback_text,
            )
            return Response(
                {
                    'user_message': ChatMessageSerializer(user_msg).data,
                    'assistant_message': ChatMessageSerializer(assistant_msg).data,
                    'error': str(e),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception('Unexpected LLM error')
            return Response(
                {'error': f'Внутренняя ошибка: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Очищаем XML-артефакты из ответа модели, оставляем <workout>.
        raw_reply = _clean_llm_response(raw_reply)

        visible_text, workout_suggestion = extract_workout_suggestion(raw_reply)

        if not visible_text and workout_suggestion:
            visible_text = 'Вот тренировка, которую я составил. Можешь добавить её одним кликом.'

        assistant_msg = ChatMessage.objects.create(
            user=request.user,
            role='assistant',
            content=visible_text,
            workout_suggestion=workout_suggestion,
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