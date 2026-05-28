from collections import defaultdict
from datetime import datetime, date as date_cls, timedelta
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Max
from django.http import HttpResponse
from .models import Workout, WorkoutExercise
from .serializers import (
    WorkoutSerializer, WorkoutListSerializer,
    WorkoutCreateSerializer, WorkoutUpdateSerializer
)
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
        "order": we.order,
    }


def _calculate_prs(user, workout):
    """
    Возвращает set UID упражнений из тренировки, где вес — исторический рекорд пользователя.
    Два запроса: один для kb-упражнений (по exercise_id), один для кастомных (по custom_name).
    """
    exercises_with_weight = [
        we for we in workout.exercises.all()
        if we.weight and float(we.weight) > 0
    ]
    if not exercises_with_weight:
        return set()

    kb_ids = [e.exercise_id for e in exercises_with_weight if e.exercise_id and not e.is_custom]
    custom_names = [e.custom_name for e in exercises_with_weight if e.is_custom and e.custom_name]

    hist_by_exercise_id = {}
    if kb_ids:
        for row in (
            WorkoutExercise.objects
            .filter(workout__user=user, exercise_id__in=kb_ids, weight__isnull=False)
            .exclude(workout=workout)
            .values('exercise_id')
            .annotate(max_weight=Max('weight'))
        ):
            hist_by_exercise_id[row['exercise_id']] = float(row['max_weight'])

    hist_by_custom_name = {}
    if custom_names:
        for row in (
            WorkoutExercise.objects
            .filter(workout__user=user, custom_name__in=custom_names, weight__isnull=False)
            .exclude(workout=workout)
            .values('custom_name')
            .annotate(max_weight=Max('weight'))
        ):
            hist_by_custom_name[row['custom_name']] = float(row['max_weight'])

    pr_uids = set()
    for we in exercises_with_weight:
        current = float(we.weight)
        if we.exercise_id and not we.is_custom:
            hist_max = hist_by_exercise_id.get(we.exercise_id)
        elif we.custom_name:
            hist_max = hist_by_custom_name.get(we.custom_name)
        else:
            continue
        if hist_max is None or current >= hist_max:
            pr_uids.add(we.uid)

    return pr_uids


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
        pr_uids = _calculate_prs(request.user, workout)
        return Response({
            "id": str(workout.uid),
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "notes": workout.notes or "",
            "exercises": [
                {**serialize_exercise(we), "isPR": we.uid in pr_uids}
                for we in workout.exercises.all()
            ],
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
    def exercise_done(self, request, uid=None, ex_uid=None):
        workout = self.get_object()
        exercise = workout.exercises.filter(uid=ex_uid).first()
        if not exercise:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        total_sets = max(exercise.sets or 0, 1)
        updates = []

        if 'setsDone' in request.data:
            sets_done = int(request.data.get('setsDone') or 0)
            sets_done = max(0, min(sets_done, total_sets))
            exercise.sets_done = sets_done
            exercise.is_done = sets_done >= total_sets
            updates = ['sets_done', 'is_done']
        else:
            new_is_done = request.data.get('isDone', not exercise.is_done)
            exercise.is_done = new_is_done
            exercise.sets_done = total_sets if new_is_done else 0
            updates = ['is_done', 'sets_done']

        exercise.save(update_fields=updates)
        return Response({'isDone': exercise.is_done, 'setsDone': exercise.sets_done})

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
        today = timezone.localdate()
        start_of_month = today.replace(day=1)
        total = Workout.objects.filter(user=user).count()
        this_month = Workout.objects.filter(user=user, date__gte=start_of_month, date__lte=today).count()
        return Response({"total": total, "this_month": this_month})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Универсальная сводка для страницы /analytics.
        Параметр period: 7 / 30 / 90 / 0 (всё время).
        """
        try:
            period = int(request.query_params.get('period', 30))
        except (TypeError, ValueError):
            period = 30
        period = max(0, period)

        today = timezone.localdate()
        qs = Workout.objects.filter(user=request.user).prefetch_related('exercises')
        if period > 0:
            qs = qs.filter(date__gte=today - timedelta(days=period - 1), date__lte=today)
        qs = qs.order_by('date')

        by_type = defaultdict(int)
        active_dates = set()
        exercise_counts = defaultdict(int)
        exercise_max_weight = defaultdict(float)
        exercise_type_hint = {}
        tonnage_series = []
        distance_series = []
        time_series = []
        exercise_names_set = set()
        all_exercise_names = set()

        for w in qs:
            by_type[w.type] += 1
            active_dates.add(w.date)

            total_tonnage = 0.0
            total_distance = 0.0
            total_time = 0

            for ex in w.exercises.all():
                name = (ex.custom_name or ex.exercise_id or '').strip()
                if name:
                    exercise_counts[name] += 1
                    all_exercise_names.add(name)
                    exercise_type_hint.setdefault(name, w.type)
                    if ex.weight:
                        exercise_max_weight[name] = max(exercise_max_weight[name], float(ex.weight))
                        exercise_names_set.add(name)

                if ex.weight and ex.sets and ex.reps:
                    total_tonnage += float(ex.weight) * int(ex.sets) * int(ex.reps)
                if ex.distance:
                    total_distance += float(ex.distance)
                if ex.time:
                    total_time += int(ex.time)

            iso_date = w.date.isoformat()
            if total_tonnage > 0:
                tonnage_series.append({'date': iso_date, 'value': round(total_tonnage, 1), 'name': w.name})
            if total_distance > 0:
                distance_series.append({'date': iso_date, 'value': round(total_distance, 2), 'name': w.name})
            if total_time > 0:
                time_series.append({'date': iso_date, 'value': total_time, 'name': w.name})

        top_exercises = sorted(exercise_counts.items(), key=lambda x: x[1], reverse=True)[:6]

        # Доминирующий тип — для адаптивных KPI
        dominant_type = max(by_type, key=by_type.get) if by_type else None

        # Стрик по неделям (только последние ~52 недели)
        all_workouts = Workout.objects.filter(user=request.user).values_list('date', flat=True)
        weeks_with_workouts = {(d - timedelta(days=d.weekday())) for d in all_workouts}
        streak = 0
        cursor = today - timedelta(days=today.weekday())
        for _ in range(200):
            if cursor in weeks_with_workouts:
                streak += 1
                cursor -= timedelta(days=7)
            elif streak == 0 and cursor == today - timedelta(days=today.weekday()):
                # Текущая неделя без тренировок не сбрасывает
                cursor -= timedelta(days=7)
            else:
                break

        return Response({
            'period_days': period,
            'dominant_type': dominant_type,
            'summary': {
                'total_workouts': sum(by_type.values()),
                'active_days': len(active_dates),
                'unique_exercises': len(all_exercise_names),
                'weekly_streak': streak,
                'total_tonnage': round(sum(s['value'] for s in tonnage_series), 1),
                'total_distance': round(sum(s['value'] for s in distance_series), 2),
                'total_time': sum(s['value'] for s in time_series),
            },
            'by_type': dict(by_type),
            'tonnage_series': tonnage_series,
            'distance_series': distance_series,
            'time_series': time_series,
            'top_exercises': [
                {
                    'name': n,
                    'count': c,
                    'max_weight': exercise_max_weight.get(n) or None,
                    'type_hint': exercise_type_hint.get(n, 'custom'),
                }
                for n, c in top_exercises
            ],
            'exercise_names': sorted(exercise_names_set),
        })

    @action(detail=False, methods=['get'], url_path='exercise-progress')
    def exercise_progress(self, request):
        name = request.query_params.get('name', '').strip()
        if not name:
            return Response({'error': 'name parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        exercises = (
            WorkoutExercise.objects
            .filter(workout__user=request.user)
            .filter(
                Q(custom_name__icontains=name) |
                Q(exercise_id__icontains=name)
            )
            .select_related('workout')
            .order_by('workout__date')
        )

        data = []
        for ex in exercises:
            if ex.weight is None:
                continue
            data.append({
                'date': ex.workout.date,
                'weight': ex.weight,
                'sets': ex.sets or 0,
                'reps': ex.reps or 0,
                'name': ex.custom_name or ex.exercise_id,
            })

        return Response(data)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        user = request.user
        deleted_count, _ = Workout.objects.filter(user=user).delete()
        return Response({'deleted': deleted_count}, status=status.HTTP_200_OK)


class BulkImportView(APIView):
    """
    POST /workouts/bulk-import/
    Создаёт несколько тренировок из распарсенного ИИ журнала пользователя.
    Вход: { "workouts": [{name, type, date, exercises: [{name, sets?, reps?, weight?, time?, distance?}]}] }
    Выход: { "created": [{id, name, date}], "count": N }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        workouts_data = request.data.get('workouts', [])
        if not isinstance(workouts_data, list):
            return Response({'error': 'workouts must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for workout_data in workouts_data:
            name = str(workout_data.get('name', 'Тренировка')).strip()[:255] or 'Тренировка'
            wtype = workout_data.get('type', 'custom')
            if wtype not in WORKOUT_COLORS:
                wtype = 'custom'

            raw_date = workout_data.get('date', '')
            try:
                workout_date = datetime.strptime(str(raw_date), '%Y-%m-%d').date()
            except (ValueError, TypeError):
                workout_date = date_cls.today()

            workout = Workout.objects.create(
                user=request.user,
                name=name,
                type=wtype,
                date=workout_date,
                color=WORKOUT_COLORS.get(wtype, WORKOUT_COLORS['custom']),
            )

            for ex_data in workout_data.get('exercises', []):
                ex_name = str(ex_data.get('name', '')).strip()[:255]
                if not ex_name:
                    continue

                params = []
                sets_val  = ex_data.get('sets')
                reps_val  = ex_data.get('reps')
                weight_val = ex_data.get('weight')
                time_val  = ex_data.get('time')
                dist_val  = ex_data.get('distance')

                if sets_val   is not None: params.append('sets')
                if reps_val   is not None: params.append('reps')
                if weight_val is not None: params.append('weight')
                if time_val   is not None: params.append('time')
                if dist_val   is not None: params.append('distance')
                if not params:
                    params = ['sets', 'reps']

                WorkoutExercise.objects.create(
                    workout=workout,
                    custom_name=ex_name,
                    exercise_id='',
                    is_custom=True,
                    sets=int(sets_val) if sets_val is not None else 0,
                    reps=int(reps_val) if reps_val is not None else 0,
                    weight=float(weight_val) if weight_val is not None else None,
                    time=int(time_val) if time_val is not None else None,
                    distance=float(dist_val) if dist_val is not None else None,
                    parameters=params,
                )

            created.append({'id': str(workout.uid), 'name': workout.name, 'date': str(workout.date)})

        return Response({'created': created, 'count': len(created)}, status=status.HTTP_201_CREATED)


class BulkRenameView(APIView):
    """
    POST /workouts/bulk-rename/
    Переименовывает несколько тренировок пользователя.
    Вход: { "renames": [{"id": "uuid", "new_name": "..."}] }
    Выход: { "updated": [{"id": "uuid", "name": "..."}], "count": N }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        renames = request.data.get('renames', [])
        if not isinstance(renames, list):
            return Response({'error': 'renames must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        updated = []
        for item in renames:
            workout_id = str(item.get('id', '')).strip()
            new_name = str(item.get('new_name', '')).strip()[:255]
            if not workout_id or not new_name:
                continue
            try:
                workout = Workout.objects.get(uid=workout_id, user=request.user)
            except Workout.DoesNotExist:
                continue
            workout.name = new_name
            workout.save(update_fields=['name'])
            updated.append({'id': str(workout.uid), 'name': workout.name})

        return Response({'updated': updated, 'count': len(updated)}, status=status.HTTP_200_OK)


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