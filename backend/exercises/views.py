from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Exercise, Equipment
from .serializers import (
    ExerciseSerializer, ExerciseListSerializer, ExerciseCreateSerializer,
    EquipmentSerializer, EquipmentListSerializer
)
from rapidfuzz import fuzz, process


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
            if exercises_list:
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

                # Сворачиваем по упражнениям, оставляя максимальный скор
                best_by_idx: dict[int, float] = {}
                for _, score, pos in raw_results:
                    ex_idx = candidates[pos][1]
                    if score > best_by_idx.get(ex_idx, -1):
                        best_by_idx[ex_idx] = score

                ordered = sorted(best_by_idx.items(), key=lambda x: x[1], reverse=True)[:20]

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
                exercises_data = exercises_data[skip:skip + limit]
                return Response(exercises_data)
            else:
                return Response([])
        else:
            queryset = queryset.order_by('name')[skip:skip + limit]
            serializer = ExerciseListSerializer(queryset, many=True)
            return Response(serializer.data)

    def post(self, request):
        serializer = ExerciseCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ExerciseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_object(self, pk):
        try:
            return Exercise.objects.get(pk=pk)
        except Exercise.DoesNotExist:
            return None

    def get(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExerciseSerializer(exercise)
        return Response(serializer.data)

    def put(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExerciseSerializer(exercise, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        exercise.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
            if equipment_list:
                equipment_items = [(eq.name, eq) for eq in equipment_list]
                names_only = [name for name, _ in equipment_items]

                results = process.extract(
                    search.strip(),
                    names_only,
                    scorer=fuzz.WRatio,
                    limit=20,
                    score_cutoff=60
                )

                matched_ids = []
                for matched_name, score, index in results:
                    matched_ids.append(equipment_items[index][1].id)

                queryset = Equipment.objects.filter(id__in=matched_ids)
                order = {id: idx for idx, id in enumerate(matched_ids)}
                queryset = sorted(queryset, key=lambda x: order.get(x.id, float('inf')))
            else:
                queryset = []
        else:
            queryset = queryset.order_by('name')

        if isinstance(queryset, list):
            queryset = queryset[skip:skip + limit]
        else:
            queryset = queryset[skip:skip + limit]

        serializer = EquipmentListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EquipmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_object(self, pk):
        try:
            return Equipment.objects.get(pk=pk)
        except Equipment.DoesNotExist:
            return None

    def get(self, request, pk):
        equipment = self.get_object(pk)
        if not equipment:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)

    def put(self, request, pk):
        equipment = self.get_object(pk)
        if not equipment:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EquipmentSerializer(equipment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        equipment = self.get_object(pk)
        if not equipment:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)

        equipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)