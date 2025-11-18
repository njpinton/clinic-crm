"""
Tests for appointments app.
Comprehensive tests for appointments API endpoints following django-backend-guidelines.
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.users.models import User
from apps.patients.models import Patient
from apps.doctors.models import Doctor, Specialization
from apps.appointments.models import Appointment, AppointmentReminder


class AppointmentAPITestCase(APITestCase):
    """Test cases for Appointment API endpoints."""

    def setUp(self):
        """Set up test data."""
        # Create users
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            role='admin'
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

        self.receptionist_user = User.objects.create_user(
            email='receptionist@example.com',
            password='testpass123',
            role='receptionist'
        )

        # Create patient
        self.patient = Patient.objects.create(
            user=self.patient_user,
            medical_record_number='MRN123456',
            date_of_birth='1990-01-01',
            gender='female',
            phone='+11234567890',
            email='patient@example.com'
        )

        # Create doctor
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='LIC123456',
            npi_number='1234567890',
            is_accepting_new_patients=True
        )

        # Create appointment
        self.appointment_time = timezone.now() + timedelta(days=7)
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_datetime=self.appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Annual checkup',
            status='scheduled'
        )

        self.client = APIClient()

    def test_list_appointments_as_admin(self):
        """Test that admins can list all appointments."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_appointments_as_patient(self):
        """Test that patients can only see their own appointments."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['patient'], str(self.patient.id))

    def test_list_appointments_as_doctor(self):
        """Test that doctors can only see their own appointments."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['doctor'], str(self.doctor.id))

    def test_create_appointment(self):
        """Test creating an appointment."""
        self.client.force_authenticate(user=self.receptionist_user)
        url = reverse('appointments:appointment-list')

        future_time = timezone.now() + timedelta(days=14)
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'appointment_datetime': future_time.isoformat(),
            'duration_minutes': 30,
            'appointment_type': 'follow_up',
            'reason': 'Follow-up visit'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 2)

    def test_create_appointment_in_past_fails(self):
        """Test that creating an appointment in the past fails."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('appointments:appointment-list')

        past_time = timezone.now() - timedelta(days=1)
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'appointment_datetime': past_time.isoformat(),
            'duration_minutes': 30,
            'appointment_type': 'consultation',
            'reason': 'Test'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot schedule appointments in the past', str(response.data))

    def test_create_conflicting_appointment_fails(self):
        """Test that creating a conflicting appointment fails."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('appointments:appointment-list')

        # Try to create appointment at same time as existing one
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'appointment_datetime': self.appointment_time.isoformat(),
            'duration_minutes': 30,
            'appointment_type': 'consultation',
            'reason': 'Conflicting appointment'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicting appointment', str(response.data).lower())

    def test_check_in_appointment(self):
        """Test checking in a patient for an appointment."""
        # Update appointment to be soon (within 1 hour)
        self.appointment.appointment_datetime = timezone.now() + timedelta(minutes=30)
        self.appointment.save()

        self.client.force_authenticate(user=self.receptionist_user)
        url = reverse('appointments:appointment-check-in', kwargs={'pk': self.appointment.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'checked_in')
        self.assertIsNotNone(self.appointment.checked_in_at)

    def test_complete_appointment_as_doctor(self):
        """Test that doctors can complete their appointments."""
        # Set appointment to checked_in status
        self.appointment.status = 'checked_in'
        self.appointment.checked_in_at = timezone.now()
        self.appointment.save()

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('appointments:appointment-complete', kwargs={'pk': self.appointment.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'completed')
        self.assertIsNotNone(self.appointment.checked_out_at)

    def test_cancel_appointment(self):
        """Test cancelling an appointment."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments:appointment-cancel', kwargs={'pk': self.appointment.id})
        data = {
            'cancellation_reason': 'Unable to make it'
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'cancelled')
        self.assertIsNotNone(self.appointment.cancelled_at)
        self.assertEqual(self.appointment.cancellation_reason, 'Unable to make it')

    def test_reschedule_appointment(self):
        """Test rescheduling an appointment."""
        self.client.force_authenticate(user=self.receptionist_user)
        url = reverse('appointments:appointment-reschedule', kwargs={'pk': self.appointment.id})

        new_time = timezone.now() + timedelta(days=14)
        data = {
            'new_datetime': new_time.isoformat()
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'rescheduled')

        # Verify new appointment was created
        self.assertEqual(Appointment.objects.count(), 2)
        new_appointment = Appointment.objects.get(rescheduled_from=self.appointment)
        self.assertEqual(new_appointment.status, 'scheduled')

    def test_mark_no_show(self):
        """Test marking an appointment as no-show."""
        # Set appointment to past time
        self.appointment.appointment_datetime = timezone.now() - timedelta(hours=2)
        self.appointment.save()

        self.client.force_authenticate(user=self.receptionist_user)
        url = reverse('appointments:appointment-mark-no-show', kwargs={'pk': self.appointment.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'no_show')

    def test_get_upcoming_appointments(self):
        """Test getting upcoming appointments."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments:appointment-upcoming')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_today_appointments(self):
        """Test getting today's appointments."""
        # Create appointment for today
        today_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_datetime=timezone.now() + timedelta(hours=2),
            duration_minutes=30,
            appointment_type='consultation',
            reason='Today appointment'
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('appointments:appointment-today')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include today's appointment
        self.assertGreaterEqual(len(response.data), 1)

    def test_patient_cannot_modify_past_appointment(self):
        """Test that patients cannot modify past appointments."""
        # Set appointment to past
        self.appointment.appointment_datetime = timezone.now() - timedelta(days=1)
        self.appointment.save()

        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments:appointment-detail', kwargs={'pk': self.appointment.id})
        data = {
            'notes': 'Trying to update past appointment'
        }
        response = self.client.patch(url, data, format='json')

        # Should be forbidden for past appointments
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AppointmentReminderTestCase(TestCase):
    """Test cases for AppointmentReminder model."""

    def setUp(self):
        """Set up test data."""
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )

        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )

        self.patient = Patient.objects.create(
            user=self.patient_user,
            medical_record_number='MRN123',
            date_of_birth='1990-01-01',
            email='patient@example.com'
        )

        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='LIC123'
        )

        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_datetime=timezone.now() + timedelta(days=1),
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test'
        )

    def test_create_reminder(self):
        """Test creating an appointment reminder."""
        reminder = AppointmentReminder.objects.create(
            appointment=self.appointment,
            reminder_type='email',
            scheduled_send_time=timezone.now() + timedelta(hours=12),
            recipient_email='patient@example.com'
        )

        self.assertEqual(reminder.appointment, self.appointment)
        self.assertEqual(reminder.status, 'pending')

    def test_mark_reminder_as_sent(self):
        """Test marking a reminder as sent."""
        reminder = AppointmentReminder.objects.create(
            appointment=self.appointment,
            reminder_type='sms',
            scheduled_send_time=timezone.now(),
            recipient_phone='+11234567890'
        )

        reminder.mark_as_sent()

        self.assertEqual(reminder.status, 'sent')
        self.assertIsNotNone(reminder.sent_at)

    def test_mark_reminder_as_failed(self):
        """Test marking a reminder as failed."""
        reminder = AppointmentReminder.objects.create(
            appointment=self.appointment,
            reminder_type='email',
            scheduled_send_time=timezone.now(),
            recipient_email='patient@example.com'
        )

        reminder.mark_as_failed('Email bounce')

        self.assertEqual(reminder.status, 'failed')
        self.assertEqual(reminder.delivery_status_message, 'Email bounce')
