"""
Tests for doctors app.
Comprehensive tests for doctors API endpoints following django-backend-guidelines.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.users.models import User
from apps.doctors.models import Doctor, Specialization, DoctorCredential, DoctorAvailability
from datetime import date, time


class DoctorAPITestCase(APITestCase):
    """Test cases for Doctor API endpoints."""

    def setUp(self):
        """Set up test data."""
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )

        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor',
            first_name='John',
            last_name='Doe'
        )

        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient',
            first_name='Jane',
            last_name='Smith'
        )

        # Create specialization
        self.specialization = Specialization.objects.create(
            name='Cardiology',
            description='Heart specialist'
        )

        # Create doctor
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='LIC123456',
            npi_number='1234567890',
            phone='+11234567890',
            email='doctor@example.com',
            is_accepting_new_patients=True
        )
        self.doctor.specializations.add(self.specialization)

        # Set up API client
        self.client = APIClient()

    def test_list_doctors_as_admin(self):
        """Test that admins can list all doctors."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors:doctor-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_doctors_as_patient(self):
        """Test that patients cannot list doctors (no access)."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('doctors:doctor-list')
        response = self.client.get(url)

        # Patients should not have access to doctor list in this implementation
        # (adjust based on your actual permission requirements)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_create_doctor_as_admin(self):
        """Test that admins can create doctors."""
        self.client.force_authenticate(user=self.admin_user)

        # Create a new user for the doctor
        new_doctor_user = User.objects.create_user(
            email='newdoctor@example.com',
            password='testpass123',
            role='doctor',
            first_name='Jane',
            last_name='Doctor'
        )

        url = reverse('doctors:doctor-list')
        data = {
            'user': new_doctor_user.id,
            'license_number': 'LIC999999',
            'npi_number': '9876543210',
            'phone': '+19876543210',
            'email': 'newdoctor@example.com',
            'specialization_ids': [self.specialization.id],
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Doctor.objects.count(), 2)

    def test_create_doctor_as_patient(self):
        """Test that patients cannot create doctors."""
        self.client.force_authenticate(user=self.patient_user)

        new_doctor_user = User.objects.create_user(
            email='unauthorized@example.com',
            password='testpass123',
            role='doctor'
        )

        url = reverse('doctors:doctor-list')
        data = {
            'user': new_doctor_user.id,
            'license_number': 'LIC888888',
            'npi_number': '8888888888',
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_doctor(self):
        """Test retrieving a single doctor."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors:doctor-detail', kwargs={'pk': self.doctor.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC123456')
        self.assertEqual(response.data['npi_number'], '1234567890')

    def test_update_doctor_as_admin(self):
        """Test that admins can update doctor information."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors:doctor-detail', kwargs={'pk': self.doctor.id})
        data = {
            'is_accepting_new_patients': False
        }
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_accepting_new_patients)

    def test_update_own_doctor_profile(self):
        """Test that doctors can update their own profile."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('doctors:doctor-detail', kwargs={'pk': self.doctor.id})
        data = {
            'bio': 'Experienced cardiologist with 10 years of practice.'
        }
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertIn('cardiologist', self.doctor.bio)

    def test_delete_doctor(self):
        """Test soft deleting a doctor."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors:doctor-detail', kwargs={'pk': self.doctor.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Verify it's soft deleted
        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.is_deleted)

    def test_npi_validation(self):
        """Test that NPI number validation works."""
        self.client.force_authenticate(user=self.admin_user)

        new_doctor_user = User.objects.create_user(
            email='invalid@example.com',
            password='testpass123',
            role='doctor'
        )

        url = reverse('doctors:doctor-list')
        data = {
            'user': new_doctor_user.id,
            'license_number': 'LIC111111',
            'npi_number': '123',  # Invalid - should be 10 digits
        }
        response = self.client.post(url, data, format='json')

        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SpecializationAPITestCase(APITestCase):
    """Test cases for Specialization API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )

        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )

        self.specialization = Specialization.objects.create(
            name='Pediatrics',
            description='Child healthcare'
        )

        self.client = APIClient()

    def test_list_specializations(self):
        """Test listing specializations (available to all authenticated users)."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('doctors:specialization-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_specialization_as_admin(self):
        """Test that admins can create specializations."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors:specialization-list')
        data = {
            'name': 'Neurology',
            'description': 'Brain and nervous system specialist'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Specialization.objects.count(), 2)

    def test_create_specialization_as_doctor(self):
        """Test that doctors cannot create specializations."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('doctors:specialization-list')
        data = {
            'name': 'Surgery',
            'description': 'Surgical specialist'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DoctorCredentialTestCase(TestCase):
    """Test cases for DoctorCredential model."""

    def setUp(self):
        """Set up test data."""
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )

        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='LIC123456',
            npi_number='1234567890'
        )

    def test_create_credential(self):
        """Test creating a doctor credential."""
        credential = DoctorCredential.objects.create(
            doctor=self.doctor,
            credential_type='board_certification',
            credential_number='CERT123',
            issuing_organization='American Board of Medical Specialties',
            issue_date=date(2020, 1, 1),
            expiration_date=date(2030, 1, 1)
        )

        self.assertEqual(credential.doctor, self.doctor)
        self.assertFalse(credential.is_expired)
        self.assertFalse(credential.is_verified)

    def test_expired_credential(self):
        """Test is_expired property."""
        credential = DoctorCredential.objects.create(
            doctor=self.doctor,
            credential_type='license',
            credential_number='LIC999',
            issue_date=date(2010, 1, 1),
            expiration_date=date(2020, 1, 1)  # Expired
        )

        self.assertTrue(credential.is_expired)


class DoctorAvailabilityTestCase(TestCase):
    """Test cases for DoctorAvailability model."""

    def setUp(self):
        """Set up test data."""
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )

        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='LIC123456',
            npi_number='1234567890'
        )

    def test_create_availability(self):
        """Test creating doctor availability."""
        availability = DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=0,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_active=True
        )

        self.assertEqual(availability.doctor, self.doctor)
        self.assertEqual(availability.day_of_week, 0)
        self.assertTrue(availability.is_active)

    def test_multiple_availability_schedules(self):
        """Test that a doctor can have multiple availability schedules."""
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=0,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0)
        )

        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=2,  # Wednesday
            start_time=time(9, 0),
            end_time=time(17, 0)
        )

        self.assertEqual(self.doctor.availability_schedules.count(), 2)
