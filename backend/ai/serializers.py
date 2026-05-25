from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Формат одного сообщения, который уходит на фронт."""
    id = serializers.CharField(source='uid', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'workout_suggestion', 'workout_imports', 'workout_renames', 'file_name', 'created_at')
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    """Вход для POST /ai/chat/ — одно сообщение от пользователя."""
    message = serializers.CharField(max_length=15000, allow_blank=False)
    # Содержимое прикреплённого файла — не сохраняется в историю, только уходит в LLM
    file_content = serializers.CharField(max_length=300000, allow_blank=True, required=False, default='')
    # Имя файла — сохраняем в историю, чтобы рендерить бейдж рядом с сообщением
    file_name = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')