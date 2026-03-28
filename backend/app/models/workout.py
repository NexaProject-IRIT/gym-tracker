from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, index=True, nullable=False)  # для соответствия id из TypeScript
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    color = Column(String, nullable=True)
    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, index=True, nullable=False)  # для соответствия id из TypeScript
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(String, nullable=True)  # ссылка на exercise.uid, может быть null для кастомных
    custom_name = Column(String, nullable=True)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    time = Column(Integer, nullable=True)
    distance = Column(Float, nullable=True)
    is_custom = Column(Boolean, default=False)
    workout = relationship("Workout", back_populates="exercises")