from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.connection import get_db
from app.models.workout import Workout as WorkoutModel, WorkoutExercise as WorkoutExerciseModel
from app.schemas.workout import Workout, WorkoutListItem
from sqlalchemy import or_


router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.get("/", response_model=List[WorkoutListItem])
def get_workouts(skip = Query(0, ge=0), limit = Query(100, ge=1, le=100), type = None,
        db = Depends(get_db)):
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
            "color": workout.color or "#808080",
            "exercise_count": exercise_count
        })
    return result

@router.get("/{workout_id}", response_model=Workout)
def get_workout(workout_id, db = Depends(get_db)):
    workout = db.query(WorkoutModel).filter(WorkoutModel.uid == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    exercises = []
    for we in workout.exercises:
        exercises.append({
            "id": we.uid,
            "exerciseId": we.exercise_id,
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
        "color": workout.color or "#808080"
    }

@router.get("/recent/", response_model=List[WorkoutListItem])
def get_recent_workouts(limit: int = Query(5, ge=1, le=20, description="Количество тренировок"),
        db = Depends(get_db)):
    workouts = db.query(WorkoutModel).order_by(WorkoutModel.date.desc()).limit(limit).all()
    result = []
    for workout in workouts:
        exercise_count = len(workout.exercises) if workout.exercises else 0
        result.append({
            "id": workout.uid,
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "color": workout.color or "#808080",
            "exercise_count": exercise_count
        })
    return result

@router.get("/search/", response_model=List[WorkoutListItem])
def search_workouts(q = Query(..., min_length=1), skip = Query(0, ge=0),
        limit = Query(100, ge=1, le=100), db = Depends(get_db)):
    workouts = (db.query(WorkoutModel).filter(
        or_(WorkoutModel.name.ilike(f"%{q}%"), WorkoutModel.type.ilike(f"%{q}%")))
        .order_by(WorkoutModel.date.desc()).offset(skip).limit(limit).all()
    )
    result = []
    for workout in workouts:
        exercise_count = len(workout.exercises) if workout.exercises else 0
        result.append({
            "id": workout.uid,
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "color": workout.color or "#808080",
            "exercise_count": exercise_count
        })
    return result