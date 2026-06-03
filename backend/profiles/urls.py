from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, UserProfileView,
    CheckUsernameView, CheckPasswordView, ChangePasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('check-password/', CheckPasswordView.as_view(), name='check-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]