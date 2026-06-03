"""
API-тесты GymLog.  Запуск: pytest --tb=short
Покрытие: регистрация, логин, профиль, тренировки (CRUD), AI-чат (mock).
"""
import pytest
from rest_framework.test import APIClient

# ── URL-константы ──────────────────────────────────────────────────────────────

REGISTER = '/auth/register/'
LOGIN    = '/auth/login/'
PROFILE  = '/auth/profile/'
WORKOUTS = '/workouts/'
AI_CHAT  = '/ai/chat/'
AI_HIST  = '/ai/history/'

# Валидный пароль: ≥6 символов, не только цифры (MinimumLength + NumericPasswordValidator)
VALID_PWD = 'Gymlog1234!'


# ── Фикстуры ───────────────────────────────────────────────────────────────────

@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def auth(api):
    """Регистрирует пользователя и возвращает авторизованный клиент."""
    resp = api.post(REGISTER, {
        'username': 'gymuser',
        'password': VALID_PWD,
        'password2': VALID_PWD,
    }, format='json')
    assert resp.status_code == 201, resp.data
    api.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    return api


WORKOUT_DATA = {
    'name': 'Утренняя силовая',
    'type': 'strength',
    'date': '2024-06-01',
    'notes': 'тест',
    'exercises': [
        {
            'customName': 'Приседания',
            'sets': 4,
            'reps': 8,
            'weight': 80.0,
            'isCustom': True,
            'parameters': ['sets', 'reps', 'weight'],
        }
    ],
}


# ── 1-4: Регистрация ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_register_success(api):
    resp = api.post(REGISTER, {
        'username': 'newuser',
        'password': VALID_PWD,
        'password2': VALID_PWD,
    }, format='json')
    assert resp.status_code == 201
    assert 'access' in resp.data
    assert 'refresh' in resp.data
    assert resp.data['user']['username'] == 'newuser'


@pytest.mark.django_db
def test_register_duplicate_username(api):
    data = {'username': 'dupuser', 'password': VALID_PWD, 'password2': VALID_PWD}
    api.post(REGISTER, data, format='json')
    resp = api.post(REGISTER, data, format='json')
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_password_too_short(api):
    """Пароль короче 6 символов должен отклоняться MinimumLengthValidator."""
    resp = api.post(REGISTER, {
        'username': 'shortpwd',
        'password': 'abc1',
        'password2': 'abc1',
    }, format='json')
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_password_numeric_only(api):
    """Пароль из одних цифр должен отклоняться NumericPasswordValidator."""
    resp = api.post(REGISTER, {
        'username': 'numericpwd',
        'password': '12345678',
        'password2': '12345678',
    }, format='json')
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_passwords_mismatch(api):
    resp = api.post(REGISTER, {
        'username': 'mismatch',
        'password': VALID_PWD,
        'password2': VALID_PWD + 'X',
    }, format='json')
    assert resp.status_code == 400


# ── 5-6: Логин ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_login_success(api):
    api.post(REGISTER, {'username': 'loginok', 'password': VALID_PWD, 'password2': VALID_PWD}, format='json')
    resp = api.post(LOGIN, {'username': 'loginok', 'password': VALID_PWD}, format='json')
    assert resp.status_code == 200
    assert 'access' in resp.data


@pytest.mark.django_db
def test_login_wrong_password(api):
    api.post(REGISTER, {'username': 'loginfail', 'password': VALID_PWD, 'password2': VALID_PWD}, format='json')
    resp = api.post(LOGIN, {'username': 'loginfail', 'password': 'WrongPass999!'}, format='json')
    assert resp.status_code == 401


# ── 7-8: Профиль ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_profile_returns_username(auth):
    resp = auth.get(PROFILE)
    assert resp.status_code == 200
    assert resp.data['username'] == 'gymuser'


@pytest.mark.django_db
def test_profile_requires_auth(api):
    resp = api.get(PROFILE)
    assert resp.status_code == 401


# ── 9-13: Тренировки ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_create_workout(auth):
    resp = auth.post(WORKOUTS, WORKOUT_DATA, format='json')
    assert resp.status_code == 201
    assert resp.data['name'] == 'Утренняя силовая'
    assert 'id' in resp.data
    assert len(resp.data['exercises']) == 1


@pytest.mark.django_db
def test_list_workouts(auth):
    auth.post(WORKOUTS, WORKOUT_DATA, format='json')
    auth.post(WORKOUTS, {**WORKOUT_DATA, 'name': 'Вечерняя', 'date': '2024-06-02'}, format='json')
    resp = auth.get(WORKOUTS)
    assert resp.status_code == 200
    assert len(resp.data) == 2


@pytest.mark.django_db
def test_workout_detail(auth):
    uid = auth.post(WORKOUTS, WORKOUT_DATA, format='json').data['id']
    resp = auth.get(f'{WORKOUTS}{uid}/')
    assert resp.status_code == 200
    assert resp.data['id'] == uid
    assert resp.data['type'] == 'strength'


@pytest.mark.django_db
def test_delete_workout(auth):
    uid = auth.post(WORKOUTS, WORKOUT_DATA, format='json').data['id']
    assert auth.delete(f'{WORKOUTS}{uid}/').status_code == 204
    assert auth.get(f'{WORKOUTS}{uid}/').status_code == 404


@pytest.mark.django_db
def test_workout_requires_auth(api):
    resp = api.post(WORKOUTS, WORKOUT_DATA, format='json')
    assert resp.status_code == 401


# ── 14-16: AI-чат (MockLLMClient) ─────────────────────────────────────────────

@pytest.mark.django_db
def test_ai_chat_response(auth):
    resp = auth.post(AI_CHAT, {'message': 'Привет, тренер!'}, format='json')
    assert resp.status_code == 200
    assert 'user_message' in resp.data
    assert 'assistant_message' in resp.data
    assert resp.data['assistant_message']['content']


@pytest.mark.django_db
def test_ai_chat_workout_suggestion(auth):
    """MockLLMClient возвращает <workout>-блок на ключевое слово 'составь'."""
    resp = auth.post(AI_CHAT, {'message': 'составь тренировку на ноги'}, format='json')
    assert resp.status_code == 200
    assert resp.data['assistant_message']['workout_suggestion'] is not None
    suggestion = resp.data['assistant_message']['workout_suggestion']
    assert 'name' in suggestion
    assert 'exercises' in suggestion


@pytest.mark.django_db
def test_ai_history_and_clear(auth):
    auth.post(AI_CHAT, {'message': 'Привет'}, format='json')
    assert auth.get(AI_HIST).data['messages'] != []

    auth.delete(AI_HIST)
    assert auth.get(AI_HIST).data['messages'] == []
