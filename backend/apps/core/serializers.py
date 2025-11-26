"""
Serializers for core app models, including audit logs.
"""
from rest_framework import serializers
from apps.core.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model.
    Read-only - audit logs cannot be created or modified via API.
    """

    class Meta:
        model = AuditLog
        fields = [
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
        read_only_fields = fields  # All fields are read-only
