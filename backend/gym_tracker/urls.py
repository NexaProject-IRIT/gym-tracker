from django.contrib import admin
from django.urls import path, include
from workouts.views import ExportWorkoutsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('profiles.urls')),
    path('exercises/', include('exercises.urls')),
    path('workouts/', include('workouts.urls')),
    path('export/', ExportWorkoutsView.as_view(), name='export'),
]