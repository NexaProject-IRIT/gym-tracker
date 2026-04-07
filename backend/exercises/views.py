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
        q = request.query_params.get('q', '')
        if not q:
            return Response([])
        exercises = Exercise.objects.filter(name__icontains=q)[:50]
        serializer = ExerciseListSerializer(exercises, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exercise = serializer.save()
        result_serializer = ExerciseSerializer(exercise)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)
