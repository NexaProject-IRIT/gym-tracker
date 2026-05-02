"""
Клиент для GigaChat API (Сбер).

Документация: https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/post-chat

Архитектура:
- OAuth-токен GigaChat живёт 30 минут → кэшируем в памяти процесса.
- Все запросы идут с verify=False, потому что GigaChat использует цепочку
  сертификатов Минцифры РФ, которой по дефолту нет в ca-certificates.
  Для продакшн-сетапа нужно добавить их корневой сертификат в контейнер,
  но для MVP работает и так. Переключается через GIGACHAT_VERIFY_SSL=true.
- Если GIGACHAT_AUTH_KEY пустой или LLM_PROVIDER=mock — работает заглушка
  (отдельный класс MockLLMClient), чтобы фронт можно было собирать без
  реального ключа.
"""
import os
import time
import uuid
import logging
import threading
import requests
import urllib3
from typing import Optional


logger = logging.getLogger(__name__)


# Глушим предупреждение про самоподписанный сертификат — оно засоряет логи,
# а включать verify=True без установки цепочки Минцифры всё равно нельзя.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'


class LLMError(Exception):
    """Любая ошибка при работе с LLM — пробрасываем наружу с понятным сообщением."""
    pass


class GigaChatClient:
    """
    Клиент GigaChat. Одиночный экземпляр на процесс (смотри get_llm_client()).
    Токен кэшируется в self._access_token + self._token_expires_at,
    доступ к кэшу защищён lock'ом — на случай если две корутины/треда
    одновременно полезут обновлять.
    """

    def __init__(
        self,
        auth_key: str,
        scope: str = 'GIGACHAT_API_PERS',
        model: str = 'GigaChat',
        verify_ssl: bool = False,
        timeout: int = 30,
    ):
        if not auth_key:
            raise ValueError('GIGACHAT_AUTH_KEY is empty')
        self.auth_key = auth_key
        self.scope = scope
        self.model = model
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0  # unix timestamp (seconds)
        self._lock = threading.Lock()

    def _fetch_access_token(self) -> str:
        """
        Обмениваем Authorization key на access_token.
        API возвращает expires_at в миллисекундах unix-времени.
        """
        rq_uid = str(uuid.uuid4())
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': rq_uid,
            'Authorization': f'Basic {self.auth_key}',
        }
        data = {'scope': self.scope}

        try:
            resp = requests.post(
                GIGACHAT_OAUTH_URL,
                headers=headers,
                data=data,
                verify=self.verify_ssl,
                timeout=self.timeout,
            )
        except requests.RequestException as e:
            raise LLMError(f'Не удалось связаться с GigaChat OAuth: {e}')

        if resp.status_code != 200:
            raise LLMError(
                f'GigaChat OAuth вернул {resp.status_code}: {resp.text[:300]}'
            )

        payload = resp.json()
        token = payload.get('access_token')
        expires_at_ms = payload.get('expires_at')
        if not token:
            raise LLMError(f'В ответе OAuth нет access_token: {payload}')

        # Храним в секундах; минусуем 60 секунд на сетевую задержку.
        if expires_at_ms:
            expires_at_s = float(expires_at_ms) / 1000.0 - 60.0
        else:
            # На случай если поле пропало — ставим 25 минут от текущего времени.
            expires_at_s = time.time() + 25 * 60

        self._access_token = token
        self._token_expires_at = expires_at_s
        logger.info('GigaChat: обновили access_token, действителен до %s', expires_at_s)
        return token

    def _get_access_token(self) -> str:
        """Возвращает валидный токен, при необходимости обновив его."""
        with self._lock:
            if not self._access_token or time.time() >= self._token_expires_at:
                return self._fetch_access_token()
            return self._access_token

    def chat(
        self,
        messages: list[dict],
        temperature: float = 0.6,
        max_tokens: int = 1024,
    ) -> str:
        """
        Отправляет messages в /chat/completions и возвращает текст ответа.
        messages: список {"role": "system"|"user"|"assistant", "content": "..."}.
        """
        access_token = self._get_access_token()
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {access_token}',
        }
        body = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'stream': False,
        }

        try:
            resp = requests.post(
                GIGACHAT_API_URL,
                headers=headers,
                json=body,
                verify=self.verify_ssl,
                timeout=self.timeout,
            )
        except requests.RequestException as e:
            raise LLMError(f'Не удалось связаться с GigaChat: {e}')

        # 401 может означать что токен истёк раньше expires_at (бывает редко) —
        # сбрасываем кэш и даём наружу понятную ошибку. Повторный запрос
        # от пользователя возьмёт уже свежий токен.
        if resp.status_code == 401:
            with self._lock:
                self._access_token = None
                self._token_expires_at = 0.0
            raise LLMError('GigaChat вернул 401, токен сброшен. Повторите запрос.')

        if resp.status_code != 200:
            raise LLMError(
                f'GigaChat вернул {resp.status_code}: {resp.text[:300]}'
            )

        payload = resp.json()
        try:
            return payload['choices'][0]['message']['content']
        except (KeyError, IndexError, TypeError):
            raise LLMError(f'Неожиданный формат ответа GigaChat: {payload}')


class MockLLMClient:
    """
    Заглушка для разработки без реального ключа GigaChat.
    Включается через LLM_PROVIDER=mock.
    Никуда не ходит, возвращает фиксированный ответ.
    """

    def chat(self, messages: list[dict], **_kwargs) -> str:
        # Найдём последнее сообщение пользователя, чтоб отразить в ответе.
        user_text = ''
        for m in reversed(messages):
            if m.get('role') == 'user':
                user_text = m.get('content', '')
                break

        # Если в сообщении есть слова про «составь тренировку» — вернём
        # валидный <workout>-блок, чтобы можно было протестить кнопку
        # «Добавить тренировку» без GigaChat.
        lower = user_text.lower()
        if any(trigger in lower for trigger in ('составь', 'сделай трен', 'дай трен', 'план трен')):
            return (
                'Вот базовая силовая тренировка на ноги и плечи:\n\n'
                '<workout>{"name":"Ноги + плечи (ИИ)","type":"strength",'
                '"exercises":['
                '{"name":"Приседания со штангой","sets":4,"reps":8,"weight":60},'
                '{"name":"Жим гантелей стоя","sets":4,"reps":10,"weight":14}'
                ']}</workout>\n\n'
                'Перед основной работой сделай разминку 5–7 минут, '
                'между подходами отдыхай 90–120 секунд.'
            )

        return (
            'Это заглушка ИИ-тренера (LLM_PROVIDER=mock). '
            'Добавь GIGACHAT_AUTH_KEY в docker-compose и переключи '
            'LLM_PROVIDER=gigachat, чтобы получить реальные ответы.\n\n'
            f'Ты написал: «{user_text[:200]}»'
        )


# ---------- Одиночный экземпляр клиента ----------

_client_instance = None
_client_lock = threading.Lock()


def get_llm_client():
    """
    Ленивая инициализация клиента. Выбор провайдера через LLM_PROVIDER:
      - 'gigachat' (дефолт): требует GIGACHAT_AUTH_KEY
      - 'mock': заглушка, ключ не нужен
    """
    global _client_instance

    if _client_instance is not None:
        return _client_instance

    with _client_lock:
        if _client_instance is not None:
            return _client_instance

        provider = os.environ.get('LLM_PROVIDER', 'gigachat').lower()
        auth_key = os.environ.get('GIGACHAT_AUTH_KEY', '').strip()

        if provider == 'mock' or not auth_key:
            if provider != 'mock':
                logger.warning(
                    'GIGACHAT_AUTH_KEY не задан — включаю MockLLMClient. '
                    'Настрой ключ в docker-compose чтобы получить реальные ответы.'
                )
            _client_instance = MockLLMClient()
        else:
            scope = os.environ.get('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS')
            model = os.environ.get('GIGACHAT_MODEL', 'GigaChat')
            verify_ssl_env = os.environ.get('GIGACHAT_VERIFY_SSL', 'false').lower()
            verify_ssl = verify_ssl_env in ('true', '1', 'yes')
            _client_instance = GigaChatClient(
                auth_key=auth_key,
                scope=scope,
                model=model,
                verify_ssl=verify_ssl,
            )

        return _client_instance