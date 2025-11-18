"""
URL configuration for doctors app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet,
    SpecializationViewSet,
    DoctorCredentialViewSet,
    DoctorAvailabilityViewSet,
)

app_name = 'doctors'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'specializations', SpecializationViewSet, basename='specialization')
router.register(r'credentials', DoctorCredentialViewSet, basename='credential')
router.register(r'availability', DoctorAvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]
