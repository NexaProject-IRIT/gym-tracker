from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Exercise
from .serializers import ExerciseSerializer, ExerciseListSerializer, ExerciseCreateSerializer


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
        """Search exercises by name — used for autocomplete in workout form."""
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
