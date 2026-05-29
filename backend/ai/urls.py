from django.urls import path
from .views import ChatView, HistoryView, HealthView

urlpatterns = [
    path('chat/', ChatView.as_view(), name='ai-chat'),
    path('history/', HistoryView.as_view(), name='ai-history'),
    path('health/', HealthView.as_view(), name='ai-health'),
]