from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'short_content', 'has_workout', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('user__username', 'content')
    readonly_fields = ('uid', 'created_at')
    ordering = ('-created_at',)

    def short_content(self, obj):
        content = obj.content or ''
        return content[:60] + ('…' if len(content) > 60 else '')
    short_content.short_description = 'Сообщение'

    def has_workout(self, obj):
        return bool(obj.workout_suggestion)
    has_workout.boolean = True
    has_workout.short_description = 'Есть тренировка'