from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutViewSet, BulkImportView

router = DefaultRouter()
router.register('', WorkoutViewSet, basename='workout')

urlpatterns = [
    path('bulk-import/', BulkImportView.as_view(), name='workout-bulk-import'),
    path('', include(router.urls)),
]
