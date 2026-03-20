import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import TypeDecorator, Text

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


def setup_json_serializer():
    class JsonType(TypeDecorator):
        impl = Text

        def process_bind_param(self, value, dialect):
            if value is not None:
                return json.dumps(value)
            return None

        def process_result_value(self, value, dialect):
            if value is not None:
                return json.loads(value)
            return None

    return JsonType