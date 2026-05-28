"""
Эвристика для детектирования журнала тренировок в сообщении пользователя.

Вместо того чтобы просить LLM «самостоятельно решить» что делать с текстом,
мы на бэке детектируем паттерн — и тогда отправляем модели узкий,
сфокусированный запрос-парсер, а не общий системный промпт.
"""
import re
from datetime import date as date_cls

# NxM, NхM, N×M — формат "подходы × повторения"
_SETS_REPS_RE = re.compile(r'\d+\s*[хxXХ×]\s*\d+', re.IGNORECASE)

# Дата в виде ДД.ММ.ГГГГ, ДД/ММ/ГГГГ, ДД.ММ.ГГ
_DATE_RE = re.compile(r'\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b')


def looks_like_workout_import(text: str) -> bool:
    """
    Возвращает True, если сообщение похоже на журнал из нескольких тренировок.
    Критерии (все должны выполняться):
      - ≥ 2 строк с датами (несколько отдельных тренировок)
      - ≥ 6 вхождений формата «NхM» (упражнения с подходами)
    """
    dates = _DATE_RE.findall(text)
    sets_reps = _SETS_REPS_RE.findall(text)
    return len(dates) >= 2 and len(sets_reps) >= 6


IMPORT_SYSTEM_PROMPT = (
    "Ты — точный парсер дневника тренировок. "
    "Твоя единственная задача — распарсить текст и вернуть JSON. "
    "Никакого лишнего текста, советов и анализа."
)

IMPORT_USER_PROMPT_TEMPLATE = """\
Распарси дневник тренировок ниже и верни ответ СТРОГО в формате:

[одна строка: сколько тренировок распознал]
<import>[
  {{"name":"Название","type":"strength","date":"YYYY-MM-DD","exercises":[
    {{"name":"Упражнение","sets":4,"reps":8,"weight":50}},
    {{"name":"Планка","sets":3,"time":60}}
  ]}}
]</import>

ПРАВИЛА ПАРСИНГА (соблюдать строго):
- NхMхWкг → sets:N, reps:M, weight:W (только числа, без «кг»)
- NхM без веса → sets:N, reps:M (без поля weight)
- Планка/Вис/Удержание → поле time (секунды) вместо reps
- Пирамида вида «8х80кг + 6х90кг + 4х100кг» — это ОДНО упражнение с несколькими рабочими весами. Создай отдельную запись для каждого блока: первый блок sets:8 reps:8 weight:80, второй sets:6 reps:6 weight:90 и так далее. Название упражнения одинаковое для всех блоков.
- Дата ДД.ММ.ГГГГ → формат YYYY-MM-DD. Если даты нет — {today}
- Тип тренировки: грудь/спина/бицепс/трицепс/ноги/плечи/руки → "strength"; бег/кардио → "cardio"; растяжка → "flexibility"; иначе → "custom"
- Заметки в скобках (например "тяжело", "сделал 5 раз") — игнорировать, НЕ создавать из них упражнения
- Название упражнения — точно как в тексте
- JSON должен быть валидным: двойные кавычки, без трейлинг-запятых

ДНЕВНИК:
{text}
"""


def build_import_messages(user_text: str) -> list[dict]:
    """Собирает messages для LLM в режиме парсинга импорта."""
    today = date_cls.today().isoformat()
    user_prompt = IMPORT_USER_PROMPT_TEMPLATE.format(today=today, text=user_text)
    return [
        {'role': 'system', 'content': IMPORT_SYSTEM_PROMPT},
        {'role': 'user',   'content': user_prompt},
    ]


def split_diary_into_chunks(text: str, workouts_per_chunk: int = 12) -> list[str]:
    """
    Разбивает большой дневник на чанки, чтобы каждый влез в ~8K токенов ответа LLM.
    Граница чанка — начало строки, в которой есть дата (DD.MM.YYYY или DD/MM/YY).
    Если в тексте ≤ workouts_per_chunk дат — возвращает [text] без изменений.
    """
    lines = text.split('\n')
    workout_start_lines: list[int] = []
    for i, line in enumerate(lines):
        if _DATE_RE.search(line):
            workout_start_lines.append(i)

    if len(workout_start_lines) <= workouts_per_chunk:
        return [text]

    chunks: list[str] = []
    for i in range(0, len(workout_start_lines), workouts_per_chunk):
        start_line = workout_start_lines[i]
        next_i = i + workouts_per_chunk
        end_line = workout_start_lines[next_i] if next_i < len(workout_start_lines) else len(lines)
        chunk = '\n'.join(lines[start_line:end_line]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks
