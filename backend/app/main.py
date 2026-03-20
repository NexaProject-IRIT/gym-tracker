from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.connection import engine, Base, get_db
from app.models import exercise  # Импортируем, чтобы SQLAlchemy увидел модель
from sqlalchemy import func
from app.models import workout
from app.routes import exercises, workouts

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://frontend:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Тестовый эндпоинт, чтобы проверить, что БД реально отвечает
@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/statistics")
def get_statistics(db: Session = Depends(get_db)):
    total_workouts = db.query(workout.Workout).count()
    total_exercises = db.query(exercise.Exercise).count()

    # Типы тренировок
    workout_types = db.query(
        workout.Workout.type,
        func.count(workout.Workout.id)
    ).group_by(workout.Workout.type).all()

    return {
        "total_workouts": total_workouts,
        "total_exercises": total_exercises,
        "workout_types": [{"type": wt[0], "count": wt[1]} for wt in workout_types]
    }