"""
URL configuration for insurance app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InsuranceProviderViewSet,
    InsurancePlanViewSet,
    PatientInsuranceViewSet,
    InsuranceClaimViewSet,
)

app_name = 'insurance'

router = DefaultRouter()
router.register(r'providers', InsuranceProviderViewSet, basename='provider')
router.register(r'plans', InsurancePlanViewSet, basename='plan')
router.register(r'patient-insurance', PatientInsuranceViewSet, basename='patient-insurance')
router.register(r'claims', InsuranceClaimViewSet, basename='claim')

urlpatterns = [
    path('', include(router.urls)),
]
