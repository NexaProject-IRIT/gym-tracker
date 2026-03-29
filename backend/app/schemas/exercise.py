from enum import Enum

from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class ExerciseImages(BaseModel):
    cover: str
    technique: List[str]
    muscleMap: str

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class Exercise(BaseModel):
    id: str
    name: str
    description: str
    equipment: str
    targetMuscles: List[str]
    tags: List[str]
    parameters: List[ExerciseParameter]
    images: ExerciseImages

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

# Упрощенная схема для списка
class ExerciseListItem(BaseModel):
    id: str
    name: str
    targetMuscles: List[str]
    tags: List[str]
    images: dict

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class ExerciseCreate(BaseModel):
    name: str
    description: str = ""
    equipment: str = ""
    targetMuscles: List[str] = []
    tags: List[str] = []
    parameters: List[ExerciseParameter] = []
    images: Optional[List[str]] = []

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    equipment: Optional[str] = None
    targetMuscles: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    parameters: Optional[List[ExerciseParameter]] = None
    images: Optional[ExerciseImages] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )