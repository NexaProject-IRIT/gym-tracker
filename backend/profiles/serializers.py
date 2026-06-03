from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    height = serializers.FloatField(write_only=True, required=False, allow_null=True)
    weight = serializers.FloatField(write_only=True, required=False, allow_null=True)
    age = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    goal = serializers.ChoiceField(choices=UserProfile.GOAL_CHOICES, required=False, default='maintain')
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, required=False, default='unspecified')

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'height', 'weight', 'age', 'goal', 'gender')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Этот логин уже занят")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        height = validated_data.pop('height', None)
        weight = validated_data.pop('weight', None)
        age = validated_data.pop('age', None)
        goal = validated_data.pop('goal', 'maintain')
        gender = validated_data.pop('gender', 'unspecified')

        user = User.objects.create(username=validated_data['username'])
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
        profile.gender = gender
        profile.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    height = serializers.FloatField(source='profile.height', read_only=True)
    weight = serializers.FloatField(source='profile.weight', read_only=True)
    age = serializers.IntegerField(source='profile.age', read_only=True)
    goal = serializers.CharField(source='profile.goal', read_only=True)
    gender = serializers.CharField(source='profile.gender', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'height', 'weight', 'age', 'goal', 'gender')

    def get_display_name(self, obj):
        return obj.first_name if obj.first_name else obj.username


class ProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, min_length=3)
    display_name = serializers.CharField(required=False, allow_blank=True)
    height = serializers.FloatField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    goal = serializers.ChoiceField(choices=UserProfile.GOAL_CHOICES, required=False)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, required=False)

    class Meta:
        model = UserProfile
        fields = ('username', 'display_name', 'height', 'weight', 'age', 'goal', 'gender')

    def validate_username(self, value):
        current_user = self.instance.user
        if User.objects.filter(username__iexact=value).exclude(pk=current_user.pk).exists():
            raise serializers.ValidationError("Этот логин уже занят")
        return value

    def update(self, instance, validated_data):
        username = validated_data.pop('username', None)
        display_name = validated_data.pop('display_name', None)

        if username is not None or display_name is not None:
            user = instance.user
            if username is not None:
                user.username = username
            if display_name is not None:
                user.first_name = display_name
            user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
