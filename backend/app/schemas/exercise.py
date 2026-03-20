from enum import Enum

from pydantic import BaseModel
from typing import List, Optional


class ParameterType(str, Enum):
    WEIGHT = 'weight'
    REPS = 'reps'
    SETS = 'sets'
    TIME = 'time'
    DISTANCE = 'distance'

class ExerciseParameter(BaseModel):
    type: ParameterType
    label: str
    unit: str

class ExerciseImages(BaseModel):
    cover: str
    technique: List[str]
    muscleMap: str

class Exercise(BaseModel):
    id: str
    name: str
    description: str
    equipment: str
    targetMuscles: List[str]
    tags: List[str]
    parameters: List[ExerciseParameter]
    images: ExerciseImages

    class Config:
        from_attributes = True

# Упрощенная схема для списка
class ExerciseListItem(BaseModel):
    id: str
    name: str
    targetMuscles: List[str]
    tags: List[str]
    images: dict

    class Config:
        from_attributes = True