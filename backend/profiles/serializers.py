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

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'height', 'weight', 'age')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        height = validated_data.pop('height', None)
        weight = validated_data.pop('weight', None)
        age = validated_data.pop('age', None)

        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', '')
        )
        user.set_password(validated_data['password'])
        user.save()

        profile = user.profile
        if height is not None:
            profile.height = height
        if weight is not None:
            profile.weight = weight
        if age is not None:
            profile.age = age
        profile.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    height = serializers.FloatField(source='profile.height', read_only=True)
    weight = serializers.FloatField(source='profile.weight', read_only=True)
    age = serializers.IntegerField(source='profile.age', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'height', 'weight', 'age')


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    height = serializers.FloatField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    age = serializers.IntegerField(required=False, allow_null=True)

    def update(self, user, validated_data):
        if 'username' in validated_data:
            user.username = validated_data['username']
            user.save()

        profile = user.profile
        if 'height' in validated_data:
            profile.height = validated_data['height']
        if 'weight' in validated_data:
            profile.weight = validated_data['weight']
        if 'age' in validated_data:
            profile.age = validated_data['age']
        profile.save()

        return user
