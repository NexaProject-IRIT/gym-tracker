"""
Парсит блоки <workout>...</workout> из ответа LLM.

Бот умеет возвращать тренировку в виде:
  Какой-то текст перед блоком.
  <workout>{"name":"...","type":"strength","exercises":[...]}</workout>
  Какой-то текст после.

Мы разбираем JSON, валидируем структуру (чтобы не сохранять мусор в БД на фронте),
а сам <workout>-блок вырезаем из видимого текста — пользователю показывается
только человеческая часть ответа + кнопка «Добавить тренировку» отдельной карточкой.
"""
import re
import json
import logging
from datetime import date as date_cls
from typing import Optional


logger = logging.getLogger(__name__)


WORKOUT_BLOCK_RE = re.compile(r'<workout>(.*?)</workout>', re.DOTALL | re.IGNORECASE)
IMPORT_BLOCK_RE  = re.compile(r'<import>(.*?)</import>',   re.DOTALL | re.IGNORECASE)
RENAME_BLOCK_RE  = re.compile(r'<rename>(.*?)</rename>',   re.DOTALL | re.IGNORECASE)

ALLOWED_WORKOUT_TYPES = {'strength', 'cardio', 'flexibility', 'functional', 'custom'}
ALLOWED_EXERCISE_KEYS = {'name', 'sets', 'reps', 'weight', 'time', 'distance'}


def _clean_exercise(raw: dict) -> Optional[dict]:
    """Нормализуем упражнение. Обязательное поле — name, всё остальное опционально."""
    if not isinstance(raw, dict):
        return None

    name = raw.get('name')
    if not isinstance(name, str) or not name.strip():
        return None

    cleaned = {'name': name.strip()}

    # Числовые поля — приводим к числам, отбрасываем мусор.
    for key in ('sets', 'reps'):
        val = raw.get(key)
        if isinstance(val, (int, float)) and val >= 0:
            cleaned[key] = int(val)

    for key in ('weight', 'time', 'distance'):
        val = raw.get(key)
        if isinstance(val, (int, float)) and val >= 0:
            cleaned[key] = float(val)

    # Игнорируем все остальные ключи, чтобы случайно не пробросить что-то опасное.
    return cleaned


def _validate_workout(raw: dict) -> Optional[dict]:
    """Проверяет, что распаршенный JSON похож на тренировку, и нормализует её."""
    if not isinstance(raw, dict):
        return None

    name = raw.get('name')
    if not isinstance(name, str) or not name.strip():
        return None

    wtype = raw.get('type', 'custom')
    if wtype not in ALLOWED_WORKOUT_TYPES:
        wtype = 'custom'

    exercises_raw = raw.get('exercises')
    if not isinstance(exercises_raw, list) or not exercises_raw:
        return None

    exercises = []
    for item in exercises_raw:
        cleaned = _clean_exercise(item)
        if cleaned:
            exercises.append(cleaned)

    if not exercises:
        return None

    return {
        'name': name.strip()[:255],  # в БД у нас CharField(max_length=255)
        'type': wtype,
        'exercises': exercises,
    }


def extract_workout_suggestion(raw_response: str) -> tuple[str, Optional[dict]]:
    """
    Разделяет ответ LLM на (видимый текст, распарсенный workout или None).

    Блок <workout> из видимого текста вырезается — пользователь не должен
    видеть JSON в сообщении, иначе смотрится мусорно.
    """
    if not raw_response:
        return '', None

    match = WORKOUT_BLOCK_RE.search(raw_response)
    if not match:
        return raw_response.strip(), None

    json_text = match.group(1).strip()
    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        # Бот иногда возвращает JSON с трейлинг-запятыми или в одинарных кавычках.
        # Если сломано — оставляем <workout>-блок в тексте «как есть»,
        # чтобы пользователь хотя бы видел что бот пытался сделать.
        logger.warning('Не смог распарсить <workout>-JSON: %s; ошибка: %s', json_text[:200], e)
        return raw_response.strip(), None

    workout = _validate_workout(parsed)

    # Удаляем весь <workout>...</workout> блок из текста, возвращаем чистое сообщение.
    visible_text = WORKOUT_BLOCK_RE.sub('', raw_response).strip()
    # Подчищаем лишние переносы строк, которые остались после вырезания блока.
    visible_text = re.sub(r'\n{3,}', '\n\n', visible_text)

    if workout is None:
        logger.warning('Workout не прошёл валидацию, игнорирую: %s', parsed)
        return visible_text, None

    return visible_text, workout


def _validate_import_workout(raw: dict, today_str: str) -> Optional[dict]:
    """Нормализует одну тренировку из массива импорта."""
    if not isinstance(raw, dict):
        return None

    name = str(raw.get('name', '')).strip() or 'Тренировка'

    wtype = raw.get('type', 'custom')
    if wtype not in ALLOWED_WORKOUT_TYPES:
        wtype = 'custom'

    raw_date = raw.get('date', '')
    if raw_date:
        try:
            # Принимаем только ISO-формат YYYY-MM-DD — именно такой просим у модели
            date_cls.fromisoformat(str(raw_date))
            workout_date = str(raw_date)
        except ValueError:
            workout_date = today_str
    else:
        workout_date = today_str

    exercises_raw = raw.get('exercises', [])
    if not isinstance(exercises_raw, list):
        exercises_raw = []

    exercises = [ex for item in exercises_raw if (ex := _clean_exercise(item))]

    return {
        'name': name[:255],
        'type': wtype,
        'date': workout_date,
        'exercises': exercises,
    }


def extract_workout_imports(raw_response: str) -> tuple[str, Optional[list]]:
    """
    Ищет <import>[...массив тренировок...]</import> в ответе LLM.
    Возвращает (видимый текст без блока, список тренировок или None).
    """
    if not raw_response:
        return '', None

    match = IMPORT_BLOCK_RE.search(raw_response)
    if not match:
        return raw_response.strip(), None

    today_str = date_cls.today().isoformat()
    json_text = match.group(1).strip()

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.warning('Не смог распарсить <import>-JSON: %s; ошибка: %s', json_text[:200], e)
        return raw_response.strip(), None

    if not isinstance(parsed, list):
        logger.warning('<import>-блок не является массивом, игнорирую')
        return raw_response.strip(), None

    validated = [w for item in parsed if (w := _validate_import_workout(item, today_str))]

    visible_text = IMPORT_BLOCK_RE.sub('', raw_response).strip()
    visible_text = re.sub(r'\n{3,}', '\n\n', visible_text)

    if not validated:
        logger.warning('Ни одна тренировка из <import>-блока не прошла валидацию')
        return visible_text, None

    return visible_text, validated


def extract_workout_renames(raw_response: str) -> tuple[str, Optional[list]]:
    """
    Ищет <rename>[...]</rename> в ответе LLM.
    Возвращает (видимый текст без блока, список переименований или None).
    Формат каждого элемента: {"id": "uuid-строка", "new_name": "Новое название"}.
    """
    if not raw_response:
        return '', None

    match = RENAME_BLOCK_RE.search(raw_response)
    if not match:
        return raw_response.strip(), None

    json_text = match.group(1).strip()
    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.warning('Не смог распарсить <rename>-JSON: %s; ошибка: %s', json_text[:200], e)
        return raw_response.strip(), None

    if not isinstance(parsed, list):
        logger.warning('<rename>-блок не является массивом, игнорирую')
        return raw_response.strip(), None

    validated = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        workout_id = str(item.get('id', '')).strip()
        new_name = str(item.get('new_name', '')).strip()[:255]
        if workout_id and new_name:
            validated.append({'id': workout_id, 'new_name': new_name})

    visible_text = RENAME_BLOCK_RE.sub('', raw_response).strip()
    visible_text = re.sub(r'\n{3,}', '\n\n', visible_text)

    if not validated:
        logger.warning('Ни одно переименование из <rename>-блока не прошло валидацию')
        return visible_text, None

    return visible_text, validated