"""
Core abstract models for the Clinic CRM.
Provides base functionality for all models including timestamps, soft deletes, and UUIDs.
"""
from django.db import models
from django.utils import timezone
import uuid


class UUIDModel(models.Model):
    """Abstract base model with UUID primary key for better security and distribution."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """Abstract base model with creation and modification timestamps."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstract base model for soft deletes.
    HIPAA Requirement: Medical records must never be truly deleted.
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark record as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])


class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records by default."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that includes soft-deleted records."""

    def get_queryset(self):
        return super().get_queryset()


class AuditLog(UUIDModel, TimeStampedModel):
    """
    HIPAA Audit Log model.
    Stores all access to Protected Health Information (PHI) for compliance.
    This model must NEVER be deleted - audit logs are permanent.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('READ', 'Read'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LIST', 'List'),
        ('EXPORT', 'Export'),
        ('PRINT', 'Print'),
    ]

    # User who performed the action
    user = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,  # Never delete audit logs
        related_name='audit_logs'
    )
    user_email = models.EmailField(db_index=True)
    user_role = models.CharField(max_length=20, db_index=True)

    # Action details
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True, help_text="Type of resource accessed (e.g., Patient, Appointment)")
    resource_id = models.CharField(max_length=255, null=True, blank=True, help_text="ID of specific resource (null for LIST actions)")

    # Additional details
    details = models.TextField(blank=True, help_text="Human-readable description of the action")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Request metadata
    request_method = models.CharField(max_length=10, blank=True)  # GET, POST, PUT, DELETE
    request_path = models.CharField(max_length=500, blank=True)
    query_params = models.TextField(blank=True)

    # Success/Failure tracking
    was_successful = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['resource_type', 'created_at']),
            models.Index(fields=['user_email', 'created_at']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"{self.action} {self.resource_type} by {self.user_email} at {self.created_at}"

    def save(self, *args, **kwargs):
        """Override save to ensure audit logs are never modified after creation."""
        if not self._state.adding:
            raise ValueError("Audit logs cannot be modified after creation")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion of audit logs."""
        raise ValueError("Audit logs cannot be deleted")
