"""
Django admin configuration for appointments app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Appointment, AppointmentReminder


class AppointmentReminderInline(admin.TabularInline):
    """Inline admin for appointment reminders."""
    model = AppointmentReminder
    extra = 0
    fields = [
        'reminder_type',
        'scheduled_send_time',
        'sent_at',
        'status',
        'recipient_email',
        'recipient_phone'
    ]
    readonly_fields = ['sent_at', 'status']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin interface for Appointment model."""
    list_display = [
        'appointment_datetime',
        'patient_name',
        'doctor_name',
        'appointment_type_display',
        'status_badge',
        'duration_minutes',
        'is_upcoming_display',
        'checked_in_status',
        'created_at'
    ]
    list_filter = [
        'status',
        'appointment_type',
        'appointment_datetime',
        'created_at',
        'reminder_sent'
    ]
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'patient__medical_record_number',
        'doctor__user__first_name',
        'doctor__user__last_name',
        'reason'
    ]
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
        'end_datetime',
        'is_upcoming',
        'is_today',
        'is_past',
        'checked_in_at',
        'checked_out_at',
        'cancelled_at',
        'reminder_sent_at'
    ]
    inlines = [AppointmentReminderInline]
    ordering = ['-appointment_datetime']
    date_hierarchy = 'appointment_datetime'

    fieldsets = (
        ('Patient & Doctor', {
            'fields': ('patient', 'doctor')
        }),
        ('Appointment Details', {
            'fields': (
                'appointment_datetime',
                'end_datetime',
                'duration_minutes',
                'appointment_type',
                'status',
                'reason',
                'notes'
            )
        }),
        ('Check-in/out', {
            'fields': ('checked_in_at', 'checked_out_at'),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': (
                'cancelled_at',
                'cancelled_by',
                'cancellation_reason'
            ),
            'classes': ('collapse',)
        }),
        ('Rescheduling', {
            'fields': ('rescheduled_from',),
            'classes': ('collapse',)
        }),
        ('Reminders', {
            'fields': ('reminder_sent', 'reminder_sent_at'),
            'classes': ('collapse',)
        }),
        ('Status Flags', {
            'fields': ('is_upcoming', 'is_today', 'is_past'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def patient_name(self, obj):
        """Display patient's name."""
        return obj.patient.full_name
    patient_name.short_description = 'Patient'
    patient_name.admin_order_field = 'patient__user__last_name'

    def doctor_name(self, obj):
        """Display doctor's name."""
        return obj.doctor.full_name
    doctor_name.short_description = 'Doctor'
    doctor_name.admin_order_field = 'doctor__user__last_name'

    def appointment_type_display(self, obj):
        """Display appointment type."""
        return obj.get_appointment_type_display()
    appointment_type_display.short_description = 'Type'
    appointment_type_display.admin_order_field = 'appointment_type'

    def status_badge(self, obj):
        """Display status with color-coded badge."""
        colors = {
            'scheduled': '#FFA500',  # Orange
            'confirmed': '#4169E1',  # Royal Blue
            'checked_in': '#9370DB',  # Medium Purple
            'in_progress': '#1E90FF',  # Dodger Blue
            'completed': '#28A745',  # Green
            'cancelled': '#DC3545',  # Red
            'no_show': '#6C757D',  # Gray
            'rescheduled': '#17A2B8',  # Cyan
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def is_upcoming_display(self, obj):
        """Display if appointment is upcoming."""
        if obj.is_upcoming:
            return format_html(
                '<span style="color: green;">✓ Upcoming</span>'
            )
        return format_html(
            '<span style="color: gray;">-</span>'
        )
    is_upcoming_display.short_description = 'Upcoming'

    def checked_in_status(self, obj):
        """Display check-in status."""
        if obj.checked_in_at:
            return format_html(
                '<span style="color: green;">✓ Checked In</span>'
            )
        elif obj.is_today and obj.status in ['scheduled', 'confirmed']:
            return format_html(
                '<span style="color: orange;">⚠ Not Checked In</span>'
            )
        return format_html(
            '<span style="color: gray;">-</span>'
        )
    checked_in_status.short_description = 'Check-in'

    actions = [
        'confirm_appointments',
        'cancel_appointments',
        'mark_as_no_show',
        'send_reminders'
    ]

    def confirm_appointments(self, request, queryset):
        """Confirm selected appointments."""
        queryset = queryset.filter(status='scheduled')
        updated = queryset.update(status='confirmed')
        self.message_user(request, f'{updated} appointment(s) confirmed.')
    confirm_appointments.short_description = 'Confirm selected appointments'

    def cancel_appointments(self, request, queryset):
        """Cancel selected appointments."""
        queryset = queryset.exclude(status__in=['completed', 'cancelled', 'no_show'])
        count = 0
        for appointment in queryset:
            appointment.cancel(
                user=request.user,
                reason='Cancelled by admin'
            )
            count += 1
        self.message_user(request, f'{count} appointment(s) cancelled.')
    cancel_appointments.short_description = 'Cancel selected appointments'

    def mark_as_no_show(self, request, queryset):
        """Mark selected appointments as no-show."""
        queryset = queryset.filter(
            status__in=['scheduled', 'confirmed'],
            appointment_datetime__lt=timezone.now()
        )
        updated = queryset.update(status='no_show')
        self.message_user(request, f'{updated} appointment(s) marked as no-show.')
    mark_as_no_show.short_description = 'Mark selected as no-show'

    def send_reminders(self, request, queryset):
        """Send reminders for selected appointments."""
        count = 0
        for appointment in queryset:
            if not appointment.reminder_sent and appointment.is_upcoming:
                # Create reminder (in production, this would trigger actual sending)
                AppointmentReminder.objects.create(
                    appointment=appointment,
                    reminder_type='email',
                    scheduled_send_time=timezone.now(),
                    recipient_email=appointment.patient.email,
                    status='pending'
                )
                appointment.reminder_sent = True
                appointment.reminder_sent_at = timezone.now()
                appointment.save(update_fields=['reminder_sent', 'reminder_sent_at'])
                count += 1
        self.message_user(request, f'Reminders created for {count} appointment(s).')
    send_reminders.short_description = 'Send reminders for selected appointments'


@admin.register(AppointmentReminder)
class AppointmentReminderAdmin(admin.ModelAdmin):
    """Admin interface for AppointmentReminder model."""
    list_display = [
        'appointment_display',
        'reminder_type',
        'scheduled_send_time',
        'sent_at',
        'status_badge',
        'recipient_info',
        'created_at'
    ]
    list_filter = [
        'reminder_type',
        'status',
        'scheduled_send_time',
        'sent_at'
    ]
    search_fields = [
        'appointment__patient__user__first_name',
        'appointment__patient__user__last_name',
        'recipient_email',
        'recipient_phone',
        'external_id'
    ]
    readonly_fields = [
        'id',
        'sent_at',
        'created_at',
        'updated_at'
    ]
    ordering = ['-scheduled_send_time']
    date_hierarchy = 'scheduled_send_time'

    fieldsets = (
        ('Appointment', {
            'fields': ('appointment',)
        }),
        ('Reminder Details', {
            'fields': (
                'reminder_type',
                'scheduled_send_time',
                'sent_at',
                'status'
            )
        }),
        ('Recipient Information', {
            'fields': (
                'recipient_email',
                'recipient_phone'
            )
        }),
        ('Delivery Tracking', {
            'fields': (
                'delivery_status_message',
                'external_id'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def appointment_display(self, obj):
        """Display appointment information."""
        apt = obj.appointment
        return f"{apt.patient.full_name} - {apt.appointment_datetime.strftime('%Y-%m-%d %H:%M')}"
    appointment_display.short_description = 'Appointment'
    appointment_display.admin_order_field = 'appointment__appointment_datetime'

    def status_badge(self, obj):
        """Display status with color-coded badge."""
        colors = {
            'pending': '#FFA500',  # Orange
            'sent': '#1E90FF',  # Dodger Blue
            'delivered': '#28A745',  # Green
            'failed': '#DC3545',  # Red
            'bounced': '#6C757D',  # Gray
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def recipient_info(self, obj):
        """Display recipient contact information."""
        info = []
        if obj.recipient_email:
            info.append(f"📧 {obj.recipient_email}")
        if obj.recipient_phone:
            info.append(f"📱 {obj.recipient_phone}")
        return format_html('<br>'.join(info)) if info else '-'
    recipient_info.short_description = 'Recipient'

    actions = ['mark_as_sent', 'mark_as_delivered', 'mark_as_failed']

    def mark_as_sent(self, request, queryset):
        """Mark selected reminders as sent."""
        queryset = queryset.filter(status='pending')
        count = 0
        for reminder in queryset:
            reminder.mark_as_sent()
            count += 1
        self.message_user(request, f'{count} reminder(s) marked as sent.')
    mark_as_sent.short_description = 'Mark selected as sent'

    def mark_as_delivered(self, request, queryset):
        """Mark selected reminders as delivered."""
        queryset = queryset.filter(status='sent')
        count = 0
        for reminder in queryset:
            reminder.mark_as_delivered()
            count += 1
        self.message_user(request, f'{count} reminder(s) marked as delivered.')
    mark_as_delivered.short_description = 'Mark selected as delivered'

    def mark_as_failed(self, request, queryset):
        """Mark selected reminders as failed."""
        count = 0
        for reminder in queryset:
            reminder.mark_as_failed('Marked as failed by admin')
            count += 1
        self.message_user(request, f'{count} reminder(s) marked as failed.')
    mark_as_failed.short_description = 'Mark selected as failed'
