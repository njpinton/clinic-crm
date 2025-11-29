"""
Appointment models for the Clinic CRM.
Manages appointment scheduling, reminders, and cancellations.
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class Appointment(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Patient appointments with doctors.
    Includes scheduling, status tracking, and conflict detection.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('consultation', 'Consultation'),
        ('follow_up', 'Follow-up'),
        ('procedure', 'Procedure'),
        ('lab_work', 'Lab Work'),
        ('vaccination', 'Vaccination'),
        ('physical_exam', 'Physical Examination'),
        ('emergency', 'Emergency'),
        ('telemedicine', 'Telemedicine'),
    ]

    URGENCY_CHOICES = [
        ('routine', 'Routine'),
        ('urgent', 'Urgent'),
        ('emergency', 'Emergency'),
    ]

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.PROTECT,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.PROTECT,
        related_name='appointments'
    )

    # Appointment details
    appointment_datetime = models.DateTimeField(db_index=True)
    duration_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Expected duration in minutes"
    )

    appointment_type = models.CharField(
        max_length=20,
        choices=APPOINTMENT_TYPE_CHOICES,
        default='consultation'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        db_index=True
    )

    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default='routine',
        db_index=True
    )

    is_walk_in = models.BooleanField(default=False)
    
    # For manual queue reordering (lower number = higher priority)
    queue_order = models.IntegerField(default=0, help_text="Manual override for queue position")

    # Reason and notes
    reason = models.TextField(help_text="Reason for visit")
    notes = models.TextField(blank=True, help_text="Additional notes or special instructions")

    # Check-in/Check-out
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)

    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_appointments'
    )
    cancellation_reason = models.TextField(blank=True)

    # Rescheduling
    rescheduled_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_to'
    )

    # Reminder tracking
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-appointment_datetime']
        indexes = [
            models.Index(fields=['patient', 'appointment_datetime']),
            models.Index(fields=['doctor', 'appointment_datetime']),
            models.Index(fields=['status', 'appointment_datetime']),
            models.Index(fields=['appointment_datetime', 'status']),
        ]
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'

    def __str__(self):
        return f"{self.patient.full_name} with {self.doctor.full_name} on {self.appointment_datetime}"

    def clean(self):
        """Validate appointment data."""
        super().clean()

        # Check if appointment is in the past (for new appointments)
        if not self.pk and self.appointment_datetime < timezone.now():
            raise ValidationError("Cannot schedule appointments in the past")

        # Check for doctor availability conflicts
        if self.doctor_id and self.appointment_datetime:
            conflicts = Appointment.objects.filter(
                doctor=self.doctor,
                appointment_datetime=self.appointment_datetime,
                status__in=['scheduled', 'confirmed', 'in_progress']
            ).exclude(pk=self.pk)

            if conflicts.exists():
                raise ValidationError(
                    f"Doctor {self.doctor.full_name} already has an appointment at this time"
                )

    @property
    def end_datetime(self):
        """Calculate appointment end time."""
        from datetime import timedelta
        return self.appointment_datetime + timedelta(minutes=self.duration_minutes)

    @property
    def is_upcoming(self):
        """Check if appointment is in the future."""
        return self.appointment_datetime > timezone.now() and self.status in ['scheduled', 'confirmed']

    @property
    def is_today(self):
        """Check if appointment is today."""
        return self.appointment_datetime.date() == timezone.now().date()

    @property
    def is_past(self):
        """Check if appointment is in the past."""
        return self.appointment_datetime < timezone.now()

    def cancel(self, user, reason=""):
        """Cancel the appointment."""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.cancelled_by = user
        self.cancellation_reason = reason
        self.save(update_fields=['status', 'cancelled_at', 'cancelled_by', 'cancellation_reason'])

    def reschedule(self, new_datetime):
        """Reschedule the appointment to a new time."""
        # Create new appointment with reference to old one
        new_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_datetime=new_datetime,
            duration_minutes=self.duration_minutes,
            appointment_type=self.appointment_type,
            reason=self.reason,
            notes=self.notes,
            rescheduled_from=self
        )

        # Mark current appointment as rescheduled
        self.status = 'rescheduled'
        self.save(update_fields=['status'])

        return new_appointment

    def check_in(self):
        """Check in the patient for the appointment."""
        self.status = 'checked_in'
        self.checked_in_at = timezone.now()
        self.save(update_fields=['status', 'checked_in_at'])

    def complete(self):
        """Mark appointment as completed."""
        self.status = 'completed'
        self.checked_out_at = timezone.now()
        self.save(update_fields=['status', 'checked_out_at'])


class AppointmentReminder(UUIDModel, TimeStampedModel):
    """
    Appointment reminders sent to patients.
    Tracks reminder delivery via email and SMS.
    """
    REMINDER_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='reminders'
    )

    reminder_type = models.CharField(max_length=10, choices=REMINDER_TYPE_CHOICES)

    # When to send the reminder (e.g., 24 hours before)
    scheduled_send_time = models.DateTimeField()

    # Actual send time
    sent_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )

    # Delivery tracking
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=17, blank=True)

    delivery_status_message = models.TextField(blank=True)

    # Tracking IDs from email/SMS providers
    external_id = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-scheduled_send_time']
        indexes = [
            models.Index(fields=['appointment', 'reminder_type']),
            models.Index(fields=['status', 'scheduled_send_time']),
        ]
        verbose_name = 'Appointment Reminder'
        verbose_name_plural = 'Appointment Reminders'

    def __str__(self):
        return f"{self.reminder_type} reminder for {self.appointment}"

    def mark_as_sent(self):
        """Mark reminder as sent."""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])

    def mark_as_delivered(self):
        """Mark reminder as delivered."""
        self.status = 'delivered'
        self.save(update_fields=['status'])

    def mark_as_failed(self, message=""):
        """Mark reminder as failed."""
        self.status = 'failed'
        self.delivery_status_message = message
        self.save(update_fields=['status', 'delivery_status_message'])
