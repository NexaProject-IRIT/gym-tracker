from rest_framework import serializers
from .models import Workout, WorkoutExercise


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exerciseId = serializers.CharField(source='exercise_id', required=False, allow_null=True, allow_blank=True)
    customName = serializers.CharField(source='custom_name', required=False, allow_null=True)
    isCustom = serializers.BooleanField(source='is_custom', required=False, default=False)

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'exerciseId', 'customName', 'sets', 'reps',
                  'weight', 'time', 'distance', 'isCustom']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = instance.id
        return data


class WorkoutSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ['id', 'name', 'type', 'date', 'exercises', 'color']


class WorkoutListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='uid')
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = ['id', 'name', 'type', 'date', 'color', 'exercise_count']

    def get_exercise_count(self, obj):
        return obj.exercises.count()


class WorkoutCreateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, write_only=True)

    class Meta:
        model = Workout
        fields = ['name', 'type', 'date', 'exercises', 'color']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout = Workout.objects.create(**validated_data)

        for ex_data in exercises_data:
            # Извлекаем exercise_id из данных
            exercise_id = ex_data.pop('exercise_id', None)
            custom_name = ex_data.pop('custom_name', None)
            is_custom = ex_data.pop('is_custom', False)
            WorkoutExercise.objects.create(
                workout=instance,
                exercise_id=exercise_id,
                custom_name=custom_name,
                is_custom=is_custom,
                **ex_data
            )

        return workout


class WorkoutUpdateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Workout
        fields = ['name', 'type', 'date', 'exercises', 'color']

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exercises_data is not None:
            instance.exercises.all().delete()
            for ex_data in exercises_data:
                if 'exercise_id' in ex_data:
                    ex_data['exercise_id'] = str(ex_data.pop('exercise_id'))
                WorkoutExercise.objects.create(workout=instance, **ex_data)

        return instance