from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutViewSet, BulkImportView, BulkRenameView

router = DefaultRouter()
router.register('', WorkoutViewSet, basename='workout')

urlpatterns = [
    path('bulk-import/', BulkImportView.as_view(), name='workout-bulk-import'),
    path('bulk-rename/', BulkRenameView.as_view(), name='workout-bulk-rename'),
    path('', include(router.urls)),
]
