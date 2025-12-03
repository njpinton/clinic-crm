"""
User models for the Clinic CRM.
Custom user model with role-based access control.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import UUIDModel, TimeStampedModel


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, UUIDModel, TimeStampedModel):
    """
    Custom user model for the Clinic CRM.
    Extends Django's AbstractUser with additional fields for RBAC and profile info.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
        ('nurse', 'Nurse'),
        ('receptionist', 'Receptionist'),
        ('lab_tech', 'Laboratory Technician'),
        ('pharmacist', 'Pharmacist'),
    ]

    # Override username to make it optional (use email for login)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, db_index=True)

    # Use custom user manager
    objects = UserManager()

    # Role-based access control
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='patient',
        db_index=True,
        help_text="User's role in the system"
    )

    # Contact information
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)

    # Verification and status
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's email has been verified"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the user can log in"
    )

    # Profile information
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    # Location information
    city = models.CharField(max_length=100, blank=True, help_text="City or town")
    province = models.CharField(max_length=100, blank=True, help_text="Province or state")
    postal_code = models.CharField(max_length=20, blank=True, help_text="Postal or zip code")

    # Emergency contact (for staff)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)

    # Timestamps are inherited from TimeStampedModel

    # Use email for authentication instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['last_name', 'first_name']),
        ]
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) - {self.get_role_display()}"

    @property
    def full_name(self):
        """Return user's full name."""
        return self.get_full_name() or self.email

    @property
    def is_admin(self):
        """Check if user is an administrator."""
        return self.role == 'admin'

    @property
    def is_doctor(self):
        """Check if user is a doctor."""
        return self.role == 'doctor'

    @property
    def is_patient(self):
        """Check if user is a patient."""
        return self.role == 'patient'

    @property
    def is_staff_member(self):
        """Check if user is a staff member (not a patient)."""
        return self.role in ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist']

    def save(self, *args, **kwargs):
        """Override save to ensure email is lowercase and set username."""
        self.email = self.email.lower()
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)
