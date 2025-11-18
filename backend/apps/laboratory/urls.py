"""
URL configuration for laboratory app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestViewSet, LabOrderViewSet, LabResultViewSet

app_name = 'laboratory'

router = DefaultRouter()
router.register(r'tests', LabTestViewSet, basename='test')
router.register(r'orders', LabOrderViewSet, basename='order')
router.register(r'results', LabResultViewSet, basename='result')

urlpatterns = [
    path('', include(router.urls)),
]
