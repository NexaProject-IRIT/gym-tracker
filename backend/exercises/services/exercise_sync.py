import json
from pathlib import Path

from .md_parser import OUTPUT_JSON_PATH


def load_exercises_from_json(json_path: Path) -> list:
    if not json_path.exists():
        print(f"[exercise_sync] JSON not found: {json_path}")
        return []

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("[exercise_sync] Error: exercises.json must contain a list")
        return []

    return data


def sync_exercises_to_db() -> None:
    from exercises.models import Exercise

    exercises = load_exercises_from_json(OUTPUT_JSON_PATH)

    if not exercises:
        print("[exercise_sync] No exercises to sync")
        return

    success_count = 0
    skip_count = 0
    fail_count = 0

    for exercise_data in exercises:
        try:
            name = exercise_data.get("name", "").strip()
            if not name:
                continue

            existing = Exercise.objects.filter(name=name).first()
            if existing:
                # Update existing
                existing.description = exercise_data.get("description", "")
                existing.tags = exercise_data.get("tags", [])
                existing.target_muscles = exercise_data.get("tags", [])
                existing.images = exercise_data.get("images", [])
                existing.source_file = exercise_data.get("source_file", "")
                existing.save()
                print(f"[exercise_sync] UPDATED: {name} (ID: {existing.id})")
                skip_count += 1
                continue

            exercise = Exercise.objects.create(
                name=name,
                description=exercise_data.get("description", ""),
                tags=exercise_data.get("tags", []),
                target_muscles=exercise_data.get("tags", []),
                images=exercise_data.get("images", []),
                source_file=exercise_data.get("source_file", ""),
                equipment=exercise_data.get("equipment", ""),
            )
            print(f"[exercise_sync] OK: {name} (ID: {exercise.id})")
            success_count += 1

        except Exception as e:
            print(f"[exercise_sync] ERROR: {exercise_data.get('name')} | {e}")
            fail_count += 1

    print(
        f"[exercise_sync] Sync complete. "
        f"Created: {success_count}, Updated: {skip_count}, Errors: {fail_count}"
    )
