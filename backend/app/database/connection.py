import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Берем URL из docker-compose, если его нет - используем дефолтный (для тестов)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://gym_user:gym_password@localhost:5432/gym_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Эта функция будет давать сессию БД для каждого запроса от пользователя
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()