"""
Django admin configuration for users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""

    list_display = [
        'email',
        'full_name',
        'role_badge',
        'is_active_display',
        'is_verified_display',
        'is_staff',
        'created_at',
    ]
    list_filter = [
        'role',
        'is_active',
        'is_verified',
        'is_staff',
        'is_superuser',
        'created_at',
    ]
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['last_name', 'first_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'date_joined', 'last_login']

    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'username', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'phone', 'profile_picture')
        }),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_verified', 'is_staff', 'is_superuser')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone'),
            'classes': ('collapse',)
        }),
        ('Groups & Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'date_joined', 'last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': (
                'email',
                'password1',
                'password2',
                'first_name',
                'last_name',
                'role',
                'is_active',
                'is_verified',
            ),
        }),
    )

    def role_badge(self, obj):
        """Display role with color-coded badge."""
        colors = {
            'admin': '#DC3545',         # Red
            'doctor': '#007BFF',        # Blue
            'patient': '#28A745',       # Green
            'nurse': '#17A2B8',         # Cyan
            'receptionist': '#FFC107',  # Yellow
            'lab_tech': '#6C757D',      # Gray
            'pharmacist': '#E83E8C',    # Pink
        }
        color = colors.get(obj.role, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Role'
    role_badge.admin_order_field = 'role'

    def is_active_display(self, obj):
        """Display active status with icon."""
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    is_active_display.short_description = 'Active'
    is_active_display.admin_order_field = 'is_active'

    def is_verified_display(self, obj):
        """Display verified status with icon."""
        if obj.is_verified:
            return format_html('<span style="color: green;">✓ Verified</span>')
        return format_html('<span style="color: orange;">⚠ Not Verified</span>')
    is_verified_display.short_description = 'Verified'
    is_verified_display.admin_order_field = 'is_verified'

    actions = [
        'activate_users',
        'deactivate_users',
        'verify_users',
        'make_admin',
        'make_doctor',
        'make_patient',
    ]

    def activate_users(self, request, queryset):
        """Activate selected users."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) activated successfully.')
    activate_users.short_description = 'Activate selected users'

    def deactivate_users(self, request, queryset):
        """Deactivate selected users."""
        # Don't allow deactivating yourself
        queryset = queryset.exclude(id=request.user.id)
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated successfully.')
    deactivate_users.short_description = 'Deactivate selected users'

    def verify_users(self, request, queryset):
        """Verify selected users."""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} user(s) verified successfully.')
    verify_users.short_description = 'Verify selected users'

    def make_admin(self, request, queryset):
        """Change role to admin."""
        queryset = queryset.exclude(id=request.user.id)
        updated = queryset.update(role='admin')
        self.message_user(request, f'{updated} user(s) changed to admin role.')
    make_admin.short_description = 'Change role to Admin'

    def make_doctor(self, request, queryset):
        """Change role to doctor."""
        updated = queryset.update(role='doctor')
        self.message_user(request, f'{updated} user(s) changed to doctor role.')
    make_doctor.short_description = 'Change role to Doctor'

    def make_patient(self, request, queryset):
        """Change role to patient."""
        updated = queryset.update(role='patient')
        self.message_user(request, f'{updated} user(s) changed to patient role.')
    make_patient.short_description = 'Change role to Patient'
