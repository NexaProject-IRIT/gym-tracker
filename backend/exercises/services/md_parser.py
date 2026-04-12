from pathlib import Path

import frontmatter
from django.conf import settings


BASE_DIR = Path(settings.BASE_DIR)
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base"
EQUIPMENT_PATH = KNOWLEDGE_BASE_PATH / "equipment"
EXERCISES_PATH = KNOWLEDGE_BASE_PATH / "exercises"


def normalize_list(value):
    if isinstance(value, list):
        return value
    return []


def normalize_string(value):
    if value is None:
        return ""
    return str(value).strip()


def normalize_exercise_images(images):
    if not isinstance(images, dict):
        images = {}

    technique = images.get("technique", [])
    if not isinstance(technique, list):
        technique = []

    return {
        "cover": normalize_string(images.get("cover")),
        "technique": technique,
        "muscleMap": normalize_string(images.get("muscleMap")),
    }


def parse_equipment_file(file_path: Path) -> dict:
    post = frontmatter.load(file_path)
    meta = post.metadata or {}

    return {
        "type": normalize_string(meta.get("type")).lower(),
        "name": normalize_string(meta.get("name")),
        "tags": normalize_list(meta.get("tags")),
        "description": normalize_string(meta.get("description")),
        "image": normalize_string(meta.get("image")),
        "source_file": file_path.name,
    }


def parse_exercise_file(file_path: Path) -> dict:
    post = frontmatter.load(file_path)
    meta = post.metadata or {}

    target_muscles = meta.get("targetMuscles")
    if target_muscles is None:
        target_muscles = meta.get("target_muscles")

    return {
        "type": normalize_string(meta.get("type")).lower(),
        "id": normalize_string(meta.get("id")),
        "name": normalize_string(meta.get("name")),
        "equipment": normalize_string(meta.get("equipment")),
        "targetMuscles": normalize_list(target_muscles),
        "tags": normalize_list(meta.get("tags")),
        "difficulty": normalize_string(meta.get("difficulty")),
        "parameters": normalize_list(meta.get("parameters")),
        "images": normalize_exercise_images(meta.get("images")),
        "description": normalize_string(meta.get("description")),
        "source_file": file_path.name,
    }


def parse_directory(directory: Path, parser_func, expected_type: str) -> list[dict]:
    items = []

    if not directory.exists():
        print(f"[md_parser] Directory not found: {directory}")
        return items

    for file_path in sorted(directory.glob("*.md")):
        try:
            parsed = parser_func(file_path)

            if parsed.get("type") != expected_type:
                print(
                    f"[md_parser] SKIP {file_path.name}: "
                    f"expected '{expected_type}', got '{parsed.get('type')}'"
                )
                continue

            if not parsed.get("name"):
                print(f"[md_parser] SKIP {file_path.name}: empty name")
                continue

            items.append(parsed)

        except Exception as e:
            print(f"[md_parser] ERROR {file_path.name}: {e}")

    return items


def parse_knowledge_base():
    equipment_list = parse_directory(
        EQUIPMENT_PATH,
        parse_equipment_file,
        "equipment",
    )
    exercise_list = parse_directory(
        EXERCISES_PATH,
        parse_exercise_file,
        "exercise",
    )
    return equipment_list, exercise_list