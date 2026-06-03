from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Exercise, Equipment
from .serializers import (
    ExerciseSerializer, ExerciseListSerializer,
    EquipmentSerializer, EquipmentListSerializer,
)
from rapidfuzz import fuzz, process


# База упражнений и тренажёров — read-only с фронта.
# Синхронизация идёт через `python manage.py sync_knowledge_base` из .md-файлов
# в backend/knowledge_base/. Любые write-операции отсюда — мусорный путь,
# который раньше позволял любому залогиненному юзеру портить общую базу.


class ExerciseListView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = Exercise.objects.all()

        muscle = request.query_params.get('muscle')
        tag = request.query_params.get('tag')
        search = request.query_params.get('q')
        exercise_id = request.query_params.get('exercise_id')
        equipment = request.query_params.get('equipment')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if exercise_id:
            queryset = queryset.filter(exercise_id=exercise_id)
        if equipment:
            queryset = queryset.filter(equipment__icontains=equipment)
        if muscle:
            queryset = queryset.filter(target_muscles__contains=[muscle.lower()])
        if tag:
            queryset = queryset.filter(tags__contains=[tag.lower()])
        if search and search.strip():
            exercises_list = list(queryset)
            if not exercises_list:
                return Response([])

            # Каждое упражнение участвует в поиске как несколько строк: основное имя + синонимы.
            # Берём лучший скор для упражнения, чтобы оно не выпало из топа из-за слабого синонима.
            candidates = []  # (search_string, exercise_index)
            for idx, ex in enumerate(exercises_list):
                candidates.append((ex.name, idx))
                for syn in (ex.synonyms or []):
                    syn_str = str(syn).strip()
                    if syn_str:
                        candidates.append((syn_str, idx))

            strings_only = [s for s, _ in candidates]

            raw_results = process.extract(
                search.strip(),
                strings_only,
                scorer=fuzz.WRatio,
                limit=len(strings_only),
                score_cutoff=60,
            )

            best_by_idx: dict[int, float] = {}
            for _, score, pos in raw_results:
                ex_idx = candidates[pos][1]
                if score > best_by_idx.get(ex_idx, -1):
                    best_by_idx[ex_idx] = score

            # Сначала пагинация, потом сериализация: без этого skip>=20 возвращал []
            # из-за жёсткого ограничения сверху.
            ordered = sorted(best_by_idx.items(), key=lambda x: x[1], reverse=True)
            ordered = ordered[skip:skip + limit]

            exercises_data = []
            for ex_idx, score in ordered:
                ex = exercises_list[ex_idx]
                parameters = list(ex.parameters.values_list('type', flat=True))
                target_muscles = ex.target_muscles if ex.target_muscles else []

                exercises_data.append({
                    'id': str(ex.id),
                    'exerciseId': ex.exercise_id,
                    'name': ex.name,
                    'equipment': ex.equipment or '',
                    'targetMuscles': target_muscles,
                    'tags': ex.tags or [],
                    'synonyms': ex.synonyms or [],
                    'parameters': parameters,
                    'difficulty': ex.difficulty,
                    'description': ex.description or '',
                    'images': ex.images if isinstance(ex.images, dict) else {},
                    'score': round(score, 2)
                })
            return Response(exercises_data)

        queryset = queryset.order_by('name')[skip:skip + limit]
        serializer = ExerciseListSerializer(queryset, many=True)
        return Response(serializer.data)


class ExerciseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        try:
            exercise = Exercise.objects.get(pk=pk)
        except Exercise.DoesNotExist:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExerciseSerializer(exercise)
        return Response(serializer.data)


class EquipmentListView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = Equipment.objects.all()

        tag = request.query_params.get('tag')
        search = request.query_params.get('q')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        if search and search.strip():
            equipment_list = list(queryset)
            if not equipment_list:
                return Response([])

            names = [eq.name for eq in equipment_list]
            results = process.extract(
                search.strip(),
                names,
                scorer=fuzz.WRatio,
                limit=len(names),
                score_cutoff=60,
            )
            ordered_items = [equipment_list[index] for _, _, index in results]
            ordered_items = ordered_items[skip:skip + limit]
            serializer = EquipmentListSerializer(ordered_items, many=True)
            return Response(serializer.data)

        queryset = queryset.order_by('name')[skip:skip + limit]
        serializer = EquipmentListSerializer(queryset, many=True)
        return Response(serializer.data)


class EquipmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        try:
            equipment = Equipment.objects.get(pk=pk)
        except Equipment.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)
