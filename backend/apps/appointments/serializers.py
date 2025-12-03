"""
Appointment serializers for the Clinic CRM.
Following django-backend-guidelines: comprehensive validation and nested relationships.
"""
from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Appointment, AppointmentReminder, DoctorSchedule
from apps.patients.models import Patient
from apps.doctors.models import Doctor


class DoctorScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer for doctor schedules.
    Used for availability checking and schedule management.
    """
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'day_of_week',
            'day_of_week_display',
            'start_time',
            'end_time',
            'break_start',
            'break_end',
            'is_available',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'doctor_name',
            'day_of_week_display',
            'created_at',
            'updated_at',
        ]

    def validate_start_time(self, value):
        """Validate start time is reasonable."""
        # Start time should be between 5 AM and 8 PM
        from datetime import time
        if value < time(5, 0) or value > time(20, 0):
            raise serializers.ValidationError(
                "Start time should be between 05:00 and 20:00"
            )
        return value

    def validate_end_time(self, value):
        """Validate end time is reasonable."""
        from datetime import time
        if value < time(6, 0) or value > time(23, 0):
            raise serializers.ValidationError(
                "End time should be between 06:00 and 23:00"
            )
        return value

    def validate(self, attrs):
        """Validate schedule times."""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        break_start = attrs.get('break_start')
        break_end = attrs.get('break_end')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': "End time must be after start time."
            })

        if break_start and break_end and break_start >= break_end:
            raise serializers.ValidationError({
                'break_end': "Break end time must be after break start time."
            })

        return attrs


class AppointmentReminderSerializer(serializers.ModelSerializer):
    """
    Serializer for appointment reminders.
    """
    class Meta:
        model = AppointmentReminder
        fields = [
            'id',
            'appointment',
            'reminder_type',
            'scheduled_send_time',
            'sent_at',
            'status',
            'recipient_email',
            'recipient_phone',
            'delivery_status_message',
            'external_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'sent_at',
            'status',
            'delivery_status_message',
            'external_id',
            'created_at',
            'updated_at',
        ]

    def validate_scheduled_send_time(self, value):
        """Validate that scheduled send time is not in the past."""
        if value < timezone.now():
            raise serializers.ValidationError(
                "Scheduled send time cannot be in the past."
            )
        return value


class AppointmentListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for appointment lists.
    Optimized for performance with minimal nested data.
    """
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(
        source='get_appointment_type_display',
        read_only=True
    )
    is_upcoming = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'appointment_datetime',
            'duration_minutes',
            'appointment_type',
            'appointment_type_display',
            'status',
            'status_display',
            'urgency',
            'is_walk_in',
            'reason',
            'is_upcoming',
            'is_today',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'status_display',
            'appointment_type_display',
            'is_upcoming',
            'is_today',
            'created_at',
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Complete serializer for appointment details.
    Includes all fields and nested relationships.
    """
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)

    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_email = serializers.EmailField(source='doctor.email', read_only=True)
    doctor_specializations = serializers.SerializerMethodField()

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(
        source='get_appointment_type_display',
        read_only=True
    )

    end_datetime = serializers.DateTimeField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    cancelled_by_name = serializers.SerializerMethodField()
    rescheduled_from_id = serializers.UUIDField(
        source='rescheduled_from.id',
        read_only=True,
        allow_null=True
    )

    reminders = AppointmentReminderSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            # Patient information
            'patient',
            'patient_name',
            'patient_email',
            'patient_phone',
            # Doctor information
            'doctor',
            'doctor_name',
            'doctor_email',
            'doctor_specializations',
            # Appointment details
            'appointment_datetime',
            'end_datetime',
            'duration_minutes',
            'appointment_type',
            'appointment_type_display',
            'status',
            'status_display',
            'urgency',
            'is_walk_in',
            'reason',
            'notes',
            # Check-in/out
            'checked_in_at',
            'checked_out_at',
            # Cancellation
            'cancelled_at',
            'cancelled_by',
            'cancelled_by_name',
            'cancellation_reason',
            # Rescheduling
            'rescheduled_from',
            'rescheduled_from_id',
            # Reminders
            'reminder_sent',
            'reminder_sent_at',
            'reminders',
            # Computed properties
            'is_upcoming',
            'is_today',
            'is_past',
            # Metadata
            'created_at',
            'updated_at',
            'deleted_at',
        ]
        read_only_fields = [
            'id',
            'patient_name',
            'patient_email',
            'patient_phone',
            'doctor_name',
            'doctor_email',
            'doctor_specializations',
            'status_display',
            'appointment_type_display',
            'end_datetime',
            'checked_in_at',
            'checked_out_at',
            'cancelled_at',
            'cancelled_by_name',
            'rescheduled_from_id',
            'reminder_sent',
            'reminder_sent_at',
            'is_upcoming',
            'is_today',
            'is_past',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_doctor_specializations(self, obj):
        """Get doctor's specializations as a list of names."""
        return [s.name for s in obj.doctor.specializations.all()]

    def get_cancelled_by_name(self, obj):
        """Get name of user who cancelled the appointment."""
        if obj.cancelled_by:
            return obj.cancelled_by.get_full_name()
        return None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating appointments.
    Includes comprehensive validation.
    """
    class Meta:
        model = Appointment
        fields = [
            'patient',
            'doctor',
            'appointment_datetime',
            'duration_minutes',
            'appointment_type',
            'urgency',
            'is_walk_in',
            'reason',
            'notes',
        ]

    def validate_appointment_datetime(self, value):
        """Validate that appointment is not in the past."""
        if value < timezone.now():
            raise serializers.ValidationError(
                "Cannot schedule appointments in the past."
            )
        return value

    def validate_duration_minutes(self, value):
        """Validate duration is reasonable."""
        if value < 5:
            raise serializers.ValidationError(
                "Appointment duration must be at least 5 minutes."
            )
        if value > 480:  # 8 hours
            raise serializers.ValidationError(
                "Appointment duration cannot exceed 8 hours."
            )
        return value

    def validate_patient(self, value):
        """Validate that patient exists and is active."""
        if not value.user.is_active:
            raise serializers.ValidationError(
                "Cannot schedule appointments for inactive patients."
            )
        return value

    def validate_doctor(self, value):
        """Validate that doctor exists and is active."""
        if not value.user.is_active:
            raise serializers.ValidationError(
                "Cannot schedule appointments with inactive doctors."
            )
        return value

    def validate(self, attrs):
        """
        Validate appointment data including conflict detection.
        """
        patient = attrs.get('patient')
        doctor = attrs.get('doctor')
        appointment_datetime = attrs.get('appointment_datetime')
        duration_minutes = attrs.get('duration_minutes', 30)

        # Check for doctor availability conflicts
        from datetime import timedelta
        end_time = appointment_datetime + timedelta(minutes=duration_minutes)

        conflicts = Appointment.objects.filter(
            doctor=doctor,
            appointment_datetime__lt=end_time,
            status__in=['scheduled', 'confirmed', 'checked_in', 'in_progress']
        ).exclude(
            appointment_datetime__gte=end_time
        )

        if conflicts.exists():
            raise serializers.ValidationError({
                'appointment_datetime': f"Doctor {doctor.full_name} has a conflicting appointment at this time."
            })

        # Check if doctor is available for telemedicine (if applicable)
        if attrs.get('appointment_type') == 'telemedicine':
            if not doctor.is_available_for_telemedicine:
                raise serializers.ValidationError({
                    'appointment_type': f"Doctor {doctor.full_name} is not available for telemedicine appointments."
                })

        # Check if doctor is accepting new patients (for new patients)
        if not doctor.is_accepting_new_patients:
            # Check if this is a new patient (no previous completed appointments)
            previous_appointments = Appointment.objects.filter(
                patient=patient,
                doctor=doctor,
                status='completed'
            ).exists()

            if not previous_appointments:
                raise serializers.ValidationError({
                    'doctor': f"Doctor {doctor.full_name} is not accepting new patients."
                })

        return attrs

    def create(self, validated_data):
        """Create appointment with initial status."""
        validated_data['status'] = 'scheduled'
        try:
            appointment = Appointment(**validated_data)
            appointment.full_clean()  # Run model validation
            appointment.save()
            return appointment
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating appointments.
    Limited fields that can be updated after creation.
    """
    class Meta:
        model = Appointment
        fields = [
            'appointment_datetime',
            'duration_minutes',
            'appointment_type',
            'urgency',
            'reason',
            'notes',
            'status',
        ]

    def validate_status(self, value):
        """Validate status transitions."""
        instance = self.instance
        if not instance:
            return value

        # Define valid status transitions
        valid_transitions = {
            'scheduled': ['confirmed', 'cancelled', 'rescheduled'],
            'confirmed': ['checked_in', 'cancelled', 'no_show'],
            'checked_in': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],  # Cannot change from completed
            'cancelled': [],  # Cannot change from cancelled
            'no_show': [],  # Cannot change from no_show
            'rescheduled': [],  # Cannot change from rescheduled
        }

        if instance.status not in valid_transitions:
            raise serializers.ValidationError(
                f"Invalid current status: {instance.status}"
            )

        if value not in valid_transitions[instance.status]:
            raise serializers.ValidationError(
                f"Cannot change status from '{instance.status}' to '{value}'."
            )

        return value

    def validate_appointment_datetime(self, value):
        """Validate that rescheduling is to a future time."""
        if value < timezone.now():
            raise serializers.ValidationError(
                "Cannot reschedule to a time in the past."
            )
        return value


class AppointmentCancelSerializer(serializers.Serializer):
    """
    Serializer for cancelling appointments.
    """
    cancellation_reason = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Reason for cancellation"
    )

    def validate_cancellation_reason(self, value):
        """Validate cancellation reason is not empty."""
        if not value.strip():
            raise serializers.ValidationError(
                "Cancellation reason cannot be empty."
            )
        return value.strip()


class AppointmentRescheduleSerializer(serializers.Serializer):
    """
    Serializer for rescheduling appointments.
    """
    new_datetime = serializers.DateTimeField(
        required=True,
        help_text="New appointment date and time"
    )

    def validate_new_datetime(self, value):
        """Validate that new time is in the future."""
        if value < timezone.now():
            raise serializers.ValidationError(
                "Cannot reschedule to a time in the past."
            )
        return value
