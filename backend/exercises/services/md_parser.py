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

    # Title: first H1 heading
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else file_path.stem

    # Tags: lines like "#biceps #arms #dumbbell" (not headings "# Title")
    tags = []
    for line in content.splitlines():
        stripped = line.strip()
        # Tag line: starts with # but NOT "# " (heading)
        if re.match(r"^#[A-Za-zА-Яа-я]", stripped):
            tags.extend(re.findall(r"#([A-Za-zА-Яа-я0-9_-]+)", stripped))

    # Images: markdown format ![alt](path)
    images = re.findall(r"!\[.*?\]\((.*?)\)", content)

    # Equipment section: ## Equipment
    equip_match = re.search(
        r"^##\s+Equipment\s*$\n(.*?)(?=^##\s+|\Z)",
        content,
        re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    equipment = equip_match.group(1).strip() if equip_match else ""

    # Description section: ## Description
    desc_match = re.search(
        r"^##\s+Description\s*$\n(.*?)(?=^##\s+|\Z)",
        content,
        re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )

    if desc_match:
        description = desc_match.group(1).strip()
    else:
        # Fallback: everything that isn't title/tags/images
        lines = content.splitlines()
        cleaned_lines = []
        for line in lines:
            stripped = line.strip()
            if re.match(r"^#\s+.+$", stripped):
                continue
            if re.match(r"^#[A-Za-zА-Яа-я]", stripped):
                continue
            if re.match(r"^!\[.*?\]\(.*?\)$", stripped):
                continue
            if re.match(r"^##\s+", stripped):
                continue
            cleaned_lines.append(line)
        description = "\n".join(cleaned_lines).strip()

    return {
        "name": title,
        "tags": tags,
        "description": description,
        "images": images,
        "equipment": equipment,
        "source_file": file_path.name,
    }


def parse_knowledge_base(base_path: Path) -> list:
    exercises = []

    if not base_path.exists():
        print(f"[md_parser] Knowledge base path not found: {base_path}")
        return exercises

    for root, _, files in os.walk(base_path):
        for file_name in sorted(files):
            if file_name.lower().endswith(".md"):
                file_path = Path(root) / file_name
                parsed = parse_md_file(file_path)
                if parsed["name"]:
                    exercises.append(parsed)

    return exercises


def rebuild_exercises_json() -> Path:
    exercises = parse_knowledge_base(KNOWLEDGE_BASE_PATH)

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)

    print(f"[md_parser] exercises.json updated. Exercises: {len(exercises)}")
    return OUTPUT_JSON_PATH
