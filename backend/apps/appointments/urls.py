"""
URL configuration for appointments app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, AppointmentReminderViewSet

app_name = 'appointments'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'reminders', AppointmentReminderViewSet, basename='reminder')

urlpatterns = [
    path('', include(router.urls)),
]
