import shutil
from pathlib import Path

from django.conf import settings

from exercises.models import Equipment, Exercise, ExerciseParameter
from .md_parser import parse_knowledge_base


def _kb_image_exists(path: str) -> bool:
    """Проверяем что картинка по пути из frontmatter реально лежит в knowledge_base/."""
    if not path:
        return True  # пустое — не ошибка, просто нет картинки
    clean = path.removeprefix("images/")
    full = Path(settings.BASE_DIR) / "knowledge_base" / "images" / clean
    return full.exists()


PARAMETER_META = {
    "sets": {"label": "Подходы", "unit": ""},
    "reps": {"label": "Повторения", "unit": ""},
    "weight": {"label": "Вес", "unit": "кг"},
    "time": {"label": "Время", "unit": "сек"},
    "distance": {"label": "Расстояние", "unit": "м"},
}


def copy_images_to_media():
    """Копирует knowledge_base/images/ → media/knowledge_base/, чтобы Django их раздавал через MEDIA_URL."""
    src = Path(settings.BASE_DIR) / "knowledge_base" / "images"
    dst = Path(settings.MEDIA_ROOT) / "knowledge_base"

    if not src.exists():
        print(f"[exercise_sync] Папки {src} нет, пропускаем копирование картинок")
        return

    dst.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dst, dirs_exist_ok=True)
    print(f"[exercise_sync] Картинки скопированы в {dst}")


def build_image_url(path: str) -> str:
    """'images/exercises/barbell-squat-cover.jpg' → '/media/knowledge_base/exercises/barbell-squat-cover.jpg'"""
    if not path:
        return ""
    clean = path.removeprefix("images/")
    return f"{settings.MEDIA_URL}knowledge_base/{clean}"


def build_images_dict(raw_images: dict, exercise_name: str = "") -> dict:
    if not isinstance(raw_images, dict):
        raw_images = {}
    cover_path = raw_images.get("cover", "")
    technique_paths = [p for p in raw_images.get("technique", []) if p]
    muscle_map_path = raw_images.get("muscleMap", "")

    # Warn о битых ссылках — иначе фронт молча отдаёт 404 пользователю
    missing = []
    if cover_path and not _kb_image_exists(cover_path):
        missing.append(cover_path)
    for p in technique_paths:
        if not _kb_image_exists(p):
            missing.append(p)
    if muscle_map_path and not _kb_image_exists(muscle_map_path):
        missing.append(muscle_map_path)
    if missing:
        label = f" ({exercise_name})" if exercise_name else ""
        print(f"[exercise_sync] WARN: missing images{label}: {missing}")

    return {
        "cover": build_image_url(cover_path),
        "technique": [build_image_url(p) for p in technique_paths],
        "muscleMap": build_image_url(muscle_map_path),
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
                "tags": [t.lower() for t in item.get("tags", [])],
                "image": build_image_url(item.get("image", "")),
                "source_file": item.get("source_file", ""),
            }

            obj, created = Equipment.objects.update_or_create(name=name, defaults=defaults)

            if created:
                created_count += 1
                print(f"[equipment_sync] CREATED: {obj.name}")
            else:
                updated_count += 1
                print(f"[equipment_sync] UPDATED: {obj.name}")

        except Exception as e:
            print(f"[equipment_sync] ERROR: {item.get('name')} | {e}")
            error_count += 1

    return {"created": created_count, "updated": updated_count, "errors": error_count}


def sync_exercise_parameters(exercise, parameter_types):
    ExerciseParameter.objects.filter(exercise=exercise).delete()

    for parameter_type in parameter_types:
        parameter_type = str(parameter_type).strip()
        if not parameter_type:
            continue

        meta = PARAMETER_META.get(parameter_type, {"label": parameter_type, "unit": ""})

        ExerciseParameter.objects.create(
            exercise=exercise,
            type=parameter_type,
            label=meta["label"],
            unit=meta["unit"],
        )


def sync_exercises_to_db():
    copy_images_to_media()

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
                print(f"[exercise_sync] SKIP: {name} | equipment field is empty")
                skipped_count += 1
                continue

            if not Equipment.objects.filter(name=equipment_name).exists():
                print(f"[exercise_sync] SKIP: {name} | equipment '{equipment_name}' not found")
                skipped_count += 1
                continue

            defaults = {
                "description": exercise_data.get("description", ""),
                "equipment": equipment_name,
                "tags": [t.lower() for t in exercise_data.get("tags", [])],
                "target_muscles": [m.lower() for m in exercise_data.get("targetMuscles", [])],
                "synonyms": [str(s).strip() for s in exercise_data.get("synonyms", []) if str(s).strip()],
                "difficulty": exercise_data.get("difficulty", ""),
                "images": build_images_dict(exercise_data.get("images", {}), name),
                "source_file": exercise_data.get("source_file", ""),
            }

            if exercise_id:
                defaults["exercise_id"] = exercise_id
                obj, created = Exercise.objects.update_or_create(
                    exercise_id=exercise_id,
                    defaults={**defaults, "name": name},
                )
            else:
                obj, created = Exercise.objects.update_or_create(name=name, defaults=defaults)

            sync_exercise_parameters(exercise=obj, parameter_types=exercise_data.get("parameters", []))

            if created:
                created_count += 1
                print(f"[exercise_sync] CREATED: {name}")
            else:
                updated_count += 1
                print(f"[exercise_sync] UPDATED: {name}")

        except Exception as e:
            print(f"[exercise_sync] ERROR: {exercise_data.get('name')} | {e}")
            error_count += 1

    print(
        "[exercise_sync] Sync complete. "
        f"Equipment -> Created: {equipment_stats['created']}, Updated: {equipment_stats['updated']}, Errors: {equipment_stats['errors']} | "
        f"Exercises -> Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}"
    )