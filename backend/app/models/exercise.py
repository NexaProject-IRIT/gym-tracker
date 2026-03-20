from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey
from app.database.connection import Base
from sqlalchemy.orm import relationship
import json


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, index=True, nullable=False)  # для соответствия id из TypeScript
    name = Column(String, index=True, nullable=False)
    equipment = Column(String, nullable=True)
    type = Column(String, nullable=False) # Силовое, Кардио и т.д.
    target_muscles = Column(JSON, nullable=True) # JSON или строка через запятую
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # храним как JSON массив
    images = Column(JSON, nullable=True)  # храним как JSON объект
    parameters = relationship("ExerciseParameter", back_populates="exercise", cascade="all, delete-orphan")


class ExerciseParameter(Base):
    __tablename__ = "exercise_parameters"
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    exercise = relationship("Exercise", back_populates="parameters")