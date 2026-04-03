import os
import re
import json
from pathlib import Path
from django.conf import settings


BASE_DIR = Path(settings.BASE_DIR)
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base"
OUTPUT_JSON_PATH = BASE_DIR / "exercises.json"


def parse_md_file(file_path: Path) -> dict:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Название: первый H1-заголовок
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else file_path.stem

    # Теги: отдельная строка формата "#biceps #arms #dumbbell"
    tag_lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("#") and not stripped.startswith("# "):
            tag_lines.append(stripped)

    tags = []
    for line in tag_lines:
        tags.extend(re.findall(r"#([A-Za-zА-Яа-я0-9_-]+)", line))

    # Картинки: markdown-формат ![alt](path)
    images = re.findall(r"!\[.*?\]\((.*?)\)", content)

    # Описание: секция ## Description
    desc_match = re.search(
        r"^##\s+Description\s*$\n(.*?)(?=^##\s+|\Z)",
        content,
        re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )

    if desc_match:
        description = desc_match.group(1).strip()
    else:
        lines = content.splitlines()
        cleaned_lines = []
        for line in lines:
            stripped = line.strip()

            if re.match(r"^#\s+.+$", stripped):
                continue
            if stripped.startswith("#") and not stripped.startswith("# "):
                continue
            if re.match(r"^!\[.*?\]\(.*?\)$", stripped):
                continue

            cleaned_lines.append(line)

        description = "\n".join(cleaned_lines).strip()

    return {
        "name": title,
        "tags": tags,
        "description": description,
        "images": images,
        "source_file": file_path.name,
    }


def parse_knowledge_base(base_path: Path) -> list:
    exercises = []

    if not base_path.exists():
        return exercises

    for root, _, files in os.walk(base_path):
        for file_name in files:
            if file_name.lower().endswith(".md"):
                file_path = Path(root) / file_name
                exercises.append(parse_md_file(file_path))

    return exercises


def rebuild_exercises_json() -> Path:
    exercises = parse_knowledge_base(KNOWLEDGE_BASE_PATH)

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)

    print(f"[md_parser] exercises.json обновлён. Упражнений: {len(exercises)}")
    return OUTPUT_JSON_PATH