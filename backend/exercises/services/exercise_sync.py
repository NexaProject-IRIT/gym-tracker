from exercises.models import Equipment, Exercise, ExerciseParameter
from .md_parser import parse_knowledge_base


PARAMETER_META = {
    "sets": {
        "label": "Подходы",
        "unit": "",
    },
    "reps": {
        "label": "Повторения",
        "unit": "",
    },
    "weight": {
        "label": "Вес",
        "unit": "кг",
    },
    "time": {
        "label": "Время",
        "unit": "сек",
    },
    "distance": {
        "label": "Расстояние",
        "unit": "м",
    },
}


def sync_equipment_to_db(equipment_items):
    created_count = 0
    updated_count = 0
    error_count = 0

    for item in equipment_items:
        try:
            name = str(item.get("name", "")).strip()
            if not name:
                continue

            defaults = {
                "description": item.get("description", ""),
                "tags": item.get("tags", []),
                "image": item.get("image", ""),
                "source_file": item.get("source_file", ""),
            }

            obj, created = Equipment.objects.update_or_create(
                name=name,
                defaults=defaults,
            )

            if created:
                created_count += 1
                print(f"[equipment_sync] CREATED: {obj.name} (ID: {obj.id})")
            else:
                updated_count += 1
                print(f"[equipment_sync] UPDATED: {obj.name} (ID: {obj.id})")

        except Exception as e:
            print(f"[equipment_sync] ERROR: {item.get('name')} | {e}")
            error_count += 1

    return {
        "created": created_count,
        "updated": updated_count,
        "errors": error_count,
    }


def sync_exercise_parameters(exercise, parameter_types):
    ExerciseParameter.objects.filter(exercise=exercise).delete()

    for parameter_type in parameter_types:
        parameter_type = str(parameter_type).strip()
        if not parameter_type:
            continue

        meta = PARAMETER_META.get(
            parameter_type,
            {
                "label": parameter_type,
                "unit": "",
            },
        )

        ExerciseParameter.objects.create(
            exercise=exercise,
            type=parameter_type,
            label=meta["label"],
            unit=meta["unit"],
        )


def sync_exercises_to_db():
    equipment_items, exercise_items = parse_knowledge_base()

    print("[exercise_sync] Syncing equipment to database...")
    equipment_stats = sync_equipment_to_db(equipment_items)

    print("[exercise_sync] Syncing exercises to database...")

    created_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0

    for exercise_data in exercise_items:
        try:
            exercise_id = str(exercise_data.get("id", "")).strip()
            name = str(exercise_data.get("name", "")).strip()

            if not name:
                skipped_count += 1
                continue

            equipment_name = str(exercise_data.get("equipment", "")).strip()
            if not equipment_name:
                print(
                    f"[exercise_sync] SKIP: {name} | "
                    f"equipment field is empty"
                )
                skipped_count += 1
                continue

            equipment_exists = Equipment.objects.filter(name=equipment_name).exists()
            if not equipment_exists:
                print(
                    f"[exercise_sync] SKIP: {name} | "
                    f"equipment '{equipment_name}' not found"
                )
                skipped_count += 1
                continue

            defaults = {
                "description": exercise_data.get("description", ""),
                "equipment": equipment_name,
                "tags": exercise_data.get("tags", []),
                "target_muscles": exercise_data.get("targetMuscles", []),
                "difficulty": exercise_data.get("difficulty", ""),
                "images": exercise_data.get(
                    "images",
                    {
                        "cover": "",
                        "technique": [],
                        "muscleMap": "",
                    },
                ),
                "source_file": exercise_data.get("source_file", ""),
            }

            if exercise_id:
                defaults["exercise_id"] = exercise_id
                obj, created = Exercise.objects.update_or_create(
                    exercise_id=exercise_id,
                    defaults={
                        **defaults,
                        "name": name,
                    },
                )
            else:
                obj, created = Exercise.objects.update_or_create(
                    name=name,
                    defaults=defaults,
                )

            sync_exercise_parameters(
                exercise=obj,
                parameter_types=exercise_data.get("parameters", []),
            )

            if created:
                created_count += 1
                print(f"[exercise_sync] CREATED: {name} (ID: {obj.id})")
            else:
                updated_count += 1
                print(f"[exercise_sync] UPDATED: {name} (ID: {obj.id})")

        except Exception as e:
            print(f"[exercise_sync] ERROR: {exercise_data.get('name')} | {e}")
            error_count += 1

    print(
        "[exercise_sync] Sync complete. "
        f"Equipment -> Created: {equipment_stats['created']}, "
        f"Updated: {equipment_stats['updated']}, "
        f"Errors: {equipment_stats['errors']} | "
        f"Exercises -> Created: {created_count}, "
        f"Updated: {updated_count}, "
        f"Skipped: {skipped_count}, "
        f"Errors: {error_count}"
    )