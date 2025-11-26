"""
Patient ViewSet for API endpoints.
Implements CRUD operations with HIPAA-compliant audit logging.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import sentry_sdk

from .models import Patient
from .serializers import PatientSerializer, PatientListSerializer, PatientCreateSerializer
from .permissions import CanAccessPatient, CanModifyPatient
from apps.core.audit import log_phi_access


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patients.

    Provides:
    - list: GET /api/patients/ - List all patients
    - retrieve: GET /api/patients/{id}/ - Get patient details
    - create: POST /api/patients/ - Create new patient
    - update: PUT /api/patients/{id}/ - Update patient (full)
    - partial_update: PATCH /api/patients/{id}/ - Update patient (partial)
    - destroy: DELETE /api/patients/{id}/ - Soft delete patient

    All operations are logged for HIPAA compliance.
    """
    queryset = Patient.objects.all()
    permission_classes = [IsAuthenticated, CanAccessPatient, CanModifyPatient]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'city', 'province']
    search_fields = ['first_name', 'last_name', 'medical_record_number', 'email']
    ordering_fields = ['last_name', 'first_name', 'date_of_birth', 'created_at']
    ordering = ['last_name', 'first_name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return PatientListSerializer
        elif self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer

    def list(self, request, *args, **kwargs):
        """
        List all patients.
        Audit logging: Log that user accessed patient list.
        """
        try:
            response = super().list(request, *args, **kwargs)

            # Log access to patient list
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='PatientList',
                resource_id='00000000-0000-0000-0000-000000000000',  # Special ID for list operations
                request=request,
                count=len(response.data.get('results', []))
            )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve patients'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific patient.
        Audit logging: Log PHI access for this patient.
        """
        try:
            instance = self.get_object()

            # HIPAA: Log patient record access
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='Patient',
                resource_id=instance.id,
                request=request,
                medical_record_number=instance.medical_record_number
            )

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve patient'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """
        Create a new patient.
        Audit logging: Log patient creation.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            patient = serializer.save()

            # HIPAA: Log patient creation
            log_phi_access(
                user=request.user,
                action='CREATE',
                resource_type='Patient',
                resource_id=patient.id,
                request=request,
                medical_record_number=patient.medical_record_number
            )

            return Response(
                PatientSerializer(patient).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to create patient', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """
        Update a patient (full update).
        Audit logging: Log patient update.
        """
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            patient = serializer.save()

            # HIPAA: Log patient update
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Patient',
                resource_id=patient.id,
                request=request,
                medical_record_number=patient.medical_record_number,
                fields_updated=list(request.data.keys())
            )

            return Response(PatientSerializer(patient).data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to update patient'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def partial_update(self, request, *args, **kwargs):
        """Partial update of a patient."""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a patient.
        HIPAA: Never truly delete patient records.
        """
        try:
            instance = self.get_object()

            # Soft delete instead of hard delete
            instance.soft_delete()

            # HIPAA: Log patient deletion
            log_phi_access(
                user=request.user,
                action='DELETE',
                resource_type='Patient',
                resource_id=instance.id,
                request=request,
                medical_record_number=instance.medical_record_number
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to delete patient'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore a soft-deleted patient.
        Only admins can restore patients.
        """
        try:
            if request.user.role != 'admin':
                return Response(
                    {'error': 'Only administrators can restore patients'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get patient including soft-deleted
            patient = Patient.all_objects.get(pk=pk)

            if not patient.is_deleted:
                return Response(
                    {'error': 'Patient is not deleted'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            patient.restore()

            # Log restoration
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Patient',
                resource_id=patient.id,
                request=request,
                operation='restore'
            )

            return Response(
                PatientSerializer(patient).data,
                status=status.HTTP_200_OK
            )
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to restore patient'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
