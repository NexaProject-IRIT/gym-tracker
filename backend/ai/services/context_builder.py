"""
Собирает системный промпт для ИИ-тренера.

Ключевые изменения v2:
- Убраны XML-теги <user-data> — GigaChat их копировал в ответ как текст.
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


def _build_user_block(user: User) -> str:
    """Блок данных пользователя — простой текст, БЕЗ XML-тегов."""
    profile = getattr(user, 'profile', None)
    name = user.first_name or user.username or 'пользователь'

    if not profile:
        return f'Пользователь: {name}. Данные профиля не заполнены.'

    height = f'{profile.height:g} см' if profile.height else 'не указан'
    weight = f'{profile.weight:g} кг' if profile.weight else 'не указан'
    age = f'{profile.age} лет' if profile.age else 'не указан'
    goal = _goal_label(profile.goal)

    return (
        f'Данные пользователя:\n'
        f'Имя: {name}\n'
        f'Возраст: {age}\n'
        f'Рост: {height}\n'
        f'Вес: {weight}\n'
        f'Цель тренировок: {goal}'
    )


def _build_workout_history_block(user: User) -> str:
    workouts = (
        Workout.objects
        .filter(user=user)
        .order_by('-date')[:WORKOUTS_IN_CONTEXT]
        .prefetch_related('exercises')
    )

    if not workouts:
        return 'История тренировок: пользователь ещё не сохранил ни одной тренировки.'

    workouts_data = []
    for w in workouts:
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
            'date': w.date.isoformat() if w.date else '',
            'exercises': exercises_data,
            'notes': w.notes or '',
        })

    export_text = generate_export_text(workouts_data)
    return f'Последние тренировки пользователя (сверху новые):\n\n{export_text}'


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

ПРАВИЛА ОТВЕТОВ:
1. Опирайся на реальные данные пользователя и его историю тренировок.
2. При составлении тренировки используй ТОЛЬКО упражнения из базы выше.
3. Для набора мышц — 8-12 повторений, для силы — 4-6, для выносливости — 15+.
4. При жалобах на боль или травму — не давай упражнений, рекомендуй врача.
5. Не давай медицинских диагнозов и не рекомендуй лекарства.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ДЛЯ JSON-БЛОКА ТРЕНИРОВКИ:
- Для ВСЕХ упражнений с инвентарём (штанга, гантели, тренажёр) ОБЯЗАТЕЛЬНО указывай вес (поле weight). Не оставляй weight = null.
- Время (поле time) для изометрических упражнений (планка, вис, статика) — ВСЕГДА В СЕКУНДАХ. Планка 60 секунд = time: 60. НЕ МИНУТЫ.
- Кардио-время (бег, велосипед, эллипс) — в минутах в поле time, без поля sets/reps.
- Подбирай реалистичные рабочие веса: новичок 60 кг на жиме лёжа — это много, обычно 40-50 кг. Исходи из того, что пользователь не упоминал свои рабочие веса, если они не видны в истории тренировок.

ФОРМАТ JSON-БЛОКА ТРЕНИРОВКИ (когда просят составить одну тренировку):

<workout>{{"name":"Название","type":"strength","exercises":[{{"name":"Приседания со штангой","sets":4,"reps":8,"weight":70}},{{"name":"Планка","sets":3,"time":60}}]}}</workout>

Допустимые значения type: strength, cardio, flexibility, functional, custom.

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

Правила импорта:
- ДАТА: извлекай из текста (форматы DD.MM.YYYY, DD.MM.YY, DD/MM/YYYY и т.п.) → конвертируй в YYYY-MM-DD. Если дата не указана — используй {today}.
- ТИП: грудь/спина/ноги/руки/плечи/бицепс/трицепс → strength; бег/кардио/велосипед → cardio; растяжка/йога → flexibility; смешанная → functional; непонятно → custom.
- УПРАЖНЕНИЯ: из формата "NхMхWкг" → sets:N, reps:M, weight:W (число). Из "NхMсек" или планка с "NхM" → sets:N, time:M. Из "NхM" без веса → sets:N, reps:M.
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
    Формирует messages для GigaChat:
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