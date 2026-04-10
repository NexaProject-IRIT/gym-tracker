from datetime import datetime, timezone
from typing import Any


WORKOUT_TYPE_LABELS = {
    "strength": "силовая тренировка",
    "cardio": "кардио",
    "flexibility": "тренировка на гибкость",
    "functional": "функциональная тренировка",
    "custom": "пользовательская тренировка",
}


def pluralize(value: int, forms: tuple[str, str, str]) -> str:
    value = abs(int(value))
    if 11 <= value % 100 <= 14:
        return forms[2]
    if value % 10 == 1:
        return forms[0]
    if 2 <= value % 10 <= 4:
        return forms[1]
    return forms[2]


def format_number(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return f"{value:.2f}".rstrip("0").rstrip(".")
    return str(value)


def parse_date(date_value: Any) -> datetime | None:
    if isinstance(date_value, datetime):
        dt = date_value
    elif isinstance(date_value, str):
        raw = date_value.strip()
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"

        try:
            dt = datetime.fromisoformat(raw)
        except ValueError:
            return None
    else:
        return None

    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)

    return dt


def format_date(date_value: Any) -> str:
    dt = parse_date(date_value)
    if dt:
        return dt.strftime("%d.%m.%Y")
    return str(date_value) if date_value else ""


def get_exercise_name(exercise: dict) -> str:
    return (
        exercise.get("customName")
        or exercise.get("exerciseName")
        or exercise.get("exerciseId")
        or "Без названия"
    )


def build_exercise_stats_line(exercise: dict) -> str:
    sets = exercise.get("sets")
    reps = exercise.get("reps")
    weight = exercise.get("weight")
    time_value = exercise.get("time")

    parts = []

    if sets not in (None, 0):
        sets = int(sets)
        parts.append(f"{sets} {pluralize(sets, ('подход', 'подхода', 'подходов'))}")

    if reps not in (None, 0):
        reps = int(reps)
        parts.append(f"{reps} {pluralize(reps, ('повторение', 'повторения', 'повторений'))}")

    if weight not in (None, "", 0):
        parts.append(f"{format_number(weight)} кг")
    elif reps in (None, 0) and time_value not in (None, "", 0):
        time_value = int(time_value)
        parts.append(f"{time_value} {pluralize(time_value, ('минута', 'минуты', 'минут'))}")

    return " х ".join(parts)


def generate_export_text(workouts_data: list[dict]) -> str:
    """
    Формирует текст для экспорта тренировок в .txt.
    Принимает список тренировок и возвращает готовую строку.
    """
    if not workouts_data:
        return ""

    sorted_workouts = sorted(
        workouts_data,
        key=lambda w: parse_date(w.get("date")) or datetime.min,
        reverse=True,
    )

    blocks = []

    for workout in sorted_workouts:
        name = workout.get("name") or "Без названия"
        date = format_date(workout.get("date"))
        wtype = WORKOUT_TYPE_LABELS.get(str(workout.get("type")), str(workout.get("type")))
        exercises = workout.get("exercises") or []
        notes = workout.get("notes") or ""

        lines = [f"{name} {date} {wtype}"]

        for ex in exercises:
            ex_name = get_exercise_name(ex)
            stats = build_exercise_stats_line(ex)

            if stats:
                lines.append(f"{ex_name} {stats}")
            else:
                lines.append(ex_name)

        if notes:
            lines.append(f"\nЗаметка: {notes}")

        blocks.append("\n".join(lines))

    return "\n\n".join(blocks)