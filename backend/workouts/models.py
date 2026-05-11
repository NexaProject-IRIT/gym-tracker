from django.db import models
from django.contrib.auth.models import User
import uuid


class Workout(models.Model):
    WORKOUT_TYPES = [
        ('strength', 'Силовая'),
        ('cardio', 'Кардио'),
        ('flexibility', 'Гибкость'),
        ('functional', 'Функциональная'),
        ('custom', 'Кастомная'),
    ]

    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=WORKOUT_TYPES)
    date = models.DateTimeField()
    color = models.CharField(max_length=7, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workouts'
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class WorkoutExercise(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    exercise_id = models.CharField(max_length=255, blank=True, null=True)
    custom_name = models.CharField(max_length=255, blank=True, null=True)
    sets = models.IntegerField(default=0, blank=True, null=True)
    reps = models.IntegerField(default=0, blank=True, null=True)
    weight = models.FloatField(blank=True, null=True)
    time = models.IntegerField(blank=True, null=True)
    distance = models.FloatField(blank=True, null=True)
    is_custom = models.BooleanField(default=False)
    # Массив активных параметров упражнения: ['sets', 'reps', 'weight'] и т.д.
    # Без этого поля фронтенд не знает, какие поля рендерить в карточке.
    parameters = models.JSONField(default=list, blank=True)
    is_done = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'workout_exercises'
        ordering = ['order', 'id']

    def __str__(self):
        name = self.custom_name if self.is_custom else self.exercise_id
        return f"{self.workout.name} - {name}"