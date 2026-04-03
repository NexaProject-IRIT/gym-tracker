from django.contrib import admin
from .models import Exercise, ExerciseParameter


class ExerciseParameterInline(admin.TabularInline):
    model = ExerciseParameter
    extra = 1
    fields = ['type', 'label', 'unit']


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'equipment', 'created_at', 'updated_at']
    list_filter = ['tags', 'target_muscles']
    search_fields = ['name', 'description']
    inlines = [ExerciseParameterInline]
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'equipment')
        }),
        ('Мышцы и теги', {
            'fields': ('target_muscles', 'tags')
        }),
        ('Изображения', {
            'fields': ('images',)
        }),
    )