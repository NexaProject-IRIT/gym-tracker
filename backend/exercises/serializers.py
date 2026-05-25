from rest_framework import serializers
from .models import Exercise, ExerciseParameter, Equipment


class ExerciseParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseParameter
        fields = ['type', 'label', 'unit']


class ExerciseSerializer(serializers.ModelSerializer):
    parameters = serializers.SerializerMethodField()
    targetMuscles = serializers.SerializerMethodField()
    sourceFile = serializers.CharField(source='source_file', read_only=True)
    exerciseId = serializers.CharField(source='exercise_id', read_only=True)
    difficulty = serializers.CharField(read_only=True)
    synonyms = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Exercise
        fields = [
            'id',
            'exerciseId',
            'name',
            'description',
            'equipment',
            'targetMuscles',
            'tags',
            'synonyms',
            'difficulty',
            'images',
            'parameters',
            'sourceFile',
        ]

    def get_targetMuscles(self, obj):
        return obj.target_muscles if obj.target_muscles else []

    def get_parameters(self, obj):
        return list(obj.parameters.values_list('type', flat=True))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.id)
        return data


class ExerciseListSerializer(serializers.ModelSerializer):
    targetMuscles = serializers.SerializerMethodField()
    exerciseId = serializers.CharField(source='exercise_id', read_only=True)
    difficulty = serializers.CharField(read_only=True)
    parameters = serializers.SerializerMethodField()
    synonyms = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Exercise
        fields = [
            'id',
            'exerciseId',
            'name',
            'description',
            'equipment',
            'targetMuscles',
            'tags',
            'synonyms',
            'difficulty',
            'images',
            'parameters',
        ]

    def get_targetMuscles(self, obj):
        return obj.target_muscles if obj.target_muscles else []

    def get_parameters(self, obj):
        return list(obj.parameters.values_list('type', flat=True))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.id)

        imgs = data.get('images', [])
        if isinstance(imgs, list) and imgs:
            data['images'] = {
                'cover': imgs[0],
                'technique': imgs[1:],
                'muscleMap': '',
            }
        elif isinstance(imgs, dict):
            pass
        else:
            data['images'] = {
                'cover': '',
                'technique': [],
                'muscleMap': '',
            }

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

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'description', 'tags', 'image']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.uid)
        return data


class EquipmentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'description', 'tags', 'image']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.uid)
        return data