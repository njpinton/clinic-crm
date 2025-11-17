"""
Doctor/Provider models for the Clinic CRM.
Manages doctor profiles, specializations, and credentials.
"""
from django.db import models
from django.conf import settings
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class Specialization(UUIDModel, TimeStampedModel):
    """
    Medical specializations for doctors.
    Examples: Cardiology, Pediatrics, Orthopedics, etc.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    medical_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="Medical specialty code (e.g., NUCC taxonomy code)"
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Specialization'
        verbose_name_plural = 'Specializations'

    def __str__(self):
        return self.name


class Doctor(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Doctor profile with credentials and professional information.
    Links to a User with role='doctor'.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )

    # Professional identification
    license_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="State medical license number"
    )
    npi_number = models.CharField(
        max_length=10,
        unique=True,
        blank=True,
        help_text="National Provider Identifier (10 digits)"
    )
    dea_number = models.CharField(
        max_length=9,
        blank=True,
        help_text="DEA number for prescribing controlled substances"
    )

    # Specializations (many-to-many)
    specializations = models.ManyToManyField(
        Specialization,
        related_name='doctors',
        blank=True
    )

    # Professional details
    board_certified = models.BooleanField(default=False)
    years_of_experience = models.PositiveIntegerField(default=0)

    # Practice information
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Standard consultation fee in USD"
    )

    # Availability
    is_accepting_patients = models.BooleanField(
        default=True,
        help_text="Whether the doctor is currently accepting new patients"
    )

    # Bio and qualifications
    bio = models.TextField(blank=True, help_text="Professional biography")
    education = models.TextField(blank=True, help_text="Educational background")
    languages = models.CharField(
        max_length=200,
        blank=True,
        help_text="Languages spoken (comma-separated)"
    )

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        indexes = [
            models.Index(fields=['license_number']),
            models.Index(fields=['npi_number']),
        ]
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} ({self.license_number})"

    @property
    def full_name(self):
        """Return doctor's full name with title."""
        return f"Dr. {self.user.get_full_name()}"

    @property
    def primary_specialization(self):
        """Return the first specialization if any."""
        return self.specializations.first()


class DoctorCredential(UUIDModel, TimeStampedModel):
    """
    Professional credentials and certifications for doctors.
    Tracks licenses, board certifications, and other credentials.
    """
    CREDENTIAL_TYPES = [
        ('license', 'Medical License'),
        ('board_cert', 'Board Certification'),
        ('fellowship', 'Fellowship'),
        ('certification', 'Certification'),
        ('other', 'Other'),
    ]

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='credentials'
    )

    credential_type = models.CharField(max_length=20, choices=CREDENTIAL_TYPES)
    credential_name = models.CharField(max_length=200)
    issuing_organization = models.CharField(max_length=200)

    credential_number = models.CharField(max_length=100, blank=True)

    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)

    is_verified = models.BooleanField(default=False)
    verification_date = models.DateField(null=True, blank=True)

    document = models.FileField(
        upload_to='doctor_credentials/',
        null=True,
        blank=True,
        help_text="Scanned copy of the credential"
    )

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['doctor', 'credential_type']),
            models.Index(fields=['expiry_date']),
        ]
        verbose_name = 'Doctor Credential'
        verbose_name_plural = 'Doctor Credentials'

    def __str__(self):
        return f"{self.credential_name} - {self.doctor.full_name}"

    @property
    def is_expired(self):
        """Check if credential has expired."""
        if not self.expiry_date:
            return False
        from datetime import date
        return self.expiry_date < date.today()

    @property
    def is_expiring_soon(self):
        """Check if credential expires within 90 days."""
        if not self.expiry_date:
            return False
        from datetime import date, timedelta
        return self.expiry_date <= date.today() + timedelta(days=90)


class DoctorAvailability(UUIDModel, TimeStampedModel):
    """
    Doctor's availability schedule.
    Defines when a doctor is available for appointments.
    """
    WEEKDAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='availability_schedules'
    )

    day_of_week = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_active = models.BooleanField(
        default=True,
        help_text="Whether this schedule is currently active"
    )

    class Meta:
        ordering = ['day_of_week', 'start_time']
        indexes = [
            models.Index(fields=['doctor', 'day_of_week', 'is_active']),
        ]
        verbose_name = 'Doctor Availability'
        verbose_name_plural = 'Doctor Availabilities'
        unique_together = [['doctor', 'day_of_week', 'start_time']]

    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"
