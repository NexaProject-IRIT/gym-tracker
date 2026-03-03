from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database.connection import engine, Base, get_db
from app.models import exercise  # Импортируем, чтобы SQLAlchemy увидел модель

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

@app.get("/")
def read_root():
    return {"message": "Бекенд работает, база подключена!"}

# Тестовый эндпоинт, чтобы проверить, что БД реально отвечает
@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    return {"status": "ok", "message": "Database connection successful"}