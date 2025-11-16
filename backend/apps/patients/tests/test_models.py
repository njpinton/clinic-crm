"""
Tests for Patient model.
"""
import pytest
from datetime import date, timedelta
from apps.patients.models import Patient


@pytest.mark.django_db
class TestPatientModel:
    """Test cases for Patient model."""

    def test_create_patient(self):
        """Test creating a patient with required fields."""
        patient = Patient.objects.create(
            medical_record_number='MRN001',
            first_name='John',
            last_name='Doe',
            date_of_birth=date(1990, 1, 1),
        )

        assert patient.id is not None
        assert patient.medical_record_number == 'MRN001'
        assert patient.first_name == 'John'
        assert patient.last_name == 'Doe'
        assert str(patient) == 'John Doe (MRN: MRN001)'

    def test_patient_full_name(self):
        """Test full_name property."""
        patient = Patient.objects.create(
            medical_record_number='MRN002',
            first_name='Jane',
            middle_name='Marie',
            last_name='Smith',
            date_of_birth=date(1985, 5, 15),
        )

        assert patient.full_name == 'Jane Marie Smith'

    def test_patient_full_name_without_middle(self):
        """Test full_name property without middle name."""
        patient = Patient.objects.create(
            medical_record_number='MRN003',
            first_name='Bob',
            last_name='Johnson',
            date_of_birth=date(1975, 3, 20),
        )

        assert patient.full_name == 'Bob Johnson'

    def test_patient_age_calculation(self):
        """Test age property calculation."""
        # Patient born 30 years ago
        birth_date = date.today() - timedelta(days=365 * 30)
        patient = Patient.objects.create(
            medical_record_number='MRN004',
            first_name='Alice',
            last_name='Brown',
            date_of_birth=birth_date,
        )

        assert patient.age == 30

    def test_soft_delete(self):
        """Test soft delete functionality."""
        patient = Patient.objects.create(
            medical_record_number='MRN005',
            first_name='Charlie',
            last_name='Davis',
            date_of_birth=date(1995, 7, 10),
        )

        # Verify patient exists
        assert Patient.objects.filter(id=patient.id).exists()

        # Soft delete
        patient.soft_delete()

        # Patient should not appear in default queryset
        assert not Patient.objects.filter(id=patient.id).exists()

        # But should exist in all_objects
        assert Patient.all_objects.filter(id=patient.id).exists()

        # Verify is_deleted flag
        patient.refresh_from_db()
        assert patient.is_deleted is True
        assert patient.deleted_at is not None

    def test_restore_patient(self):
        """Test restoring a soft-deleted patient."""
        patient = Patient.objects.create(
            medical_record_number='MRN006',
            first_name='Eve',
            last_name='Wilson',
            date_of_birth=date(1988, 12, 25),
        )

        # Soft delete
        patient.soft_delete()
        assert not Patient.objects.filter(id=patient.id).exists()

        # Restore
        patient.restore()
        patient.refresh_from_db()

        # Should appear in default queryset again
        assert Patient.objects.filter(id=patient.id).exists()
        assert patient.is_deleted is False
        assert patient.deleted_at is None
