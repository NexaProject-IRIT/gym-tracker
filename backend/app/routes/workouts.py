import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.connection import get_db
from app.models.workout import Workout as WorkoutModel, WorkoutExercise as WorkoutExerciseModel
from app.schemas.workout import Workout, WorkoutListItem, WorkoutCreate, WorkoutUpdate
from sqlalchemy import or_

router = APIRouter(prefix="/workouts", tags=["workouts"])
WORKOUT_COLORS = {
    "strength": "#FF6B6B",
    "cardio": "#4ECDC4",
    "flexibility": "#95E1D3",
    "functional": "#FFE66D",
    "custom": "#A8E6CF"
}


@router.get("/", response_model=List[WorkoutListItem])
def get_workouts(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        type: Optional[str] = None,
        db: Session = Depends(get_db)
):
    query = db.query(WorkoutModel)
    if type:
        query = query.filter(WorkoutModel.type == type)
    query = query.order_by(WorkoutModel.date.desc())
    workouts = query.offset(skip).limit(limit).all()

    result = []
    for workout in workouts:
        exercise_count = len(workout.exercises) if workout.exercises else 0
        result.append({
            "id": workout.uid,
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS["custom"]),
            "exercise_count": exercise_count
        })
    return result


@router.get("/{workout_id}", response_model=Workout)
def get_workout(
        workout_id: str,
        db: Session = Depends(get_db)
):
    workout = db.query(WorkoutModel).filter(WorkoutModel.uid == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    exercises = []
    for we in workout.exercises:
        exercises.append({
            "id": we.uid,
            "exerciseId": we.exercise_id or "",
            "customName": we.custom_name,
            "sets": we.sets,
            "reps": we.reps,
            "weight": we.weight,
            "time": we.time,
            "distance": we.distance,
            "isCustom": we.is_custom
        })

    return {
        "id": workout.uid,
        "name": workout.name,
        "type": workout.type,
        "date": workout.date,
        "exercises": exercises,
        "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS["custom"])
    }


@router.post("/", response_model=Workout, status_code=status.HTTP_201_CREATED)
def create_workout(
        workout: WorkoutCreate,
        db: Session = Depends(get_db)
):
    if workout.color:
        color = workout.color
    else:
        color = WORKOUT_COLORS.get(workout.type.value, WORKOUT_COLORS["custom"])
    date = workout.date if workout.date else datetime.utcnow()
    db_workout = WorkoutModel(
        uid=str(uuid.uuid4()),
        name=workout.name,
        type=workout.type.value,
        date=date,
        color=color
    )
    db.add(db_workout)
    db.flush()
    for ex in workout.exercises:
        workout_exercise = WorkoutExerciseModel(
            uid=str(uuid.uuid4()),
            workout_id=db_workout.id,
            exercise_id=ex.exerciseId if ex.exerciseId and not ex.isCustom else None,
            custom_name=ex.customName if ex.isCustom else None,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
            time=ex.time,
            distance=ex.distance,
            is_custom=ex.isCustom
        )
        db.add(workout_exercise)

    db.commit()
    db.refresh(db_workout)
    exercises_response = []
    for we in db_workout.exercises:
        exercises_response.append({
            "id": we.uid,
            "exerciseId": we.exercise_id or "",
            "customName": we.custom_name,
            "sets": we.sets,
            "reps": we.reps,
            "weight": we.weight,
            "time": we.time,
            "distance": we.distance,
            "isCustom": we.is_custom
        })

    return {
        "id": db_workout.uid,
        "name": db_workout.name,
        "type": db_workout.type,
        "date": db_workout.date,
        "exercises": exercises_response,
        "color": db_workout.color
    }


@router.put("/{workout_id}", response_model=Workout)
def update_workout(
        workout_id: str,
        workout_update: WorkoutUpdate,
        db: Session = Depends(get_db)
):
    db_workout = db.query(WorkoutModel).filter(WorkoutModel.uid == workout_id).first()
    if not db_workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    update_data = workout_update.dict(exclude_unset=True)

    if "name" in update_data:
        db_workout.name = update_data["name"]
    if "type" in update_data:
        db_workout.type = update_data["type"].value
        if "color" not in update_data:
            db_workout.color = WORKOUT_COLORS.get(update_data["type"].value, WORKOUT_COLORS["custom"])
    if "date" in update_data:
        db_workout.date = update_data["date"]
    if "color" in update_data:
        db_workout.color = update_data["color"]

    if "exercises" in update_data and update_data["exercises"] is not None:
        db.query(WorkoutExerciseModel).filter(WorkoutExerciseModel.workout_id == db_workout.id).delete()
        for ex in update_data["exercises"]:
            if isinstance(ex, dict):
                exercise_id = ex.get('exerciseId', '')
                custom_name = ex.get('customName')
                is_custom = ex.get('isCustom', False)
                sets = ex.get('sets', 1)
                reps = ex.get('reps', 1)
                weight = ex.get('weight')
                time = ex.get('time')
                distance = ex.get('distance')
            else:
                exercise_id = ex.exerciseId
                custom_name = ex.customName
                is_custom = ex.isCustom
                sets = ex.sets
                reps = ex.reps
                weight = ex.weight
                time = ex.time
                distance = ex.distance

            workout_exercise = WorkoutExerciseModel(
                uid=str(uuid.uuid4()),
                workout_id=db_workout.id,
                exercise_id=exercise_id if exercise_id and not is_custom else None,
                custom_name=custom_name if is_custom else None,
                sets=sets,
                reps=reps,
                weight=weight,
                time=time,
                distance=distance,
                is_custom=is_custom
            )
            db.add(workout_exercise)

    db.commit()
    db.refresh(db_workout)
    exercises_response = []
    for we in db_workout.exercises:
        exercises_response.append({
            "id": we.uid,
            "exerciseId": we.exercise_id or "",
            "customName": we.custom_name,
            "sets": we.sets,
            "reps": we.reps,
            "weight": we.weight,
            "time": we.time,
            "distance": we.distance,
            "isCustom": we.is_custom
        })

    return {
        "id": db_workout.uid,
        "name": db_workout.name,
        "type": db_workout.type,
        "date": db_workout.date,
        "exercises": exercises_response,
        "color": db_workout.color
    }


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
        workout_id: str,
        db: Session = Depends(get_db)
):
    db_workout = db.query(WorkoutModel).filter(WorkoutModel.uid == workout_id).first()
    if not db_workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.delete(db_workout)
    db.commit()


@router.get("/recent/", response_model=List[WorkoutListItem])
def get_recent_workouts(
        limit: int = Query(5, ge=1, le=20),
        db: Session = Depends(get_db)
):
    workouts = db.query(WorkoutModel).order_by(WorkoutModel.date.desc()).limit(limit).all()

    result = []
    for workout in workouts:
        exercise_count = len(workout.exercises) if workout.exercises else 0
        result.append({
            "id": workout.uid,
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS["custom"]),
            "exercise_count": exercise_count
        })
    return result


@router.get("/search/", response_model=List[WorkoutListItem])
def search_workouts(
        q: str = Query(..., min_length=1),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db)
):
    workouts = db.query(WorkoutModel).filter(
        or_(
            WorkoutModel.name.ilike(f"%{q}%"),
            WorkoutModel.type.ilike(f"%{q}%")
        )
    ).order_by(WorkoutModel.date.desc()).offset(skip).limit(limit).all()

    result = []
    for workout in workouts:
        exercise_count = len(workout.exercises) if workout.exercises else 0
        result.append({
            "id": workout.uid,
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS["custom"]),
            "exercise_count": exercise_count
        })
    return result