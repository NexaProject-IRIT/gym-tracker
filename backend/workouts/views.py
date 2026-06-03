import csv
import io
import json
import re
from collections import defaultdict
from datetime import datetime, date as date_cls, timedelta
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
from .services.export import generate_export_text


WORKOUT_COLORS = {
    "strength": "#FF6B6B",
    "cardio": "#4ECDC4",
    "flexibility": "#95E1D3",
    "functional": "#FFE66D",
    "custom": "#A8E6CF"
}


# Сколько дней тренировки лежат в корзине до окончательного удаления.
TRASH_RETENTION_DAYS = 30


def _purge_expired_trash(user):
    """Удаляет тренировки, которые лежат в корзине дольше TRASH_RETENTION_DAYS.
    Вызывается лениво при обращении к корзине/списку — не нужен cron."""
    threshold = timezone.now() - timedelta(days=TRASH_RETENTION_DAYS)
    Workout.objects.filter(
        user=user,
        deleted_at__isnull=False,
        deleted_at__lt=threshold,
    ).delete()


# Границы значений для импорта из LLM. LLM иногда галлюцинирует
# отрицательные или гигантские числа — без clamp'а они портят аналитику.
EX_LIMITS = {
    'sets':     (0, 100),
    'reps':     (0, 10000),
    'weight':   (0.0, 2000.0),   # кг
    'time':     (0, 86400),      # секунды (сутки)
    'distance': (0.0, 1000.0),   # км
}


def _clamp_int(value, lo, hi):
    try:
        v = int(value)
    except (TypeError, ValueError):
        return None
    return max(lo, min(v, hi))


def _clamp_float(value, lo, hi):
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return max(lo, min(v, hi))


def serialize_exercise(we: WorkoutExercise) -> dict:
    """
    Централизованная сериализация упражнения в dict для ответов API.
    Вынесено в отдельную функцию, чтобы не дублировать логику в retrieve/create/update.
    Ключевой момент: всегда включаем parameters — без него фронтенд
    не знает какие поля (вес/повторы/время) отображать в карточке.
    setsDone тоже обязателен: без него GET не отдаёт частичный прогресс
    подходов, и при возврате на тренировку чекбоксы сбрасываются на 0.
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
        "setsDone": we.sets_done or 0,
        "parameters": we.parameters if we.parameters else [],
        "order": we.order,
    }


_NAME_PUNCT_RE = re.compile(r'[^\w\s]', flags=re.UNICODE)
_NAME_SPACES_RE = re.compile(r'\s+')


def _norm_ex_name(name: str) -> str:
    """Нормализуем кастомное имя упражнения, чтобы «Жим штанги лежа», «Жим штанги лёжа»
    и «жим штанги, лежа» считались одним упражнением для целей PR/группировки.
    Приводим к lower, схлопываем ё→е, убираем пунктуацию и лишние пробелы."""
    s = (name or '').strip().lower().replace('ё', 'е')
    s = _NAME_PUNCT_RE.sub(' ', s)
    s = _NAME_SPACES_RE.sub(' ', s).strip()
    return s


def _calculate_prs(user, workout):
    """
    Возвращает set UID упражнений из тренировки, где вес — исторический рекорд пользователя.
    Группируем: KB-упражнения по exercise_id (он стабилен), кастомные —
    по нормализованному имени (см. _norm_ex_name). Корзина в истории не учитывается.
    """
    exercises_with_weight = [
        we for we in workout.exercises.all()
        if we.weight and float(we.weight) > 0
    ]
    if not exercises_with_weight:
        return set()

    def key_for(exercise_id: str, custom_name: str, is_custom: bool):
        if exercise_id and not is_custom:
            return ('kb', exercise_id)
        norm = _norm_ex_name(custom_name)
        if not norm:
            return None
        return ('custom', norm)

    # Ключи текущей тренировки — только их историю надо подтягивать
    we_keys = {}
    relevant_keys = set()
    for we in exercises_with_weight:
        k = key_for(we.exercise_id or '', we.custom_name or '', we.is_custom)
        if k is None:
            continue
        we_keys[we.uid] = k
        relevant_keys.add(k)

    if not relevant_keys:
        return set()

    kb_ids = {k[1] for k in relevant_keys if k[0] == 'kb'}
    has_custom = any(k[0] == 'custom' for k in relevant_keys)

    # Один запрос: тянем KB-историю по exercise_id (узко) и кастомную (всю — но
    # фильтруем in-Python после _norm_ex_name, так как нормализованных значений в БД нет).
    historical = (
        WorkoutExercise.objects
        .filter(workout__user=user, workout__deleted_at__isnull=True, weight__isnull=False)
        .exclude(workout=workout)
    )
    if not has_custom:
        historical = historical.filter(exercise_id__in=kb_ids, is_custom=False)
    historical = historical.values('exercise_id', 'custom_name', 'is_custom', 'weight')

    hist_max_by_key = {}
    for row in historical:
        k = key_for(row['exercise_id'] or '', row['custom_name'] or '', row['is_custom'])
        if k is None or k not in relevant_keys:
            continue
        w = float(row['weight'])
        if w > hist_max_by_key.get(k, -1.0):
            hist_max_by_key[k] = w

    pr_uids = set()
    for we in exercises_with_weight:
        k = we_keys.get(we.uid)
        if k is None:
            continue
        hist_max = hist_max_by_key.get(k)
        current = float(we.weight)
        # Нет истории → первое появление = твой рекорд (бейдж покажется один раз).
        # Есть история → нужен строго больший вес. `current == hist_max` — это «повторил»,
        # а не «побил», бейдж в таком случае не даём.
        if hist_max is None or current > hist_max:
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
        # По умолчанию возвращаем только активные тренировки.
        # Корзина (trash/restore/purge) ходит через отдельные actions с собственным queryset.
        return Workout.objects.filter(user=self.request.user, deleted_at__isnull=True)

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
        _purge_expired_trash(request.user)
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

    def _workout_response(self, request, workout):
        """Единая форма ответа для retrieve/create/update. Все три должны
        отдавать isPR — иначе бейдж «рекорд» появляется только при ручной
        навигации на тренировку, но не сразу после сохранения."""
        pr_uids = _calculate_prs(request.user, workout)
        return {
            "id": str(workout.uid),
            "name": workout.name,
            "type": workout.type,
            "date": workout.date,
            "notes": workout.notes or "",
            "exercises": [
                {**serialize_exercise(we), "isPR": we.uid in pr_uids}
                for we in workout.exercises.all()
            ],
            "color": workout.color or WORKOUT_COLORS.get(workout.type, WORKOUT_COLORS['custom']),
        }

    def retrieve(self, request, *args, **kwargs):
        workout = self.get_object()
        return Response(self._workout_response(request, workout))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(self._workout_response(request, serializer.instance), status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        workout = self.get_object()
        serializer = self.get_serializer(workout, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self._workout_response(request, serializer.instance))

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Soft-delete: помечаем deleted_at, физически чистим через 30 дней (см. _purge_expired_trash).
        workout = self.get_object()
        workout.deleted_at = timezone.now()
        workout.save(update_fields=['deleted_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def trash(self, request):
        _purge_expired_trash(request.user)
        deleted = Workout.objects.filter(
            user=request.user,
            deleted_at__isnull=False,
        ).order_by('-deleted_at')

        data = []
        for w in deleted:
            expires_at = w.deleted_at + timedelta(days=TRASH_RETENTION_DAYS)
            days_left = max(0, (expires_at.date() - timezone.localdate()).days)
            data.append({
                'id': str(w.uid),
                'name': w.name,
                'type': w.type,
                'date': w.date,
                'color': w.color or WORKOUT_COLORS.get(w.type, WORKOUT_COLORS['custom']),
                'exercise_count': w.exercises.count(),
                'deleted_at': w.deleted_at,
                'days_left': days_left,
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def restore(self, request, uid=None):
        workout = Workout.objects.filter(uid=uid, user=request.user, deleted_at__isnull=False).first()
        if not workout:
            return Response({'error': 'Workout not in trash'}, status=status.HTTP_404_NOT_FOUND)
        workout.deleted_at = None
        workout.save(update_fields=['deleted_at'])
        return Response({'id': str(workout.uid), 'restored': True})

    @action(detail=True, methods=['delete'])
    def purge(self, request, uid=None):
        # Окончательное физическое удаление из корзины.
        workout = Workout.objects.filter(uid=uid, user=request.user, deleted_at__isnull=False).first()
        if not workout:
            return Response({'error': 'Workout not in trash'}, status=status.HTTP_404_NOT_FOUND)
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
        active = Workout.objects.filter(user=user, deleted_at__isnull=True)
        total = active.count()
        this_month = active.filter(date__gte=start_of_month, date__lte=today).count()
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
        qs = Workout.objects.filter(user=request.user, deleted_at__isnull=True).prefetch_related('exercises')
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
                    time_multiplier = int(ex.sets) if ex.sets and int(ex.sets) > 0 else 1
                    total_time += int(ex.time) * time_multiplier

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
        all_workouts = Workout.objects.filter(user=request.user, deleted_at__isnull=True).values_list('date', flat=True)
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
            .filter(workout__user=request.user, workout__deleted_at__isnull=True)
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
        # Массовый soft-delete всех активных тренировок: можно восстановить из корзины в течение 30 дней.
        now = timezone.now()
        updated_count = Workout.objects.filter(
            user=request.user,
            deleted_at__isnull=True,
        ).update(deleted_at=now)
        return Response({'deleted': updated_count}, status=status.HTTP_200_OK)


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

                sets_val   = _clamp_int(  ex_data.get('sets'),     *EX_LIMITS['sets'])     if ex_data.get('sets')     is not None else None
                reps_val   = _clamp_int(  ex_data.get('reps'),     *EX_LIMITS['reps'])     if ex_data.get('reps')     is not None else None
                weight_val = _clamp_float(ex_data.get('weight'),   *EX_LIMITS['weight'])   if ex_data.get('weight')   is not None else None
                time_val   = _clamp_int(  ex_data.get('time'),     *EX_LIMITS['time'])     if ex_data.get('time')     is not None else None
                dist_val   = _clamp_float(ex_data.get('distance'), *EX_LIMITS['distance']) if ex_data.get('distance') is not None else None

                params = []
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
                    sets=sets_val if sets_val is not None else 0,
                    reps=reps_val if reps_val is not None else 0,
                    weight=weight_val,
                    time=time_val,
                    distance=dist_val,
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
        failed = []
        for item in renames:
            workout_id = str(item.get('id', '')).strip()
            new_name = str(item.get('new_name', '')).strip()[:255]
            if not workout_id or not new_name:
                failed.append({'id': workout_id, 'reason': 'invalid_input'})
                continue
            try:
                workout = Workout.objects.get(uid=workout_id, user=request.user)
            except Workout.DoesNotExist:
                failed.append({'id': workout_id, 'reason': 'not_found'})
                continue
            workout.name = new_name
            workout.save(update_fields=['name'])
            updated.append({'id': str(workout.uid), 'name': workout.name})

        return Response({
            'updated': updated,
            'failed': failed,
            'count': len(updated),
            'failed_count': len(failed),
        }, status=status.HTTP_200_OK)


class ExportWorkoutsView(APIView):
    """
    GET /export/?fmt=txt|csv|json (default: txt).
    NB: используем `fmt`, а не `format` — последний зарезервирован DRF под
    content-negotiation override (URL_FORMAT_OVERRIDE), из-за чего ?format=csv/txt
    отбивались 404 ещё до того, как view получал управление.
    Корзина в экспорт не попадает — экспортируем только активные тренировки.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fmt = (request.query_params.get('fmt') or 'txt').lower().strip()
        if fmt not in ('txt', 'csv', 'json'):
            fmt = 'txt'

        workouts = (
            Workout.objects
            .filter(user=request.user, deleted_at__isnull=True)
            .order_by('-date')
        )
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

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"workouts_export_{timestamp}.{fmt}"

        if fmt == 'json':
            payload = json.dumps(
                {"exported_at": datetime.now().isoformat(), "workouts": workouts_data},
                ensure_ascii=False,
                indent=2,
            )
            response = HttpResponse(payload, content_type='application/json; charset=utf-8')
        elif fmt == 'csv':
            buf = io.StringIO()
            # BOM — чтобы Excel корректно открывал кириллицу.
            buf.write('﻿')
            writer = csv.writer(buf)
            writer.writerow([
                'date', 'workout_name', 'workout_type', 'workout_notes',
                'exercise', 'is_custom', 'sets', 'reps', 'weight_kg', 'time_sec', 'distance_km',
            ])
            for w in workouts_data:
                if not w['exercises']:
                    writer.writerow([w['date'], w['name'], w['type'], w['notes'] or '', '', '', '', '', '', '', ''])
                    continue
                for ex in w['exercises']:
                    writer.writerow([
                        w['date'],
                        w['name'],
                        w['type'],
                        w['notes'] or '',
                        ex.get('customName') or ex.get('exerciseId') or '',
                        '1' if ex.get('isCustom') else '0',
                        ex.get('sets') if ex.get('sets') is not None else '',
                        ex.get('reps') if ex.get('reps') is not None else '',
                        ex.get('weight') if ex.get('weight') is not None else '',
                        ex.get('time') if ex.get('time') is not None else '',
                        ex.get('distance') if ex.get('distance') is not None else '',
                    ])
            response = HttpResponse(buf.getvalue(), content_type='text/csv; charset=utf-8')
        else:
            export_text = generate_export_text(workouts_data)
            if not export_text:
                export_text = "Нет тренировок для экспорта"
            response = HttpResponse(export_text, content_type='text/plain; charset=utf-8')

        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response