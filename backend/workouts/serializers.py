from rest_framework import serializers
from .models import Workout, WorkoutExercise


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exerciseId = serializers.CharField(source='exercise_id', required=False, allow_null=True, allow_blank=True)
    customName = serializers.CharField(source='custom_name', required=False, allow_null=True, allow_blank=True)
    isCustom = serializers.BooleanField(source='is_custom', required=False, default=False)
    isDone = serializers.BooleanField(source='is_done', required=False, default=False)
    parameters = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    # uid отправляется фронтендом для сопоставления с существующими упражнениями при обновлении
    uid = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'uid', 'exerciseId', 'customName', 'sets', 'reps',
                  'weight', 'time', 'distance', 'isCustom', 'isDone', 'parameters', 'order']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.uid)
        if data.get('parameters') is None:
            data['parameters'] = []
        return data


class WorkoutSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ['id', 'name', 'type', 'date', 'exercises', 'color', 'notes']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.uid)
        return data


class WorkoutListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='uid')
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = ['id', 'name', 'type', 'date', 'color', 'exercise_count', 'notes']

    def get_exercise_count(self, obj):
        return obj.exercises.count()


class WorkoutCreateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)

    class Meta:
        model = Workout
        fields = ['name', 'type', 'date', 'exercises', 'color', 'notes']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout = Workout.objects.create(**validated_data)

        for idx, ex_data in enumerate(exercises_data):
            ex_data.pop('uid', None)
            ex_data.pop('order', None)
            exercise_id = ex_data.pop('exercise_id', None)
            custom_name = ex_data.pop('custom_name', None)
            is_custom = ex_data.pop('is_custom', False)
            is_done = ex_data.pop('is_done', False)
            parameters = ex_data.pop('parameters', [])
            WorkoutExercise.objects.create(
                workout=workout,
                exercise_id=exercise_id or '',
                custom_name=custom_name or '',
                is_custom=is_custom,
                is_done=is_done,
                parameters=parameters,
                order=idx,
                **ex_data
            )

        return workout


class WorkoutUpdateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)

    class Meta:
        model = Workout
        fields = ['name', 'type', 'date', 'exercises', 'color', 'notes']

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exercises_data is not None:
            existing = {str(ex.uid): ex for ex in instance.exercises.all()}
            seen_uids = set()

            for idx, ex_data in enumerate(exercises_data):
                incoming_uid = ex_data.pop('uid', '') or ''
                ex_data.pop('order', None)
                exercise_id = ex_data.pop('exercise_id', None)
                custom_name = ex_data.pop('custom_name', None)
                is_custom = ex_data.pop('is_custom', False)
                is_done = ex_data.pop('is_done', False)
                parameters = ex_data.pop('parameters', [])

                if incoming_uid in existing:
                    # Обновляем существующее упражнение, is_done не трогаем
                    ex = existing[incoming_uid]
                    ex.exercise_id = exercise_id or ''
                    ex.custom_name = custom_name or ''
                    ex.is_custom = is_custom
                    ex.parameters = parameters
                    ex.order = idx
                    for attr, val in ex_data.items():
                        setattr(ex, attr, val)
                    ex.save()
                    seen_uids.add(incoming_uid)
                else:
                    new_ex = WorkoutExercise.objects.create(
                        workout=instance,
                        exercise_id=exercise_id or '',
                        custom_name=custom_name or '',
                        is_custom=is_custom,
                        is_done=is_done,
                        parameters=parameters,
                        order=idx,
                        **ex_data
                    )
                    seen_uids.add(str(new_ex.uid))

            for uid_str, ex in existing.items():
                if uid_str not in seen_uids:
                    ex.delete()

        return instance
