from django.contrib import admin
from .models import Exercise, ExerciseParameter, Equipment


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

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_tags', 'image', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['uid', 'created_at', 'updated_at']

    def get_tags(self, obj):
        return ', '.join(obj.tags) if obj.tags else '-'

    get_tags.short_description = 'Теги'

    fieldsets = (
        ('Основная информация', {
            'fields': ('uid', 'name', 'description', 'tags', 'image')
        }),
        ('Системная информация', {
            'fields': ('source_file', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )