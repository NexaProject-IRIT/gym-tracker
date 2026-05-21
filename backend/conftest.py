import os
import pytest

# Включаем mock-LLM до инициализации Django-приложений
os.environ.setdefault('LLM_PROVIDER', 'mock')


@pytest.fixture(autouse=True, scope='session')
def _reset_llm_singleton():
    """Гарантирует, что LLM-клиент пересоздаётся заново в тестовой сессии."""
    import ai.services.gigachat as gc
    gc._client_instance = None
    yield
    gc._client_instance = None
