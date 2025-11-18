"""
Django admin configuration for doctors app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Specialization, Doctor, DoctorCredential, DoctorAvailability


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    """Admin interface for Specialization model."""
    list_display = ['name', 'doctor_count', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def doctor_count(self, obj):
        """Display number of doctors with this specialization."""
        return obj.doctors.count()
    doctor_count.short_description = 'Number of Doctors'


class DoctorCredentialInline(admin.TabularInline):
    """Inline admin for doctor credentials."""
    model = DoctorCredential
    extra = 0
    fields = [
        'credential_type',
        'credential_number',
        'issuing_organization',
        'issue_date',
        'expiration_date',
        'is_verified',
        'verification_date'
    ]
    readonly_fields = ['verification_date']


class DoctorAvailabilityInline(admin.TabularInline):
    """Inline admin for doctor availability."""
    model = DoctorAvailability
    extra = 0
    fields = ['day_of_week', 'start_time', 'end_time', 'is_active']
    ordering = ['day_of_week', 'start_time']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """Admin interface for Doctor model."""
    list_display = [
        'full_name',
        'email',
        'license_number',
        'specialization_list',
        'is_accepting_patients',
        'telemedicine_available',
        'user_active_status',
        'created_at'
    ]
    list_filter = [
        'is_accepting_new_patients',
        'is_available_for_telemedicine',
        'user__is_active',
        'created_at',
        'specializations'
    ]
    search_fields = [
        'user__first_name',
        'user__last_name',
        'user__email',
        'license_number',
        'npi_number',
        'phone'
    ]
    filter_horizontal = ['specializations']
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
        'full_name_display'
    ]
    inlines = [DoctorCredentialInline, DoctorAvailabilityInline]
    ordering = ['user__last_name', 'user__first_name']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'full_name_display')
        }),
        ('Professional Information', {
            'fields': (
                'license_number',
                'npi_number',
                'dea_number',
                'specializations',
                'years_of_experience',
                'education',
                'board_certifications'
            )
        }),
        ('Contact Information', {
            'fields': ('phone', 'office_extension', 'email')
        }),
        ('Office Information', {
            'fields': ('office_address', 'office_room_number')
        }),
        ('Availability', {
            'fields': (
                'is_accepting_new_patients',
                'is_available_for_telemedicine',
                'consultation_fee'
            )
        }),
        ('Additional Information', {
            'fields': ('languages_spoken', 'bio', 'notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def full_name(self, obj):
        """Display doctor's full name."""
        return obj.user.get_full_name()
    full_name.short_description = 'Name'
    full_name.admin_order_field = 'user__last_name'

    def full_name_display(self, obj):
        """Display full name as readonly field."""
        return obj.user.get_full_name()
    full_name_display.short_description = 'Full Name'

    def email(self, obj):
        """Display doctor's email."""
        return obj.user.email
    email.short_description = 'Email'
    email.admin_order_field = 'user__email'

    def specialization_list(self, obj):
        """Display list of specializations."""
        specializations = obj.specializations.all()
        if specializations:
            return ', '.join([s.name for s in specializations[:3]])
        return '-'
    specialization_list.short_description = 'Specializations'

    def is_accepting_patients(self, obj):
        """Display accepting new patients status with icon."""
        if obj.is_accepting_new_patients:
            return format_html(
                '<span style="color: green;">✓ Yes</span>'
            )
        return format_html(
            '<span style="color: red;">✗ No</span>'
        )
    is_accepting_patients.short_description = 'Accepting Patients'

    def telemedicine_available(self, obj):
        """Display telemedicine availability with icon."""
        if obj.is_available_for_telemedicine:
            return format_html(
                '<span style="color: green;">✓ Yes</span>'
            )
        return format_html(
            '<span style="color: gray;">✗ No</span>'
        )
    telemedicine_available.short_description = 'Telemedicine'

    def user_active_status(self, obj):
        """Display user active status with icon."""
        if obj.user.is_active:
            return format_html(
                '<span style="color: green;">✓ Active</span>'
            )
        return format_html(
            '<span style="color: red;">✗ Inactive</span>'
        )
    user_active_status.short_description = 'Status'
    user_active_status.admin_order_field = 'user__is_active'

    actions = ['activate_doctors', 'deactivate_doctors', 'enable_telemedicine', 'disable_telemedicine']

    def activate_doctors(self, request, queryset):
        """Activate selected doctors."""
        count = 0
        for doctor in queryset:
            doctor.user.is_active = True
            doctor.user.save(update_fields=['is_active'])
            count += 1
        self.message_user(request, f'{count} doctor(s) activated successfully.')
    activate_doctors.short_description = 'Activate selected doctors'

    def deactivate_doctors(self, request, queryset):
        """Deactivate selected doctors."""
        count = 0
        for doctor in queryset:
            doctor.user.is_active = False
            doctor.user.save(update_fields=['is_active'])
            count += 1
        self.message_user(request, f'{count} doctor(s) deactivated successfully.')
    deactivate_doctors.short_description = 'Deactivate selected doctors'

    def enable_telemedicine(self, request, queryset):
        """Enable telemedicine for selected doctors."""
        updated = queryset.update(is_available_for_telemedicine=True)
        self.message_user(request, f'Telemedicine enabled for {updated} doctor(s).')
    enable_telemedicine.short_description = 'Enable telemedicine'

    def disable_telemedicine(self, request, queryset):
        """Disable telemedicine for selected doctors."""
        updated = queryset.update(is_available_for_telemedicine=False)
        self.message_user(request, f'Telemedicine disabled for {updated} doctor(s).')
    disable_telemedicine.short_description = 'Disable telemedicine'


@admin.register(DoctorCredential)
class DoctorCredentialAdmin(admin.ModelAdmin):
    """Admin interface for DoctorCredential model."""
    list_display = [
        'doctor_name',
        'credential_type',
        'credential_number',
        'issuing_organization',
        'issue_date',
        'expiration_date',
        'verification_status',
        'is_expired_display'
    ]
    list_filter = [
        'credential_type',
        'is_verified',
        'issue_date',
        'expiration_date'
    ]
    search_fields = [
        'doctor__user__first_name',
        'doctor__user__last_name',
        'credential_number',
        'issuing_organization'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at', 'is_expired_display']
    ordering = ['-issue_date']

    fieldsets = (
        ('Doctor', {
            'fields': ('doctor',)
        }),
        ('Credential Information', {
            'fields': (
                'credential_type',
                'credential_number',
                'issuing_organization',
                'issuing_state'
            )
        }),
        ('Dates', {
            'fields': (
                'issue_date',
                'expiration_date',
                'is_expired_display'
            )
        }),
        ('Verification', {
            'fields': (
                'is_verified',
                'verification_date',
                'verification_notes'
            )
        }),
        ('Documents', {
            'fields': ('credential_document',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def doctor_name(self, obj):
        """Display doctor's name."""
        return obj.doctor.user.get_full_name()
    doctor_name.short_description = 'Doctor'
    doctor_name.admin_order_field = 'doctor__user__last_name'

    def verification_status(self, obj):
        """Display verification status with icon."""
        if obj.is_verified:
            return format_html(
                '<span style="color: green;">✓ Verified</span>'
            )
        return format_html(
            '<span style="color: orange;">⚠ Not Verified</span>'
        )
    verification_status.short_description = 'Verification'

    def is_expired_display(self, obj):
        """Display expiration status with icon."""
        if obj.is_expired:
            return format_html(
                '<span style="color: red;">✗ Expired</span>'
            )
        return format_html(
            '<span style="color: green;">✓ Valid</span>'
        )
    is_expired_display.short_description = 'Status'

    actions = ['verify_credentials', 'unverify_credentials']

    def verify_credentials(self, request, queryset):
        """Verify selected credentials."""
        from django.utils import timezone
        updated = queryset.update(
            is_verified=True,
            verification_date=timezone.now().date()
        )
        self.message_user(request, f'{updated} credential(s) verified successfully.')
    verify_credentials.short_description = 'Verify selected credentials'

    def unverify_credentials(self, request, queryset):
        """Unverify selected credentials."""
        updated = queryset.update(
            is_verified=False,
            verification_date=None
        )
        self.message_user(request, f'{updated} credential(s) unverified.')
    unverify_credentials.short_description = 'Unverify selected credentials'


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    """Admin interface for DoctorAvailability model."""
    list_display = [
        'doctor_name',
        'day_of_week_display',
        'time_range',
        'is_active_display',
        'created_at'
    ]
    list_filter = [
        'day_of_week',
        'is_active',
        'created_at'
    ]
    search_fields = [
        'doctor__user__first_name',
        'doctor__user__last_name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['doctor__user__last_name', 'day_of_week', 'start_time']

    fieldsets = (
        ('Doctor', {
            'fields': ('doctor',)
        }),
        ('Schedule', {
            'fields': (
                'day_of_week',
                'start_time',
                'end_time',
                'is_active'
            )
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def doctor_name(self, obj):
        """Display doctor's name."""
        return obj.doctor.user.get_full_name()
    doctor_name.short_description = 'Doctor'
    doctor_name.admin_order_field = 'doctor__user__last_name'

    def day_of_week_display(self, obj):
        """Display day of week."""
        days = {
            0: 'Monday',
            1: 'Tuesday',
            2: 'Wednesday',
            3: 'Thursday',
            4: 'Friday',
            5: 'Saturday',
            6: 'Sunday'
        }
        return days.get(obj.day_of_week, '-')
    day_of_week_display.short_description = 'Day'
    day_of_week_display.admin_order_field = 'day_of_week'

    def time_range(self, obj):
        """Display time range."""
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'

    def is_active_display(self, obj):
        """Display active status with icon."""
        if obj.is_active:
            return format_html(
                '<span style="color: green;">✓ Active</span>'
            )
        return format_html(
            '<span style="color: gray;">✗ Inactive</span>'
        )
    is_active_display.short_description = 'Status'

    actions = ['activate_schedules', 'deactivate_schedules']

    def activate_schedules(self, request, queryset):
        """Activate selected schedules."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} schedule(s) activated successfully.')
    activate_schedules.short_description = 'Activate selected schedules'

    def deactivate_schedules(self, request, queryset):
        """Deactivate selected schedules."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} schedule(s) deactivated successfully.')
    deactivate_schedules.short_description = 'Deactivate selected schedules'
