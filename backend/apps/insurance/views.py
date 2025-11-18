"""
Insurance views for the Clinic CRM.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import InsuranceProvider, InsurancePlan, PatientInsurance, InsuranceClaim
from .serializers import (
    InsuranceProviderSerializer,
    InsurancePlanSerializer,
    PatientInsuranceSerializer,
    InsuranceClaimSerializer,
)
from .permissions import CanAccessInsurance
from apps.core.utils import log_phi_access


class InsuranceProviderViewSet(viewsets.ModelViewSet):
    """ViewSet for insurance providers."""
    queryset = InsuranceProvider.objects.filter(is_active=True)
    serializer_class = InsuranceProviderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'payer_id']
    ordering = ['company_name']


class InsurancePlanViewSet(viewsets.ModelViewSet):
    """ViewSet for insurance plans."""
    queryset = InsurancePlan.objects.select_related('provider').filter(is_active=True)
    serializer_class = InsurancePlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['provider', 'plan_type', 'is_active']
    search_fields = ['plan_name', 'plan_number']
    ordering = ['plan_name']


class PatientInsuranceViewSet(viewsets.ModelViewSet):
    """ViewSet for patient insurance with HIPAA audit logging."""
    serializer_class = PatientInsuranceSerializer
    permission_classes = [IsAuthenticated, CanAccessInsurance]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient', 'insurance_plan', 'priority', 'is_active']
    ordering = ['patient', 'priority']

    def get_queryset(self):
        """Filter based on user role."""
        queryset = PatientInsurance.objects.select_related(
            'patient', 'patient__user',
            'insurance_plan', 'insurance_plan__provider'
        )

        user = self.request.user

        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return queryset.none()

        return queryset

    def list(self, request, *args, **kwargs):
        """List with audit logging."""
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='PatientInsurance',
            resource_id=None,
            details='Viewed patient insurance list'
        )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify insurance coverage."""
        if request.user.role not in ['admin', 'receptionist']:
            return Response({'detail': 'Permission denied'}, status=403)

        insurance = self.get_object()
        status_message = request.data.get('status', 'Verified')
        insurance.verify(status_message)
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='PatientInsurance',
            resource_id=str(insurance.id),
            details=f'Verified insurance for {insurance.patient.full_name}'
        )
        serializer = PatientInsuranceSerializer(insurance)
        return Response(serializer.data)


class InsuranceClaimViewSet(viewsets.ModelViewSet):
    """ViewSet for insurance claims with HIPAA audit logging."""
    serializer_class = InsuranceClaimSerializer
    permission_classes = [IsAuthenticated, CanAccessInsurance]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient_insurance', 'status']
    ordering = ['-service_date']

    def get_queryset(self):
        """Optimize queries."""
        return InsuranceClaim.objects.select_related(
            'patient_insurance',
            'patient_insurance__patient',
            'patient_insurance__insurance_plan',
            'appointment'
        )

    def list(self, request, *args, **kwargs):
        """List with audit logging."""
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='InsuranceClaim',
            resource_id=None,
            details='Viewed insurance claims list'
        )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit claim to insurance."""
        claim = self.get_object()
        claim.submit()
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='InsuranceClaim',
            resource_id=str(claim.id),
            details=f'Submitted claim {claim.claim_number}'
        )
        serializer = InsuranceClaimSerializer(claim)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark claim as paid."""
        claim = self.get_object()
        paid_amount = request.data.get('paid_amount')
        payment_reference = request.data.get('payment_reference', '')
        claim.mark_as_paid(paid_amount, payment_reference)
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='InsuranceClaim',
            resource_id=str(claim.id),
            details=f'Marked claim {claim.claim_number} as paid'
        )
        serializer = InsuranceClaimSerializer(claim)
        return Response(serializer.data)
