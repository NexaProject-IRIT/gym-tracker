import json
import asyncio
from pathlib import Path
import requests

from app.md_parser import OUTPUT_JSON_PATH


API_URL = "http://backend:8000/exercises/"



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


def send_exercise_to_api(exercise: dict) -> bool:
    try:
        response = requests.post(API_URL, json=exercise, timeout=30)

        if response.status_code in (200, 201):
            print(f"[exercise_sync] OK: {exercise.get('name')}")
            return True

        print(
            f"[exercise_sync] ERROR: {exercise.get('name')} | "
            f"status={response.status_code} | body={response.text}"
        )
        return False

    except requests.RequestException as e:
        print(f"[exercise_sync] REQUEST FAILED: {exercise.get('name')} | {e}")
        return False


def sync_exercises_to_api() -> None:
    exercises = load_exercises_from_json(OUTPUT_JSON_PATH)

    if not exercises:
        print("[exercise_sync] Нет упражнений для отправки")
        return

    success_count = 0
    fail_count = 0

    for exercise in exercises:
        if send_exercise_to_api(exercise):
            success_count += 1
        else:
            fail_count += 1

    print(
        f"[exercise_sync] Синхронизация завершена. "
        f"Успешно: {success_count}, Ошибок: {fail_count}"
    )


async def sync_exercises_to_api_after_startup():
    await asyncio.sleep(8)
    sync_exercises_to_api()