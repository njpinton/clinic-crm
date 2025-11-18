"""
URL configuration for prescriptions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicationViewSet, PrescriptionViewSet, PrescriptionRefillViewSet

app_name = 'prescriptions'

router = DefaultRouter()
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'refills', PrescriptionRefillViewSet, basename='refill')

urlpatterns = [
    path('', include(router.urls)),
]
