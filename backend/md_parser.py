'''Парсинг .md файлов в папку knowledge_base/'''
import os
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.exercise import Exercise

def parse_md_files(directory):
    db = SessionLocal()
    # Проверяем, есть ли такая папка
    if not os.path.exists(directory):
        print(f"Ошибка: Папка {directory} не найдена!")
        return

    for filename in os.listdir(directory):
        if filename.endswith(".md"):
            with open(os.path.join(directory, filename), 'r', encoding='utf-8') as f:
                content = f.read()
                # Пример простой логики: имя файла - это название упражнения
                name = filename.replace(".md", "").replace("_", " ").capitalize()
                
                # Создаем запись в базе
                new_exercise = Exercise(
                    name=name,
                    description=content[:200], # Первые 200 символов как описание
                    equipment="Тренажер" if "тренажер" in content.lower() else "Свободный вес"
                )
                db.add(new_exercise)
    
    db.commit()
    db.close()
    print("Данные успешно загружены в базу!")

if __name__ == "__main__":
    # Укажи здесь путь к папке с твоими .md файлами
    # Если они лежат в backend/data, оставь так:
    parse_md_files("./data")