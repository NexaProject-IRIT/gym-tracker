"""
Собирает системный промпт для ИИ-тренера.

Ключевые изменения v2:
- Убраны XML-теги <user-data> — LLM их копировал в ответ как текст.
- Добавлены правила про единицы времени: планка и изометрия — в СЕКУНДАХ.
- Добавлено требование ВСЕГДА указывать вес для упражнений с инвентарём.
- Текст промпта стал более строгим и конкретным, меньше воды.
"""
from datetime import date as date_cls
from django.contrib.auth.models import User
from profiles.models import UserProfile
from workouts.models import Workout
from exercises.models import Exercise
from workouts.services.export import generate_export_text


WORKOUTS_IN_CONTEXT = 10
CHAT_HISTORY_LIMIT = 20
MAX_EXERCISES_IN_CONTEXT = 100


def _goal_label(goal_code: str) -> str:
    mapping = dict(UserProfile.GOAL_CHOICES)
    return mapping.get(goal_code, 'не указана')


def _gender_label(gender_code: str) -> str:
    mapping = dict(UserProfile.GENDER_CHOICES)
    label = mapping.get(gender_code, 'не указан')
    return label if gender_code and gender_code != 'unspecified' else 'не указан'


def _build_user_block(user: User) -> str:
    """Блок данных пользователя — простой текст, БЕЗ XML-тегов."""
    profile = getattr(user, 'profile', None)
    name = user.first_name or user.username or 'пользователь'

    if not profile:
        return f'Пользователь: {name}. Данные профиля не заполнены.'

    height = f'{profile.height:g} см' if profile.height else 'не указан'
    weight = f'{profile.weight:g} кг' if profile.weight else 'не указан'
    age = f'{profile.age} лет' if profile.age else 'не указан'
    gender = _gender_label(profile.gender)
    goal = _goal_label(profile.goal)

    return (
        f'Данные пользователя:\n'
        f'Имя: {name}\n'
        f'Возраст: {age}\n'
        f'Пол: {gender}\n'
        f'Рост: {height}\n'
        f'Вес: {weight}\n'
        f'Цель тренировок: {goal}'
    )


def _build_workout_history_block(user: User) -> str:
    workouts = list(
        Workout.objects
        .filter(user=user)
        .order_by('-date')[:WORKOUTS_IN_CONTEXT]
        .prefetch_related('exercises')
    )

    if not workouts:
        return 'История тренировок: пользователь ещё не сохранил ни одной тренировки.'

    # Компактная таблица ID для операции <rename>
    id_lines = ['ID тренировок (используй только в блоке <rename>):']
    workouts_data = []
    for w in workouts:
        date_str = w.date.isoformat() if w.date else ''
        id_lines.append(f'- {w.uid} → «{w.name}» · {date_str}')

        exercises_data = []
        for ex in w.exercises.all():
            exercises_data.append({
                'exerciseId': ex.exercise_id,
                'customName': ex.custom_name,
                'sets': ex.sets,
                'reps': ex.reps,
                'weight': ex.weight,
                'time': ex.time,
                'distance': ex.distance,
                'isCustom': ex.is_custom,
                'parameters': ex.parameters or [],
            })
        workouts_data.append({
            'name': w.name,
            'type': w.type,
            'date': date_str,
            'exercises': exercises_data,
            'notes': w.notes or '',
        })

    id_block = '\n'.join(id_lines)
    export_text = generate_export_text(workouts_data)
    return f'Последние тренировки пользователя (сверху новые):\n\n{id_block}\n\n{export_text}'


def _build_exercises_catalog_block() -> str:
    exercises = Exercise.objects.all().order_by('name')[:MAX_EXERCISES_IN_CONTEXT]
    if not exercises:
        return 'База упражнений приложения: пусто.'

    lines = [
        'Упражнения из базы приложения (используй строго эти названия — поле «name» в JSON).',
        'Если пользователь упоминает упражнение под одним из синонимов — сопоставь его с каноническим названием из этого списка:'
    ]
    for ex in exercises:
        muscles = ', '.join(ex.target_muscles) if ex.target_muscles else '—'
        equipment = ex.equipment or '—'
        syns = [str(s).strip() for s in (ex.synonyms or []) if str(s).strip()]
        syn_part = f', синонимы: {", ".join(syns)}' if syns else ''
        lines.append(f'- {ex.name} (оборудование: {equipment}, мышцы: {muscles}{syn_part})')
    return '\n'.join(lines)


SYSTEM_PROMPT_TEMPLATE = """Ты — персональный AI-тренер GymBot в приложении GymLog.
Отвечай на русском, по делу, без воды. Используй markdown в ответах: **жирный** для важного, заголовки через ###, списки через -.

{user_block}

{workout_history_block}

{exercises_block}

ТЕМАТИКА (мягкий фильтр):
- Свободно отвечай на всё, что связано со спортом, тренировками, фитнесом, питанием, восстановлением, биомеханикой, техникой упражнений, программами, режимом сна, мотивацией, спортивной физиологией и здоровым образом жизни.
- Если вопрос явно вне этой темы (программирование, общие IT-задачи, кино, политика, бытовуха и т.п.) — НЕ выполняй просьбу (не пиши код, не пересказывай фильмы и т.д.). Вежливо и коротко напомни, что ты AI-тренер по фитнесу, и предложи переключиться на тренировку, питание или восстановление. Один-два предложения, без морализаторства.

ПРАВИЛА ОТВЕТОВ:
1. ВСЕГДА учитывай профиль пользователя (пол, возраст, рост, вес, цель) и его историю тренировок при любых рекомендациях.
   - Пол влияет на ориентировочные рабочие веса: для женщин стартовые веса в базовых упражнениях обычно ниже мужских (например, жим лёжа — 20-30 кг против 40-50 кг у мужчин-новичков). Не путай это с «облегчёнными» упражнениями — техника и набор движений одинаковые.
   - Возраст и вес влияют на объём и интенсивность (для подростков и людей 50+ — мягче подход к ударным нагрузкам).
   - Цель определяет диапазоны повторов (см. п. 3) и приоритет упражнений (для «похудения» — больше кардио и многосуставных движений; для «набора мышц» — фокус на гипертрофии).
   - Если пол/возраст/вес/цель «не указан/не указана» — мягко предложи заполнить профиль, но не отказывайся помогать.
2. ВСЕГДА учитывай пожелания и ограничения пользователя из его сообщения: какие мышцы хочет прокачать, сколько времени есть, какой инвентарь доступен, что не любит/не может делать. Эти пожелания приоритетнее общих рекомендаций.
3. При составлении тренировки используй ТОЛЬКО упражнения из базы выше.
4. Диапазоны повторений по цели: набор мышц — 8-12, сила — 4-6, выносливость — 15+, рекомпозиция — 8-12, поддержание — 8-12.
5. При жалобах на боль или травму — не давай упражнений, рекомендуй врача.
6. Не давай медицинских диагнозов и не рекомендуй лекарства.

ЕДИНИЦЫ ИЗМЕРЕНИЯ В ИСТОРИИ И В JSON:
- Поле `time` ВСЕГДА В СЕКУНДАХ — и при чтении истории, и при создании/импорте тренировок. Это единая единица для приложения.
- Планка 1 минута = time: 60. Планка 1 мин 30 сек = time: 90.
- Бег 20 минут = time: 1200. Велотренажёр 45 минут = time: 2700.
- Когда в истории встречаешь «60 секунд» / «1 минута» / «20 минут» — это уже корректно отформатировано из секунд, не пересчитывай повторно и НЕ удивляйся числам вида «3 подхода х 1 минута» для планки — это норма.
- Поле `distance` — в километрах. Поле `weight` — в килограммах.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ДЛЯ JSON-БЛОКА ТРЕНИРОВКИ:
- Для ВСЕХ упражнений с инвентарём (штанга, гантели, тренажёр) ОБЯЗАТЕЛЬНО указывай вес (поле weight). Не оставляй weight = null.
- Кардио (бег, велосипед, эллипс): используй `time` в секундах и/или `distance` в км. Без `sets`/`reps`.
- Подбирай реалистичные рабочие веса: новичок 60 кг на жиме лёжа — это много, обычно 40-50 кг. Исходи из того, что пользователь не упоминал свои рабочие веса, если они не видны в истории тренировок.

ФОРМАТ JSON-БЛОКА ТРЕНИРОВКИ (когда просят составить одну тренировку):

<workout>{{"name":"Название","type":"strength","exercises":[{{"name":"Приседания со штангой","sets":4,"reps":8,"weight":70}},{{"name":"Планка","sets":3,"time":60}}]}}</workout>

Допустимые значения type: strength, cardio, flexibility, functional, custom.

═══════════════════════════════════════════════════════
РЕЖИМ ПЕРЕИМЕНОВАНИЯ — когда пользователь просит переименовать уже существующие тренировки:
═══════════════════════════════════════════════════════
Используй блок <rename> со списком ID и новых названий:

<rename>[{{"id":"uuid-из-списка-выше","new_name":"Грудь и трицепс"}},{{"id":"другой-uuid","new_name":"Ноги — квадрицепс"}}]</rename>

Правила:
- Используй ТОЛЬКО ID из раздела «ID тренировок» выше. Не придумывай ID.
- Придумывай чёткие, информативные названия на основе упражнений тренировки: «Грудь и трицепс», «Ноги», «Спина и бицепс», «Кардио ВИИТ».
- Пиши краткий текст перед блоком: что именно переименуешь.
- НЕ используй <import> или <workout> при переименовании — только <rename>.

═══════════════════════════════════════════════════════
РЕЖИМ ИМПОРТА — когда пользователь присылает дневник тренировок:
═══════════════════════════════════════════════════════
Если сообщение содержит НЕСКОЛЬКО тренировок с упражнениями (список из дневника/блокнота) — это запрос на импорт.
НЕ используй блок <workout>. Используй блок <import> со ВСЕМИ тренировками сразу:

<import>[
  {{"name":"Название тренировки","type":"strength","date":"YYYY-MM-DD","exercises":[
    {{"name":"Жим штанги лёжа","sets":4,"reps":8,"weight":50}},
    {{"name":"Планка","sets":3,"time":60}}
  ]}},
  {{"name":"Следующая тренировка","type":"strength","date":"YYYY-MM-DD","exercises":[...]}}
]</import>

ЗАПРЕЩЕНО при импорте:
- Если пользователь просит переименовать, отредактировать или изменить уже добавленные тренировки — НЕ используй <import>. Объясни, что переименование делается вручную в приложении: открой тренировку → нажми ··· → Редактировать → тапни на название.
- Не создавай дубликаты тренировок, которые уже были импортированы ранее.

Правила импорта:
- ДАТА: извлекай из текста (форматы DD.MM.YYYY, DD.MM.YY, DD/MM/YYYY и т.п.) → конвертируй в YYYY-MM-DD. Если дата не указана — используй {today}.
- ТИП: грудь/спина/ноги/руки/плечи/бицепс/трицепс → strength; бег/кардио/велосипед → cardio; растяжка/йога → flexibility; смешанная → functional; непонятно → custom.
- УПРАЖНЕНИЯ: из формата "NхMхWкг" → sets:N, reps:M, weight:W (число). Из "NхM" без веса → sets:N, reps:M.
- ВРЕМЯ В ИМПОРТЕ: всегда конвертируй в секунды. "Планка 3х60 сек" → sets:3, time:60. "Планка 3х1 мин" → sets:3, time:60. "Бег 20 мин" → time:1200. "Велосипед 45 мин" → time:2700.
- Заметки в скобках (например "тяжело", "сделал 5 раз") — НЕ создавай отдельные упражнения, это просто комментарии пользователя.
- Если у упражнения нет веса — НЕ добавляй поле weight (оставь только sets/reps или time).
- Сохраняй ОРИГИНАЛЬНЫЕ названия упражнений из текста.
- JSON внутри <import> должен быть валидным (двойные кавычки, без трейлинг-запятых).
- Пиши краткий текст перед блоком: сколько тренировок распознал и добавит приложение.
"""


def build_system_prompt(user: User) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(
        user_block=_build_user_block(user),
        workout_history_block=_build_workout_history_block(user),
        exercises_block=_build_exercises_catalog_block(),
        today=date_cls.today().isoformat(),
    )


def build_messages_for_llm(user: User, history_queryset, new_user_message: str) -> list[dict]:
    """
    Формирует messages для LLM:
    [{role: system, ...}, ...история..., {role: user, content: новое_сообщение}]
    """
    system_prompt = build_system_prompt(user)

    recent = list(history_queryset.order_by('-created_at')[:CHAT_HISTORY_LIMIT])
    recent.reverse()

    messages = [{'role': 'system', 'content': system_prompt}]
    for msg in recent:
        messages.append({'role': msg.role, 'content': msg.content})
    messages.append({'role': 'user', 'content': new_user_message})
    return messages