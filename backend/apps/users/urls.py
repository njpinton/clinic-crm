"""
URL configuration for users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserRegistrationViewSet

app_name = 'users'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # User management endpoints (authenticated)
    path('', include(router.urls)),

    # Public registration endpoint (no auth required)
    path('register/', UserRegistrationViewSet.as_view({'post': 'register'}), name='register'),
]
