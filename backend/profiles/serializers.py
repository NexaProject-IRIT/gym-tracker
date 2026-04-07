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
        height = validated_data.pop('height', None)
        weight = validated_data.pop('weight', None)
        age = validated_data.pop('age', None)

        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', '')
        )
        user.set_password(validated_data['password'])
        user.save()

        if height or weight or age:
            profile = user.profile
            if height:
                profile.height = height
            if weight:
                profile.weight = weight
            if age:
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