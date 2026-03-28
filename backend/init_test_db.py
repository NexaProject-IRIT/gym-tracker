import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal, engine, Base
from app.models.exercise import Exercise, ExerciseParameter
from app.models.workout import Workout, WorkoutExercise
from datetime import datetime, timedelta
import uuid
import json


def init_db():
    print("Создание таблиц...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Добавление тестовых упражнений...")

        # Упражнения без поля type
        exercises = [
            {
                "uid": str(uuid.uuid4()),
                "name": "Присед со штангой",
                "description": "Базовое упражнение для развития мышц ног. Держите спину прямой, опускайтесь до параллели бедер с полом.",
                "equipment": "Штанга, стойка для приседа",
                "target_muscles": ["quadriceps", "glutes", "hamstrings"],
                "tags": ["#ноги", "#база", "#силовое"],
                "images": {
                    "cover": "/images/squat_cover.jpg",
                    "technique": ["/images/squat_1.jpg", "/images/squat_2.jpg"],
                    "muscleMap": "/images/squat_muscles.jpg"
                }
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Жим штанги лежа",
                "description": "Базовое упражнение для развития грудных мышц. Лягте на скамью, ноги на полу.",
                "equipment": "Штанга, скамья для жима",
                "target_muscles": ["chest", "triceps", "shoulders"],
                "tags": ["#грудь", "#база", "#силовое"],
                "images": {
                    "cover": "/images/benchpress_cover.jpg",
                    "technique": ["/images/benchpress_1.jpg", "/images/benchpress_2.jpg"],
                    "muscleMap": "/images/benchpress_muscles.jpg"
                }
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Бег на дорожке",
                "description": "Кардио упражнение для улучшения выносливости и сжигания калорий.",
                "equipment": "Беговая дорожка",
                "target_muscles": ["cardiovascular", "legs"],
                "tags": ["#кардио", "#ноги"],
                "images": {
                    "cover": "/images/running_cover.jpg",
                    "technique": ["/images/running_1.jpg"],
                    "muscleMap": "/images/running_muscles.jpg"
                }
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Планка",
                "description": "Статическое упражнение для укрепления мышц кора. Держите тело прямым.",
                "equipment": "Коврик",
                "target_muscles": ["abs", "core"],
                "tags": ["#пресс", "#гибкость"],
                "images": {
                    "cover": "/images/plank_cover.jpg",
                    "technique": ["/images/plank_1.jpg"],
                    "muscleMap": "/images/plank_muscles.jpg"
                }
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Тяга верхнего блока",
                "description": "Упражнение для развития широчайших мышц спины.",
                "equipment": "Верхний блок",
                "target_muscles": ["lats", "biceps"],
                "tags": ["#спина", "#силовое"],
                "images": {
                    "cover": "/images/lat_pulldown_cover.jpg",
                    "technique": ["/images/lat_pulldown_1.jpg"],
                    "muscleMap": "/images/lat_pulldown_muscles.jpg"
                }
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Скручивания на пресс",
                "description": "Изолированное упражнение для прямой мышцы живота.",
                "equipment": "Коврик",
                "target_muscles": ["abs"],
                "tags": ["#пресс", "#гибкость"],
                "images": {
                    "cover": "/images/crunches_cover.jpg",
                    "technique": ["/images/crunches_1.jpg"],
                    "muscleMap": "/images/crunches_muscles.jpg"
                }
            }
        ]

        for ex_data in exercises:
            exercise = Exercise(**ex_data)
            db.add(exercise)
            db.flush()  # чтобы получить id

            # Добавляем параметры для упражнения
            if ex_data["name"] == "Присед со штангой" or ex_data["name"] == "Жим штанги лежа" or ex_data["name"] == "Тяга верхнего блока":
                parameters = [
                    {"exercise_id": exercise.id, "type": "sets", "label": "Подходы", "unit": ""},
                    {"exercise_id": exercise.id, "type": "reps", "label": "Повторения", "unit": ""},
                    {"exercise_id": exercise.id, "type": "weight", "label": "Вес", "unit": "кг"}  # ← исправлено
                ]
            elif ex_data["name"] == "Бег на дорожке":
                parameters = [
                    {"exercise_id": exercise.id, "type": "time", "label": "Время", "unit": "мин"},
                    {"exercise_id": exercise.id, "type": "distance", "label": "Дистанция", "unit": "км"}
                ]
            elif ex_data["name"] == "Планка":
                parameters = [
                    {"exercise_id": exercise.id, "type": "time", "label": "Время", "unit": "сек"},
                    {"exercise_id": exercise.id, "type": "sets", "label": "Подходы", "unit": ""}
                ]
            elif ex_data["name"] == "Скручивания на пресс":
                parameters = [
                    {"exercise_id": exercise.id, "type": "sets", "label": "Подходы", "unit": ""},
                    {"exercise_id": exercise.id, "type": "reps", "label": "Повторения", "unit": ""}
                ]
            else:
                parameters = [
                    {"exercise_id": exercise.id, "type": "sets", "label": "Подходы", "unit": ""},
                    {"exercise_id": exercise.id, "type": "reps", "label": "Повторения", "unit": ""}
                ]

            for param_data in parameters:
                param = ExerciseParameter(**param_data)
                db.add(param)

        db.commit()
        print("✅ Упражнения добавлены")

        print("Добавление тестовых тренировок...")

        # Создаем тренировки
        workouts = [
            {
                "uid": str(uuid.uuid4()),
                "name": "Тренировка ног",
                "type": "strength",
                "date": datetime.now() - timedelta(days=2),
                "color": "#FF6B6B"  # красный
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Кардио тренировка",
                "type": "cardio",
                "date": datetime.now() - timedelta(days=1),
                "color": "#4ECDC4"  # бирюзовый
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Утренняя растяжка",
                "type": "flexibility",
                "date": datetime.now() - timedelta(days=3),
                "color": "#95E1D3"  # мятный
            },
            {
                "uid": str(uuid.uuid4()),
                "name": "Функциональная тренировка",
                "type": "functional",
                "date": datetime.now() - timedelta(days=4),
                "color": "#FFE66D"  # желтый
            }
        ]

        # Получаем ID упражнений для связей
        exercise_uids = [ex["uid"] for ex in exercises]

        for w_data in workouts:
            workout = Workout(**w_data)
            db.add(workout)
            db.flush()

            # Добавляем упражнения в тренировку в зависимости от типа
            exercises_in_workout = []

            if w_data["type"] == "strength":
                exercises_in_workout = [
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[0],  # присед
                        "sets": 4,
                        "reps": 8,
                        "weight": 70.0,
                        "is_custom": False
                    },
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[1],  # жим
                        "sets": 3,
                        "reps": 10,
                        "weight": 50.0,
                        "is_custom": False
                    },
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[4],  # тяга верхнего блока
                        "sets": 3,
                        "reps": 12,
                        "weight": 40.0,
                        "is_custom": False
                    }
                ]
            elif w_data["type"] == "cardio":
                exercises_in_workout = [
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[2],  # бег
                        "sets": 1,
                        "reps": 1,
                        "time": 20,
                        "distance": 3.5,
                        "is_custom": False
                    }
                ]
            elif w_data["type"] == "flexibility":
                exercises_in_workout = [
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[3],  # планка
                        "sets": 3,
                        "reps": 1,
                        "time": 60,
                        "is_custom": False
                    },
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[5],  # скручивания
                        "sets": 3,
                        "reps": 20,
                        "is_custom": False
                    }
                ]
            elif w_data["type"] == "functional":
                # Кастомное упражнение для демонстрации
                exercises_in_workout = [
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": None,  # кастомное упражнение
                        "custom_name": "Бёрпи с прыжком",
                        "sets": 4,
                        "reps": 15,
                        "is_custom": True
                    },
                    {
                        "uid": str(uuid.uuid4()),
                        "workout_id": workout.id,
                        "exercise_id": exercise_uids[2],  # бег
                        "sets": 1,
                        "reps": 1,
                        "time": 10,
                        "distance": 1.5,
                        "is_custom": False
                    }
                ]

            for we_data in exercises_in_workout:
                workout_exercise = WorkoutExercise(**we_data)
                db.add(workout_exercise)

        db.commit()
        print("✅ Тренировки добавлены")

        print("\n" + "="*50)
        print("✅ База данных успешно инициализирована!")
        print(f"📊 Добавлено упражнений: {len(exercises)}")
        print(f"📊 Добавлено тренировок: {len(workouts)}")
        print("="*50)

    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Инициализация завершена!")