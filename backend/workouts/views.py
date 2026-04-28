from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.http import HttpResponse
from .models import Workout, WorkoutExercise
from .serializers import (
    WorkoutSerializer, WorkoutListSerializer,
    WorkoutCreateSerializer, WorkoutUpdateSerializer
)
from datetime import datetime
from .services.export import generate_export_text


WORKOUT_COLORS = {
    "strength": "#FF6B6B",
    "cardio": "#4ECDC4",
    "flexibility": "#95E1D3",
    "functional": "#FFE66D",
    "custom": "#A8E6CF"
}


def serialize_exercise(we: WorkoutExercise) -> dict:
    """
    Централизованная сериализация упражнения в dict для ответов API.
    Вынесено в отдельную функцию, чтобы не дублировать логику в retrieve/create/update.
    Ключевой момент: всегда включаем parameters — без него фронтенд
    не знает какие поля (вес/повторы/время) отображать в карточке.
    """
    return {
        "id": str(we.uid),
        "exerciseId": we.exercise_id or "",
        "customName": we.custom_name,
        "sets": we.sets or 0,
        "reps": we.reps or 0,
        "weight": we.weight,
        "time": we.time,
        "distance": we.distance,
        "isCustom": we.is_custom,
        "isDone": we.is_done,
        "parameters": we.parameters if we.parameters else [],
    }


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class WorkoutViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = 'uid'

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutListSerializer
        if self.action == 'create':
            return WorkoutCreateSerializer
        if self.action in ['update', 'partial_update']:
            return WorkoutUpdateSerializer
        return WorkoutSerializer

    def perform_create(self, serializer):
        if not serializer.validated_data.get('color'):
            workout_type = serializer.validated_data.get('type')
            serializer.validated_data['color'] = WORKOUT_COLORS.get(workout_type, WORKOUT_COLORS['custom'])
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        workout_type = request.query_params.get('type')
        if workout_type:
            queryset = queryset.filter(type=workout_type)
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))
        queryset = queryset.order_by('-date')[skip:skip + limit]
        data = []
        for workout in queryset:
            data.append({
                'id': str(workout.uid),
                'name': workout.name,
                'type': workout.type,
                'date': workout.date,
                'color': workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom']),
                'exercise_count': workout.exercises.count()
            })

        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        workout = self.get_object()
        return Response({
            "id": str(workout.uid),
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "notes": workout.notes or "",
            "exercises": [serialize_exercise(we) for we in workout.exercises.all()],
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom'])
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        workout = serializer.instance

        return Response({
            "id": str(workout.uid),
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "notes": workout.notes or "",
            "exercises": [serialize_exercise(we) for we in workout.exercises.all()],
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom'])
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        workout = self.get_object()
        serializer = self.get_serializer(workout, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        workout = serializer.instance

        return Response({
            "id": str(workout.uid),
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "notes": workout.notes or "",
            "exercises": [serialize_exercise(we) for we in workout.exercises.all()],
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom'])
        })

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        workout = self.get_object()
        workout.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path=r'exercises/(?P<ex_uid>[^/.]+)/done')
    def exercise_done(self, request, pk=None, ex_uid=None):
        workout = self.get_object()
        exercise = workout.exercises.filter(uid=ex_uid).first()
        if not exercise:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)
        exercise.is_done = request.data.get('isDone', not exercise.is_done)
        exercise.save(update_fields=['is_done'])
        return Response({'isDone': exercise.is_done})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        limit = int(request.query_params.get('limit', 5))
        workouts = self.get_queryset().order_by('-date')[:limit]

        data = []
        for workout in workouts:
            data.append({
                'id': str(workout.uid),
                'name': workout.name,
                'type': workout.type,
                'date': workout.date,
                'color': workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom']),
                'exercise_count': workout.exercises.count()
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if not q:
            return Response([])

        workouts = self.get_queryset().filter(
            Q(name__icontains=q) | Q(type__icontains=q)
        ).order_by('-date')[skip:skip + limit]

        data = []
        for workout in workouts:
            data.append({
                'id': str(workout.uid),
                'name': workout.name,
                'type': workout.type,
                'date': workout.date,
                'color': workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom']),
                'exercise_count': workout.exercises.count()
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        now = timezone.now()
        start_of_month = datetime(now.year, now.month, 1, tzinfo=now.tzinfo)
        total = Workout.objects.filter(user=user).count()
        this_month = Workout.objects.filter(user=user, date__gte=start_of_month, date__lte=now).count()
        return Response({"total": total, "this_month": this_month})

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        user = request.user
        deleted_count, _ = Workout.objects.filter(user=user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExportWorkoutsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workouts = Workout.objects.filter(user=request.user).order_by('-date')
        workouts_data = []
        for workout in workouts:
            exercises_data = []
            for ex in workout.exercises.all():
                exercises_data.append({
                    "exerciseId": ex.exercise_id,
                    "customName": ex.custom_name,
                    "sets": ex.sets,
                    "reps": ex.reps,
                    "weight": ex.weight,
                    "time": ex.time,
                    "distance": ex.distance,
                    "isCustom": ex.is_custom,
                    "parameters": ex.parameters if ex.parameters else [],
                })

            workouts_data.append({
                "name": workout.name,
                "type": workout.type,
                "date": workout.date.isoformat(),
                "exercises": exercises_data,
                "notes": workout.notes
            })

        export_text = generate_export_text(workouts_data)

        if not export_text:
            export_text = "Нет тренировок для экспорта"

        response = HttpResponse(export_text, content_type='text/plain; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="workouts_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt"'

        return response