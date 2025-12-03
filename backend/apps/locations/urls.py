"""
URL routing for PSGC Location API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PSGCRegionViewSet,
    PSGCProvinceViewSet,
    PSGCMunicipalityViewSet,
    PSGCBarangayViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'regions', PSGCRegionViewSet, basename='psgc-region')
router.register(r'provinces', PSGCProvinceViewSet, basename='psgc-province')
router.register(r'municipalities', PSGCMunicipalityViewSet, basename='psgc-municipality')
router.register(r'barangays', PSGCBarangayViewSet, basename='psgc-barangay')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
