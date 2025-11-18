"""
Laboratory views for the Clinic CRM.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import LabTest, LabOrder, LabResult
from .serializers import LabTestSerializer, LabOrderSerializer, LabResultSerializer
from .permissions import CanAccessLaboratory
from apps.core.audit import log_phi_access


class LabTestViewSet(viewsets.ModelViewSet):
    """ViewSet for lab tests catalog."""
    queryset = LabTest.objects.filter(is_active=True)
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['test_category', 'is_active']
    search_fields = ['test_code', 'test_name']
    ordering = ['test_category', 'test_name']


class LabOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for lab orders with HIPAA audit logging."""
    serializer_class = LabOrderSerializer
    permission_classes = [IsAuthenticated, CanAccessLaboratory]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'patient', 'doctor']
    ordering = ['-order_date']

    def get_queryset(self):
        """Filter based on user role."""
        queryset = LabOrder.objects.select_related(
            'patient', 'patient__user',
            'doctor', 'doctor__user'
        ).prefetch_related('tests', 'results')

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

        return queryset

    def list(self, request, *args, **kwargs):
        """List with audit logging."""
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='LabOrder',
            resource_id=None,
                request=request,            details='Viewed lab orders list'
        )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def collect_specimen(self, request, pk=None):
        """Mark specimen as collected."""
        order = self.get_object()
        order.mark_as_collected(request.user)
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='LabOrder',
            resource_id=str(order.id),
                request=request,            details=f'Collected specimen for order {order.order_number}'
        )
        serializer = LabOrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_order(self, request, pk=None):
        """Mark order as completed."""
        order = self.get_object()
        order.mark_as_completed()
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='LabOrder',
            resource_id=str(order.id),
                request=request,            details=f'Completed order {order.order_number}'
        )
        serializer = LabOrderSerializer(order)
        return Response(serializer.data)


class LabResultViewSet(viewsets.ModelViewSet):
    """ViewSet for lab results with HIPAA audit logging."""
    serializer_class = LabResultSerializer
    permission_classes = [IsAuthenticated, CanAccessLaboratory]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['lab_order', 'result_status', 'abnormal_flag']
    ordering = ['-result_date']

    def get_queryset(self):
        """Filter based on user role."""
        queryset = LabResult.objects.select_related(
            'lab_order', 'lab_order__patient',
            'lab_test'
        )

        user = self.request.user

        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(lab_order__patient=patient)
            except Patient.DoesNotExist:
                return queryset.none()

        return queryset

    def list(self, request, *args, **kwargs):
        """List with audit logging."""
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='LabResult',
            resource_id=None,
                request=request,            details='Viewed lab results list'
        )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def verify_result(self, request, pk=None):
        """Verify lab result."""
        if request.user.role not in ['admin', 'doctor', 'lab_tech']:
            return Response({'detail': 'Permission denied'}, status=403)

        result = self.get_object()
        result.verify(request.user)
        log_phi_access(
            user=request.user,
            action='UPDATE',
            resource_type='LabResult',
            resource_id=str(result.id),
                request=request,            details=f'Verified result for {result.lab_test.test_name}'
        )
        serializer = LabResultSerializer(result)
        return Response(serializer.data)
