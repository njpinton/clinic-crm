"""
PSGC (Philippine Standard Geographic Code) models.
Stores cached geographic data for regions, provinces, municipalities, and barangays.
"""
from django.db import models
from apps.core.models import UUIDModel, TimeStampedModel


class PSGCRegion(UUIDModel, TimeStampedModel):
    """Philippine region."""
    psgc_id = models.CharField(max_length=20, unique=True, db_index=True, help_text="PSGC code")
    name = models.CharField(max_length=255, db_index=True)
    correspondence_code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['psgc_id']),
        ]

    def __str__(self):
        return self.name


class PSGCProvince(UUIDModel, TimeStampedModel):
    """Philippine province."""
    psgc_id = models.CharField(max_length=20, unique=True, db_index=True, help_text="PSGC code")
    name = models.CharField(max_length=255, db_index=True)
    region = models.ForeignKey(PSGCRegion, on_delete=models.CASCADE, related_name='provinces')
    correspondence_code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['psgc_id']),
            models.Index(fields=['region']),
        ]

    def __str__(self):
        return self.name


class PSGCMunicipality(UUIDModel, TimeStampedModel):
    """Philippine city or municipality."""
    psgc_id = models.CharField(max_length=20, unique=True, db_index=True, help_text="PSGC code")
    name = models.CharField(max_length=255, db_index=True)
    province = models.ForeignKey(PSGCProvince, on_delete=models.CASCADE, related_name='municipalities')
    correspondence_code = models.CharField(max_length=20, blank=True, null=True)
    is_city = models.BooleanField(default=False, help_text="True if this is a city, False if municipality")

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['psgc_id']),
            models.Index(fields=['province']),
        ]

    def __str__(self):
        return self.name


class PSGCBarangay(UUIDModel, TimeStampedModel):
    """Philippine barangay (village/district)."""
    psgc_id = models.CharField(max_length=20, unique=True, db_index=True, help_text="PSGC code")
    name = models.CharField(max_length=255, db_index=True)
    municipality = models.ForeignKey(PSGCMunicipality, on_delete=models.CASCADE, related_name='barangays')
    correspondence_code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['psgc_id']),
            models.Index(fields=['municipality']),
        ]

    def __str__(self):
        return self.name
