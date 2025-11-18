"""
Prescription views for the Clinic CRM.
Following django-backend-guidelines: ViewSets with HIPAA audit logging.
"""
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import sentry_sdk

from .models import Medication, Prescription, PrescriptionRefill
from .serializers import (
    MedicationSerializer,
    PrescriptionSerializer,
    PrescriptionListSerializer,
    PrescriptionCreateSerializer,
    PrescriptionRefillSerializer,
)
from .permissions import (
    CanAccessPrescription,
    CanManageMedications,
    CanManageRefills,
)
from apps.core.utils import log_phi_access


class MedicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medications."""
    queryset = Medication.objects.filter(is_active=True)
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated, CanManageMedications]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['drug_class', 'is_formulary', 'is_active']
    search_fields = ['brand_name', 'generic_name', 'ndc_code']
    ordering_fields = ['generic_name', 'brand_name', 'created_at']
    ordering = ['generic_name']


class PrescriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing prescriptions with HIPAA audit logging."""
    permission_classes = [IsAuthenticated, CanAccessPrescription]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'patient', 'doctor', 'medication']
    search_fields = [
        'prescription_number',
        'patient__user__first_name',
        'patient__user__last_name',
        'medication__brand_name',
        'medication__generic_name',
    ]
    ordering_fields = ['prescribed_date', 'created_at']
    ordering = ['-prescribed_date']

    def get_queryset(self):
        """Filter based on user role."""
        queryset = Prescription.objects.select_related(
            'patient', 'patient__user',
            'doctor', 'doctor__user',
            'medication'
        ).prefetch_related('refill_requests')

        user = self.request.user

        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                queryset = queryset.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return queryset.none()
        elif user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return queryset.none()

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(status='active')

        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return PrescriptionListSerializer
        elif self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def list(self, request, *args, **kwargs):
        """List prescriptions with audit logging."""
        try:
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Prescription',
                resource_id=None,
                details='Viewed prescription list'
            )
            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving prescriptions.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve prescription with audit logging."""
        try:
            instance = self.get_object()
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='Prescription',
                resource_id=str(instance.id),
                details=f'Viewed prescription: {instance.prescription_number}'
            )
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving prescription.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create prescription with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='Prescription',
                    resource_id=str(response.data.get('id')),
                    details='Created new prescription'
                )
            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating prescription.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel prescription."""
        try:
            prescription = self.get_object()
            reason = request.data.get('reason', 'Cancelled by user')
            prescription.cancel(reason)
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Prescription',
                resource_id=str(prescription.id),
                details=f'Cancelled prescription: {prescription.prescription_number}'
            )
            serializer = PrescriptionSerializer(prescription)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error cancelling prescription.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrescriptionRefillViewSet(viewsets.ModelViewSet):
    """ViewSet for managing prescription refills."""
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [IsAuthenticated, CanManageRefills]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['prescription', 'status']
    ordering_fields = ['requested_date', 'approved_at']
    ordering = ['-requested_date']

    def get_queryset(self):
        """Filter based on user role."""
        queryset = PrescriptionRefill.objects.select_related(
            'prescription',
            'prescription__patient',
            'prescription__doctor',
            'approved_by'
        )

        user = self.request.user

        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                queryset = queryset.filter(prescription__doctor=doctor)
            except Doctor.DoesNotExist:
                return queryset.none()
        elif user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(prescription__patient=patient)
            except Patient.DoesNotExist:
                return queryset.none()

        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve refill request (doctors only)."""
        if request.user.role not in ['admin', 'doctor']:
            return Response(
                {'detail': 'Only doctors can approve refills.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from apps.doctors.models import Doctor
            refill = self.get_object()
            doctor = Doctor.objects.get(user=request.user)
            refill.approve(doctor)
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='PrescriptionRefill',
                resource_id=str(refill.id),
                details=f'Approved refill for prescription: {refill.prescription.prescription_number}'
            )
            serializer = PrescriptionRefillSerializer(refill)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error approving refill.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        """Deny refill request (doctors only)."""
        if request.user.role not in ['admin', 'doctor']:
            return Response(
                {'detail': 'Only doctors can deny refills.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from apps.doctors.models import Doctor
            refill = self.get_object()
            doctor = Doctor.objects.get(user=request.user)
            reason = request.data.get('reason', '')
            refill.deny(doctor, reason)
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='PrescriptionRefill',
                resource_id=str(refill.id),
                details=f'Denied refill for prescription: {refill.prescription.prescription_number}'
            )
            serializer = PrescriptionRefillSerializer(refill)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error denying refill.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
