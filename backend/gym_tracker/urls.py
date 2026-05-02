from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from workouts.views import ExportWorkoutsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('profiles.urls')),
    path('exercises/', include('exercises.urls')),
    path('workouts/', include('workouts.urls')),
    path('export/', ExportWorkoutsView.as_view(), name='export'),
    path('ai/', include('ai.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static('/kb-images/', document_root=settings.BASE_DIR / 'knowledge_base' / 'images')