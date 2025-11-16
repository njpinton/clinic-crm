"""
Patient model for the Clinic CRM.
Stores patient demographic and contact information.
"""
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel, SoftDeleteManager, AllObjectsManager


class Patient(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Patient model with HIPAA-compliant data storage.
    Contains demographic information and contact details.
    """
    # Medical Record Number - Unique identifier for the patient
    medical_record_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique medical record number (MRN)"
    )

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(db_index=True)

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('U', 'Prefer not to say'),
    ]
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    # Contact Information
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    email = models.EmailField(blank=True)

    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)

    # Insurance Information (stored as JSON for flexibility)
    insurance_info = models.JSONField(
        default=dict,
        blank=True,
        help_text="Insurance provider, policy number, group number, etc."
    )

    # Managers
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['date_of_birth']),
            models.Index(fields=['medical_record_number']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} (MRN: {self.medical_record_number})"

    @property
    def full_name(self):
        """Return full name of patient."""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        """Calculate patient age based on date of birth."""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
