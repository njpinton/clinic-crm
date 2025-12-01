"""
URL configuration for core app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import AuditLogViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
