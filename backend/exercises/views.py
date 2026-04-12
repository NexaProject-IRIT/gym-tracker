from rest_framework import viewsets
from rest_framework.decorators import action
from .serializers import ExerciseCreateSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Exercise, Equipment
from .serializers import (
    ExerciseSerializer, ExerciseListSerializer,
    EquipmentSerializer, EquipmentListSerializer
)

class ExerciseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Exercise.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ExerciseListSerializer
        if self.action == 'create':
            return ExerciseCreateSerializer
        return ExerciseSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        muscle = request.query_params.get('muscle')
        tag = request.query_params.get('tag')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if muscle:
            queryset = queryset.filter(target_muscles__contains=[muscle])
        if tag:
            queryset = queryset.filter(tags__contains=[tag])

        queryset = queryset.order_by('name')[skip:skip + limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 1:
            return Response([])

        exercises = Exercise.objects.filter(name__icontains=q).order_by('name')[:20]
        data = []
        for ex in exercises:
            imgs = ex.images if isinstance(ex.images, list) else []
            data.append({
                'id': str(ex.id),
                'name': ex.name,
                'equipment': ex.equipment or '',
                'targetMuscles': ex.target_muscles or [],
                'tags': ex.tags or [],
            })
        return Response(data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exercise = serializer.save()
        result_serializer = ExerciseSerializer(exercise)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class EquipmentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Equipment.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return EquipmentListSerializer
        return EquipmentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        tag = request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        queryset = queryset.order_by('name')[skip:skip + limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        equipment = self.get_object()
        serializer = self.get_serializer(equipment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 1:
            return Response([])

        equipment_list = Equipment.objects.filter(name__icontains=q).order_by('name')[:20]
        serializer = self.get_serializer(equipment_list, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def exercises(self, request, pk=None):
        equipment = self.get_object()
        exercises = Exercise.objects.filter(equipment__icontains=equipment.name)
        serializer = ExerciseListSerializer(exercises, many=True)
        return Response(serializer.data)

class ExerciseListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Exercise.objects.all()

        muscle = request.query_params.get('muscle')
        tag = request.query_params.get('tag')
        search = request.query_params.get('q')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if muscle:
            queryset = queryset.filter(target_muscles__contains=[muscle])
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        if search:
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.order_by('name')[skip:skip + limit]

        serializer = ExerciseListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ExerciseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ExerciseDetailView(APIView):
    permission_classes = [permissions.AllowAny]
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
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Equipment.objects.all()

        tag = request.query_params.get('tag')
        search = request.query_params.get('q')
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        if search:
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.order_by('name')[skip:skip + limit]

        serializer = EquipmentListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EquipmentDetailView(APIView):
    permission_classes = [permissions.AllowAny]
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