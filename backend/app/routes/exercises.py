import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.exercise import Exercise as ExerciseModel, ExerciseParameter as ExerciseParameterModel
from app.schemas.exercise import Exercise, ExerciseListItem, ExerciseCreate, ExerciseUpdate
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
    query = db.query(ExerciseModel)

    # Фильтрация
    if muscle:
        query = query.filter(cast(ExerciseModel.target_muscles, JSONB).contains([muscle]))
    if tag:
        query = query.filter(cast(ExerciseModel.tags, JSONB).contains([tag]))

    exercises = query.offset(skip).limit(limit).all()

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


@router.get("/{exercise_id}", response_model=Exercise)
def get_exercise(
        exercise_id: str,
        db: Session = Depends(get_db)
):
    exercise = db.query(ExerciseModel).filter(ExerciseModel.uid == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    parameters = []
    for param in exercise.parameters:
        parameters.append({
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
        "targetMuscles": exercise.target_muscles if exercise.target_muscles else [],
        "tags": exercise.tags if exercise.tags else [],
        "parameters": parameters,
        "images": images
    }


@router.post("/", response_model=Exercise, status_code=status.HTTP_201_CREATED)
def create_exercise(
        exercise: ExerciseCreate,
        db: Session = Depends(get_db)
):
    db_exercise = ExerciseModel(
        uid=str(uuid.uuid4()),
        name=exercise.name,
        description=exercise.description,
        equipment=exercise.equipment,
        target_muscles=exercise.targetMuscles,
        tags=exercise.tags,
        images=exercise.images.dict()
    )
    db.add(db_exercise)
    db.flush()
    for param in exercise.parameters:
        db_param = ExerciseParameterModel(
            exercise_id=db_exercise.id,
            type=param.type.value,
            label=param.label,
            unit=param.unit
        )
        db.add(db_param)

    db.commit()
    db.refresh(db_exercise)
    parameters_response = []
    for param in db_exercise.parameters:
        parameters_response.append({
            "type": param.type,
            "label": param.label,
            "unit": param.unit
        })

    return {
        "id": db_exercise.uid,
        "name": db_exercise.name,
        "description": db_exercise.description or "",
        "equipment": db_exercise.equipment or "",
        "targetMuscles": db_exercise.target_muscles or [],
        "tags": db_exercise.tags or [],
        "parameters": parameters_response,
        "images": db_exercise.images or {"cover": "", "technique": [], "muscleMap": ""}
    }


@router.put("/{exercise_id}", response_model=Exercise)
def update_exercise(
        exercise_id: str,
        exercise_update: ExerciseUpdate,
        db: Session = Depends(get_db)
):
    db_exercise = db.query(ExerciseModel).filter(ExerciseModel.uid == exercise_id).first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    update_data = exercise_update.dict(exclude_unset=True)
    if "name" in update_data:
        db_exercise.name = update_data["name"]
    if "description" in update_data:
        db_exercise.description = update_data["description"]
    if "equipment" in update_data:
        db_exercise.equipment = update_data["equipment"]
    if "targetMuscles" in update_data:
        db_exercise.target_muscles = update_data["targetMuscles"]
    if "tags" in update_data:
        db_exercise.tags = update_data["tags"]
    if "images" in update_data:
        if hasattr(update_data["images"], "dict"):
            db_exercise.images = update_data["images"].dict()
        else:
            db_exercise.images = update_data["images"]
    if "parameters" in update_data and update_data["parameters"] is not None:
        db.query(ExerciseParameterModel).filter(
            ExerciseParameterModel.exercise_id == db_exercise.id
        ).delete()
        for param in update_data["parameters"]:
            if isinstance(param, dict):
                param_type = param.get('type')
                param_label = param.get('label')
                param_unit = param.get('unit')
            else:
                param_type = param.type.value
                param_label = param.label
                param_unit = param.unit

            db_param = ExerciseParameterModel(
                exercise_id=db_exercise.id,
                type=param_type,
                label=param_label,
                unit=param_unit
            )
            db.add(db_param)

    db.commit()
    db.refresh(db_exercise)
    parameters_response = []
    for param in db_exercise.parameters:
        parameters_response.append({
            "type": param.type,
            "label": param.label,
            "unit": param.unit
        })

    return {
        "id": db_exercise.uid,
        "name": db_exercise.name,
        "description": db_exercise.description or "",
        "equipment": db_exercise.equipment or "",
        "targetMuscles": db_exercise.target_muscles or [],
        "tags": db_exercise.tags or [],
        "parameters": parameters_response,
        "images": db_exercise.images or {"cover": "", "technique": [], "muscleMap": ""}
    }


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
        exercise_id: str,
        db: Session = Depends(get_db)
):
    db_exercise = db.query(ExerciseModel).filter(ExerciseModel.uid == exercise_id).first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    db.delete(db_exercise)
    db.commit()


@router.get("/search/", response_model=List[ExerciseListItem])
def search_exercises(
        q: str = Query(..., min_length=1),
        db: Session = Depends(get_db)
):
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