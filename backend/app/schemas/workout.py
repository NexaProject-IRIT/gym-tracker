from enum import Enum

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class WorkoutType(str, Enum):
    STRENGTH = 'strength'
    CARDIO = 'cardio'
    FLEXIBILITY = 'flexibility'
    FUNCTIONAL = 'functional'
    CUSTOM = 'custom'

class WorkoutExercise(BaseModel):
    id: str
    exerciseId: str
    customName: Optional[str] = None
    sets: int
    reps: int
    weight: Optional[float] = None
    time: Optional[int] = None
    distance: Optional[float] = None
    isCustom: bool = False

    class Config:
        from_attributes = True

class Workout(BaseModel):
    id: str
    name: str
    type: WorkoutType
    date: datetime
    exercises: List[WorkoutExercise]
    color: str

    class Config:
        from_attributes = True

# Для списка тренировок (краткая информация)
class WorkoutListItem(BaseModel):
    id: str
    name: str
    type: WorkoutType
    date: datetime
    color: str
    exercise_count: int

    class Config:
        from_attributes = True