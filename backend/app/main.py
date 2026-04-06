from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database.connection import engine, Base, get_db
from app.models import exercise
from fastapi.middleware.cors import CORSMiddleware  # Импорт должен быть сверху

# 1. Сначала создаем таблицы и ПЕРЕМЕННУЮ app
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Gym Tracker API") # <-- ЭТО ДОЛЖНО БЫТЬ ТУТ

# 2. Теперь настраиваем CORS (теперь 'app' уже существует)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. А дальше твои эндпоинты @app.get("/") и т.д.
@app.get("/")
def read_root():
    return {"message": "Бекенд работает, база подключена!"}

# Не забудь про эндпоинт для упражнений, если его еще нет:
@app.get("/exercises/")
def get_exercises(db: Session = Depends(get_db)):
    from app.models.exercise import Exercise
    return db.query(Exercise).all()
