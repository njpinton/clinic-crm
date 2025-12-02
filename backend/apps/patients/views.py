"""
Patient ViewSet for API endpoints.
Implements CRUD operations with HIPAA-compliant audit logging.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
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

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced patient search for secretary registration workflow.

        Search by:
        - name (first_name or last_name)
        - medical_record_number (MRN)
        - phone
        - date_of_birth
        - email

        Query params:
        - q: General search query (searches name, MRN, email)
        - phone: Exact phone number match
        - dob: Date of birth (YYYY-MM-DD)
        - mrn: Medical record number

        Example: /api/patients/search/?q=John&dob=1990-01-15
        """
        from django.db.models import Q
        from datetime import datetime

        try:
            queryset = self.get_queryset()

            # General search query
            q = request.query_params.get('q', '').strip()
            if q:
                queryset = queryset.filter(
                    Q(first_name__icontains=q) |
                    Q(last_name__icontains=q) |
                    Q(middle_name__icontains=q) |
                    Q(medical_record_number__icontains=q) |
                    Q(email__icontains=q)
                )

            # Phone number search (exact or contains)
            phone = request.query_params.get('phone', '').strip()
            if phone:
                # Remove common formatting characters
                phone_clean = phone.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
                queryset = queryset.filter(phone__icontains=phone_clean)

            # Date of birth search (exact match)
            dob = request.query_params.get('dob', '').strip()
            if dob:
                try:
                    dob_date = datetime.strptime(dob, '%Y-%m-%d').date()
                    queryset = queryset.filter(date_of_birth=dob_date)
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Medical record number (exact match)
            mrn = request.query_params.get('mrn', '').strip()
            if mrn:
                queryset = queryset.filter(medical_record_number__iexact=mrn)

            # Limit results to 20 for performance
            queryset = queryset[:20]

            # Log search
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Patient',
                resource_id=None,
                request=request,
                details=f'Patient search: q={q}, phone={phone}, dob={dob}, mrn={mrn}'
            )

            serializer = PatientListSerializer(queryset, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })

        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to search patients'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        """
        Check if a patient might be a duplicate based on provided information.

        Used during patient registration to prevent accidental duplicate entries.
        Returns potential duplicates based on:
        - Full name + date of birth
        - Phone number
        - Email address
        - Medical record number

        Request body:
        {
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-15",
            "phone": "09123456789",
            "email": "john@example.com"
        }
        """
        from datetime import datetime

        try:
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            date_of_birth = request.data.get('date_of_birth', '').strip()
            phone = request.data.get('phone', '').strip()
            email = request.data.get('email', '').strip()

            if not (first_name and last_name and date_of_birth):
                return Response(
                    {'error': 'first_name, last_name, and date_of_birth are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Start with queryset
            queryset = self.get_queryset()
            potential_duplicates = []

            # Check 1: Exact match on name + DOB (strongest match)
            try:
                dob_date = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
                exact_matches = queryset.filter(
                    first_name__iexact=first_name,
                    last_name__iexact=last_name,
                    date_of_birth=dob_date
                )

                if exact_matches.exists():
                    potential_duplicates.extend([
                        {
                            'id': str(p.id),
                            'full_name': p.full_name,
                            'date_of_birth': p.date_of_birth.isoformat(),
                            'medical_record_number': p.medical_record_number,
                            'phone': p.phone,
                            'email': p.email,
                            'match_type': 'exact_name_dob',
                            'confidence': 95
                        }
                        for p in exact_matches[:5]
                    ])
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check 2: Phone number match (if provided)
            if phone:
                phone_clean = phone.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
                phone_matches = queryset.filter(phone__icontains=phone_clean).exclude(
                    id__in=[d['id'] for d in potential_duplicates]
                )

                if phone_matches.exists():
                    potential_duplicates.extend([
                        {
                            'id': str(p.id),
                            'full_name': p.full_name,
                            'date_of_birth': p.date_of_birth.isoformat(),
                            'medical_record_number': p.medical_record_number,
                            'phone': p.phone,
                            'email': p.email,
                            'match_type': 'phone_match',
                            'confidence': 80
                        }
                        for p in phone_matches[:5]
                    ])

            # Check 3: Email match (if provided)
            if email:
                email_matches = queryset.filter(email__iexact=email).exclude(
                    id__in=[d['id'] for d in potential_duplicates]
                )

                if email_matches.exists():
                    potential_duplicates.extend([
                        {
                            'id': str(p.id),
                            'full_name': p.full_name,
                            'date_of_birth': p.date_of_birth.isoformat(),
                            'medical_record_number': p.medical_record_number,
                            'phone': p.phone,
                            'email': p.email,
                            'match_type': 'email_match',
                            'confidence': 85
                        }
                        for p in email_matches[:5]
                    ])

            # Log the duplicate check
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='Patient',
                resource_id=None,
                request=request,
                details=f'Duplicate check: {first_name} {last_name} ({date_of_birth}), found {len(potential_duplicates)} matches'
            )

            return Response({
                'duplicates_found': len(potential_duplicates) > 0,
                'potential_duplicates': potential_duplicates,
                'count': len(potential_duplicates)
            })

        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to check for duplicates'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
