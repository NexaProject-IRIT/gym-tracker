from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Формат одного сообщения, который уходит на фронт."""
    id = serializers.CharField(source='uid', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'workout_suggestion', 'workout_imports', 'created_at')
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    """Вход для POST /ai/chat/ — одно сообщение от пользователя."""
    message = serializers.CharField(max_length=15000, allow_blank=False)