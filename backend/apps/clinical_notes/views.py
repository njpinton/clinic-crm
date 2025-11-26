"""
Views for Clinical Notes API.
Handles CRUD operations for clinical notes with proper permissions and audit logging.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import ClinicalNote, SOAPNote, ProgressNote, ClinicalNoteTemplate
from .serializers import (
    ClinicalNoteDetailSerializer,
    ClinicalNoteListSerializer,
    ClinicalNoteCreateUpdateSerializer,
    SOAPNoteSerializer,
    ProgressNoteSerializer,
    ClinicalNoteTemplateSerializer,
)
from apps.core.audit import log_phi_access


class ClinicalNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Clinical Notes.
    Supports CRUD operations with comprehensive filtering and permissions.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient_id', 'doctor_id', 'note_type', 'is_signed']
    search_fields = ['chief_complaint', 'content', 'diagnosis', 'patient__full_name', 'doctor__first_name', 'doctor__last_name']
    ordering_fields = ['note_date', 'created_at']
    ordering = ['-note_date']

    def get_queryset(self):
        """Get clinical notes queryset with patient and doctor details."""
        return ClinicalNote.objects.select_related('patient', 'doctor', 'signed_by').prefetch_related('soap_details', 'progress_details')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ClinicalNoteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClinicalNoteCreateUpdateSerializer
        return ClinicalNoteDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a new clinical note with audit logging."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='CREATE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=request,
            details=f"Created {instance.get_note_type_display()} for patient {instance.patient.full_name}"
        )

        return Response(
            ClinicalNoteDetailSerializer(instance).data,
            status=status.HTTP_201_CREATED
        )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific clinical note with audit logging."""
        instance = self.get_object()

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='READ',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=request,
            details=f"Viewed {instance.get_note_type_display()} for patient {instance.patient.full_name}"
        )

        return Response(ClinicalNoteDetailSerializer(instance).data)

    def list(self, request, *args, **kwargs):
        """List clinical notes with audit logging."""
        response = super().list(request, *args, **kwargs)

        # Log PHI access (list operation)
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='ClinicalNote',
            request=request,
            details=f"Listed {len(response.data)} clinical notes"
        )

        return response

    def update(self, request, *args, **kwargs):
        """Update a clinical note with audit logging."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=request,
            details=f"Updated {instance.get_note_type_display()} for patient {instance.patient.full_name}"
        )

        return Response(ClinicalNoteDetailSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        """Soft delete a clinical note with audit logging."""
        instance = self.get_object()

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=request,
            details=f"Soft-deleted {instance.get_note_type_display()} for patient {instance.patient.full_name}",
            operation='delete'
        )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def sign(self, request, pk=None):
        """
        Sign a clinical note digitally.
        Only the note creator or admin can sign.
        """
        note = self.get_object()

        # Check permissions - only creator or admin can sign
        if note.doctor.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to sign this note.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if note.is_signed:
            return Response(
                {'detail': 'This note is already signed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Sign the note
        note.sign(request.user)

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='ClinicalNote',
            resource_id=note.id,
            request=request,
            details=f"Digitally signed {note.get_note_type_display()} for patient {note.patient.full_name}"
        )

        return Response(
            ClinicalNoteDetailSerializer(note).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def by_patient(self, request):
        """Get all clinical notes for a specific patient."""
        patient_id = request.query_params.get('patient_id')

        if not patient_id:
            return Response(
                {'detail': 'patient_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = self.get_queryset().filter(patient_id=patient_id)

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='ClinicalNote',
            request=request,
            details=f"Listed {notes.count()} clinical notes for patient {patient_id}"
        )

        page = self.paginate_queryset(notes)
        if page is not None:
            serializer = ClinicalNoteListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ClinicalNoteListSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def by_doctor(self, request):
        """Get all clinical notes written by a specific doctor."""
        doctor_id = request.query_params.get('doctor_id')

        if not doctor_id:
            return Response(
                {'detail': 'doctor_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = self.get_queryset().filter(doctor_id=doctor_id)

        # Log PHI access
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='ClinicalNote',
            request=request,
            details=f"Listed {notes.count()} clinical notes for doctor {doctor_id}"
        )

        page = self.paginate_queryset(notes)
        if page is not None:
            serializer = ClinicalNoteListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ClinicalNoteListSerializer(notes, many=True)
        return Response(serializer.data)


class ClinicalNoteTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Clinical Note Templates.
    Provides pre-built templates for quick note creation.
    """

    permission_classes = [IsAuthenticated]
    queryset = ClinicalNoteTemplate.objects.filter(is_active=True)
    serializer_class = ClinicalNoteTemplateSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['note_type', 'is_system_template']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Get templates available to the user."""
        # System templates are available to everyone
        # Personal templates are only visible to creator
        from django.db.models import Q
        return ClinicalNoteTemplate.objects.filter(
            Q(is_system_template=True) |
            Q(created_by=self.request.user),
            is_active=True
        )

    def create(self, request, *args, **kwargs):
        """Create a new template."""
        # Set created_by to current user
        request.data['created_by'] = request.user.id
        return super().create(request, *args, **kwargs)
