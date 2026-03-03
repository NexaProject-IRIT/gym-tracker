from sqlalchemy import Column, Integer, String, Text
from app.database.connection import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # Силовое, Кардио и т.д.
    target_muscles = Column(String, nullable=True) # JSON или строка через запятую
    description = Column(Text, nullable=True)