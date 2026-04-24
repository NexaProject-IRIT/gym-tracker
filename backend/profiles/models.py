from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    GOAL_CHOICES = [
        ('lose_weight', 'Снижение веса'),
        ('gain_muscle', 'Набор мышечной массы'),
        ('recomposition', 'Рекомпозиция тела'),
        ('improve_endurance', 'Улучшение выносливости'),
        ('increase_strength', 'Увеличение силы'),
        ('maintain', 'Поддержание формы'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    height = models.FloatField(verbose_name='Рост (см)', null=True, blank=True)
    weight = models.FloatField(verbose_name='Вес (кг)', null=True, blank=True)
    age = models.IntegerField(verbose_name='Возраст', null=True, blank=True)
    goal = models.CharField(verbose_name='Цель тренировок', max_length=50, choices=GOAL_CHOICES, default='maintain')
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"Profile of {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()