from django.db import models
import uuid


class Exercise(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    equipment = models.CharField(max_length=255, blank=True, null=True)
    target_muscles = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    images = models.JSONField(default=list)
    source_file = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exercises'

    def __str__(self):
        return self.name


class ExerciseParameter(models.Model):
    PARAMETER_TYPES = [
        ('weight', 'Вес'),
        ('reps', 'Повторения'),
        ('sets', 'Подходы'),
        ('time', 'Время'),
        ('distance', 'Расстояние'),
    ]

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='parameters')
    type = models.CharField(max_length=20, choices=PARAMETER_TYPES)
    label = models.CharField(max_length=100)
    unit = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'exercise_parameters'

    def __str__(self):
        return f"{self.exercise.name} - {self.label}"