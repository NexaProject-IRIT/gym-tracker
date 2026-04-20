from django.urls import path
from .views import ExerciseListView, ExerciseDetailView, EquipmentListView, EquipmentDetailView

urlpatterns = [
    # Exercises
    path('', ExerciseListView.as_view(), name='exercise-list'),
    path('<int:pk>/', ExerciseDetailView.as_view(), name='exercise-detail'),
    path('search/', ExerciseListView.as_view(), name='exercise-search'),  # поиск через query param

    # Equipment
    path('equipment/', EquipmentListView.as_view(), name='equipment-list'),
    path('equipment/<int:pk>/', EquipmentDetailView.as_view(), name='equipment-detail'),
]