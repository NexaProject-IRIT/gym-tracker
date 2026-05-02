from django.db import models
from django.contrib.auth.models import User
import uuid


class ChatMessage(models.Model):
    """
    Одно сообщение в чате с ИИ-тренером.
    Храним персистентно: пользователь может вернуться и продолжить разговор,
    плюс это даёт нам контекст для следующих ответов модели.
    """
    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('assistant', 'Ассистент'),
    ]

    uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_messages')
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    # Если в ответе ассистента был <workout>...</workout> — сохраняем распарсенный JSON,
    # чтобы фронт при перезагрузке страницы опять увидел кнопку «Добавить тренировку».
    workout_suggestion = models.JSONField(blank=True, null=True)
    # Массив тренировок для массового импорта из журнала пользователя
    workout_imports = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_chat_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        preview = (self.content or '')[:40]
        return f"{self.user.username} [{self.role}]: {preview}"