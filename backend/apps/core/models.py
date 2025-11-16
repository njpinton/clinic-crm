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
