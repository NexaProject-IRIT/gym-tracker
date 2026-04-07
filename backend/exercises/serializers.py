from rest_framework import serializers
from .models import Exercise, ExerciseParameter


class ExerciseParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseParameter
        fields = ['type', 'label', 'unit']


class ExerciseSerializer(serializers.ModelSerializer):
    parameters = ExerciseParameterSerializer(many=True, read_only=True)
    targetMuscles = serializers.SerializerMethodField()
    sourceFile = serializers.CharField(source='source_file', read_only=True)

    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'equipment', 'targetMuscles',
                  'tags', 'images', 'parameters', 'sourceFile']

    def get_targetMuscles(self, obj):
        return obj.target_muscles if obj.target_muscles else []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.uid)
        return data


class ExerciseListSerializer(serializers.ModelSerializer):
    targetMuscles = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = ['id', 'name', 'targetMuscles', 'tags', 'images']

    def get_targetMuscles(self, obj):
        return obj.target_muscles if obj.target_muscles else []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = instance.id
        if isinstance(data['images'], list) and data['images']:
            data['images'] = {'cover': data['images'][0] if data['images'] else ''}
        else:
            data['images'] = {'cover': ''}
        return data


class ExerciseCreateSerializer(serializers.ModelSerializer):
    targetMuscles = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    parameters = ExerciseParameterSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Exercise
        fields = ['name', 'description', 'equipment', 'targetMuscles', 'tags', 'images', 'parameters', 'source_file']

    def create(self, validated_data):
        parameters_data = validated_data.pop('parameters', [])
        target_muscles = validated_data.pop('targetMuscles', [])
        tags = validated_data.pop('tags', [])

        validated_data['target_muscles'] = target_muscles
        validated_data['tags'] = tags

        if 'images' not in validated_data:
            validated_data['images'] = []

        exercise = Exercise.objects.create(**validated_data)

        for param_data in parameters_data:
            ExerciseParameter.objects.create(exercise=exercise, **param_data)

        return exercise