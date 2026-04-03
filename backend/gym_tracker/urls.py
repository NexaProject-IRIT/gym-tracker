from django.contrib import admin
from django.urls import path, include
from workouts.views import ExportWorkoutsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('profiles.urls')),
    path('api/exercises/', include('exercises.urls')),
    path('api/workouts/', include('workouts.urls')),
    path('api/export/', ExportWorkoutsView.as_view(), name='export'),
]