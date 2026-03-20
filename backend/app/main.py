from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import engine, Base, get_db
from app.models import exercise, workout
from app.routes import exercises, workouts

# 1. Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

# 2. Настраиваем CORS (объединенный список разрешений)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://frontend:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Подключаем роутеры (путь ребят)
app.include_router(exercises.router)
app.include_router(workouts.router)

@app.get("/")
def read_root():
    return {
        "message": "Бекенд работает, база подключена!",
        "docs": "/docs",
        "endpoints": {
            "exercises": "/exercises/",
            "workouts": "/workouts/"
        }
    }

# Тестовый эндпоинт для проверки БД
@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Твой эндпоинт статистики
@app.get("/api/statistics")
def get_statistics(db: Session = Depends(get_db)):
    total_workouts = db.query(workout.Workout).count()
    total_exercises = db.query(exercise.Exercise).count()

    workout_types = db.query(
        workout.Workout.type,
        func.count(workout.Workout.id)
    ).group_by(workout.Workout.type).all()

    return {
        "total_workouts": total_workouts,
        "total_exercises": total_exercises,
        "workout_types": [{"type": wt[0], "count": wt[1]} for wt in workout_types]
    }
