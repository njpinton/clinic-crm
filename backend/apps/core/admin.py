"""
Django admin configuration for core app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for HIPAA Audit Logs.
    Read-only interface - audit logs cannot be modified or deleted.
    """
    list_display = [
        'created_at',
        'action_badge',
        'user_email',
        'user_role',
        'resource_type',
        'resource_id_short',
        'ip_address',
        'success_badge',
    ]
    list_filter = [
        'action',
        'resource_type',
        'user_role',
        'was_successful',
        'created_at',
    ]
    search_fields = [
        'user_email',
        'resource_type',
        'resource_id',
        'details',
        'ip_address',
    ]
    readonly_fields = [
        'id',
        'user',
        'user_email',
        'user_role',
        'action',
        'resource_type',
        'resource_id',
        'details',
        'ip_address',
        'user_agent',
        'request_method',
        'request_path',
        'query_params',
        'was_successful',
        'error_message',
        'created_at',
        'updated_at',
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    # Disable add, change, delete permissions
    def has_add_permission(self, request):
        """Audit logs can only be created programmatically."""
        return False

    def has_change_permission(self, request, obj=None):
        """Audit logs cannot be modified."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Audit logs cannot be deleted."""
        return False

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'user_email', 'user_role')
        }),
        ('Action Details', {
            'fields': ('action', 'resource_type', 'resource_id', 'details')
        }),
        ('Request Information', {
            'fields': (
                'ip_address',
                'user_agent',
                'request_method',
                'request_path',
                'query_params'
            ),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('was_successful', 'error_message')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def action_badge(self, obj):
        """Display action with color-coded badge."""
        colors = {
            'CREATE': '#28A745',  # Green
            'READ': '#17A2B8',    # Cyan
            'UPDATE': '#FFC107',  # Yellow
            'DELETE': '#DC3545',  # Red
            'LIST': '#6C757D',    # Gray
            'EXPORT': '#FFA500',  # Orange
            'PRINT': '#9370DB',   # Purple
        }
        color = colors.get(obj.action, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.action
        )
    action_badge.short_description = 'Action'
    action_badge.admin_order_field = 'action'

    def resource_id_short(self, obj):
        """Display truncated resource ID."""
        if not obj.resource_id:
            return '-'
        if len(obj.resource_id) > 12:
            return f"{obj.resource_id[:12]}..."
        return obj.resource_id
    resource_id_short.short_description = 'Resource ID'

    def success_badge(self, obj):
        """Display success status with icon."""
        if obj.was_successful:
            return format_html('<span style="color: green;">✓ Success</span>')
        return format_html('<span style="color: red;">✗ Failed</span>')
    success_badge.short_description = 'Status'
    success_badge.admin_order_field = 'was_successful'
