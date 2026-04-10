from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    height = serializers.FloatField(write_only=True, required=False, allow_null=True)
    weight = serializers.FloatField(write_only=True, required=False, allow_null=True)
    age = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    goal = serializers.ChoiceField(choices=UserProfile.GOAL_CHOICES, required=False, default='maintain')

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'name', 'height', 'weight', 'age', 'goal')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        validated_data.pop('password2')
        height = validated_data.pop('height', None)
        weight = validated_data.pop('weight', None)
        age = validated_data.pop('age', None)
        goal = validated_data.pop('goal', 'maintain')

        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', '')
        )

        if name:
            user.first_name = name
        user.save()
        user.set_password(validated_data['password'])
        user.save()

        profile = user.profile
        if height is not None:
            profile.height = height
        if weight is not None:
            profile.weight = weight
        if age is not None:
            profile.age = age
        profile.goal = goal
        profile.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    height = serializers.FloatField(source='profile.height', read_only=True)
    weight = serializers.FloatField(source='profile.weight', read_only=True)
    age = serializers.IntegerField(source='profile.age', read_only=True)
    goal = serializers.CharField(source='profile.goal', read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'name', 'height', 'weight', 'age', 'goal')

    def get_name(self, obj):
        return obj.first_name if obj.first_name else obj.username


class ProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    height = serializers.FloatField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    goal = serializers.ChoiceField(choices=UserProfile.GOAL_CHOICES, required=False)

    class Meta:
        model = UserProfile
        fields = ('name', 'height', 'weight', 'age', 'goal')

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        if name is not None:
            user = instance.user
            user.first_name = name
            user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance