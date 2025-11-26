"""
URL configuration for Clinical Notes API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClinicalNoteViewSet, ClinicalNoteTemplateViewSet

router = DefaultRouter()
router.register(r'clinical-notes', ClinicalNoteViewSet, basename='clinical-note')
router.register(r'clinical-note-templates', ClinicalNoteTemplateViewSet, basename='clinical-note-template')

urlpatterns = [
    path('', include(router.urls)),
]
