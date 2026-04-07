from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Профиль'
    fieldsets = (
        ('Физические параметры', {
            'fields': ('height', 'weight', 'age'),
            'classes': ('wide',)
        }),
    )


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_height', 'get_weight', 'get_age')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_height(self, obj):
        return obj.profile.height if hasattr(obj, 'profile') else '-'

    get_height.short_description = 'Рост (см)'

    def get_weight(self, obj):
        return obj.profile.weight if hasattr(obj, 'profile') else '-'

    get_weight.short_description = 'Вес (кг)'

    def get_age(self, obj):
        return obj.profile.age if hasattr(obj, 'profile') else '-'

    get_age.short_description = 'Возраст'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'height', 'weight', 'age', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Пользователь', {
            'fields': ('user',),
            'classes': ('wide',)
        }),
        ('Физические параметры', {
            'fields': ('height', 'weight', 'age'),
            'classes': ('wide',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)