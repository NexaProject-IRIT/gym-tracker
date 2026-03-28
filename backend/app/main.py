from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import asyncio

from app.database.connection import engine, Base, get_db
from app.models import exercise, workout
from app.routes import exercises, workouts
from app.md_parser import rebuild_exercises_json
from app.exercise_sync import sync_exercises_to_api_after_startup

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

# Настраиваем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://frontend:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры (те самые CRUD)
app.include_router(exercises.router)
app.include_router(workouts.router)

# Логика синхронизации при запуске
@app.on_event("startup")
async def startup_event():
    rebuild_exercises_json()
    asyncio.create_task(sync_exercises_to_api_after_startup())

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

@app.post("/api/exercises/")
def receive_exercise(exercise_data: dict):
    print("[API] Получено упражнение:", exercise_data.get("name"))
    return {"status": "ok", "received": exercise_data.get("name")}
