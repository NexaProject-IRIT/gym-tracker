from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.exercise import Exercise as ExerciseModel, ExerciseParameter as ExerciseParameterModel
from app.schemas.exercise import Exercise, ExerciseListItem
from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB


router = APIRouter(prefix="/exercises", tags=["exercises"])

@router.get("/", response_model=List[ExerciseListItem])
def get_exercises(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        muscle: Optional[str] = None,
        tag: Optional[str] = None,
        db: Session = Depends(get_db)
    ):
    query = db.query(ExerciseModel) #Получить список всех упражнений с поддержкой пагинации и фильтрации

    # Фильтрация
    if muscle:
        query = query.filter(
            cast(ExerciseModel.target_muscles, JSONB).contains([muscle])
        )
    if tag:
        query = query.filter(
            cast(ExerciseModel.tags, JSONB).contains([tag])
        )
    exercises = query.offset(skip).limit(limit).all()
    result = [] #формат для списка
    for ex in exercises:
        images_dict = ex.images if ex.images else {} # Получаем только обложку из images
        cover_image = images_dict.get("cover", "") if isinstance(images_dict, dict) else ""
        result.append({
            "id": ex.uid,
            "name": ex.name,
            "targetMuscles": ex.target_muscles if ex.target_muscles else [],
            "tags": ex.tags if ex.tags else [],
            "images": {"cover": cover_image}
        })
    return result


@router.get("/{exercise_id}", response_model=Exercise)
def get_exercise(exercise_id, db = Depends(get_db)):
    exercise = db.query(ExerciseModel).filter(ExerciseModel.uid == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    parameters = []
    for param in exercise.parameters:
        parameters.append({
            "id": param.id,
            "exercise_id": exercise.id,
            "type": param.type,
            "label": param.label,
            "unit": param.unit
        })

    images = exercise.images if exercise.images else {
        "cover": "",
        "technique": [],
        "muscleMap": ""
    }

    return {
        "id": exercise.uid,
        "name": exercise.name,
        "description": exercise.description or "",
        "equipment": exercise.equipment or "",
        "type": exercise.type,  # !!! ДОБАВИТЬ ЭТО ПОЛЕ
        "targetMuscles": exercise.target_muscles if exercise.target_muscles else [],
        "tags": exercise.tags if exercise.tags else [],
        "parameters": parameters,
        "images": images
    }


@router.get("/search/", response_model=List[ExerciseListItem])
def search_exercises(q = Query(..., min_length=1), db = Depends(get_db)):
    exercises = db.query(ExerciseModel).filter(ExerciseModel.name.ilike(f"%{q}%")).limit(50).all()

    result = []
    for ex in exercises:
        images_dict = ex.images if ex.images else {}
        cover_image = images_dict.get("cover", "") if isinstance(images_dict, dict) else ""

        result.append({
            "id": ex.uid,
            "name": ex.name,
            "targetMuscles": ex.target_muscles if ex.target_muscles else [],
            "tags": ex.tags if ex.tags else [],
            "images": {"cover": cover_image}
        })

    return result