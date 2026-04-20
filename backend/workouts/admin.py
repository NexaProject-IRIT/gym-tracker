from django.contrib import admin
from .models import Workout, WorkoutExercise


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 1
    fields = ['exercise_id', 'custom_name', 'sets', 'reps', 'weight', 'time', 'distance', 'is_custom']


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'date', 'color']
    list_filter = ['type', 'date']
    search_fields = ['name']
    inlines = [WorkoutExerciseInline]
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'date', 'color')
        }),
    )