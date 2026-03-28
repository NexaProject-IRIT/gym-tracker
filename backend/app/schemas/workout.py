from enum import Enum
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class WorkoutType(str, Enum):
    STRENGTH = 'strength'
    CARDIO = 'cardio'
    FLEXIBILITY = 'flexibility'
    FUNCTIONAL = 'functional'
    CUSTOM = 'custom'

class WorkoutExercise(BaseModel):
    id: Optional[str] = None
    exerciseId: str
    customName: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    time: Optional[int] = None
    distance: Optional[float] = None
    isCustom: bool = False

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class Workout(BaseModel):
    id: str
    name: str
    type: WorkoutType
    date: datetime
    exercises: List[WorkoutExercise]
    color: str

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )


# Для списка тренировок (краткая информация)
class WorkoutListItem(BaseModel):
    id: str
    name: str
    type: WorkoutType
    date: datetime
    color: str
    exercise_count: int

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

# Для создания тренировки
class WorkoutCreate(BaseModel):
    name: str
    type: WorkoutType
    date: Optional[datetime] = None
    exercises: List[WorkoutExercise]
    color: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

    # Для обновления тренировки
class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[WorkoutType] = None
    date: Optional[datetime] = None
    exercises: Optional[List[WorkoutExercise]] = None
    color: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )