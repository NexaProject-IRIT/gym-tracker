import json
import asyncio
from pathlib import Path

from .md_parser import OUTPUT_JSON_PATH


def load_exercises_from_json(json_path: Path) -> list:
    if not json_path.exists():
        print(f"[exercise_sync] JSON не найден: {json_path}")
        return []

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("[exercise_sync] Ошибка: exercises.json должен содержать список")
        return []

    return data


def sync_exercises_to_api() -> None:
    from exercises.models import Exercise

    exercises = load_exercises_from_json(OUTPUT_JSON_PATH)

    if not exercises:
        print("[exercise_sync] Нет упражнений для отправки")
        return

    success_count = 0
    skip_count = 0
    fail_count = 0

    for exercise_data in exercises:
        try:
            name = exercise_data.get("name")
            existing = Exercise.objects.filter(name=name).first()
            if existing:
                print(f"[exercise_sync] SKIP: {name} (уже существует, ID: {existing.id})")
                skip_count += 1
                continue

            exercise_data['target_muscles'] = exercise_data.pop('tags', [])
            exercise_data['source_file'] = exercise_data.pop('source_file', '')

            images = exercise_data.get('images', [])
            if isinstance(images, list):
                exercise_data['images'] = {
                    'cover': images[0] if len(images) > 0 else '',
                    'technique': images[1:] if len(images) > 1 else [],
                    'muscleMap': ''
                }
            exercise = Exercise.objects.create(**exercise_data)
            print(f"[exercise_sync] OK: {name} (ID: {exercise.id})")
            success_count += 1

        except Exception as e:
            print(f"[exercise_sync] ERROR: {exercise_data.get('name')} | {e}")
            fail_count += 1

    print(
        f"[exercise_sync] Синхронизация завершена. "
        f"Успешно: {success_count}, Пропущено (дубликаты): {skip_count}, Ошибок: {fail_count}"
    )


async def sync_exercises_to_api_after_startup():
    await asyncio.sleep(8)
    sync_exercises_to_api()