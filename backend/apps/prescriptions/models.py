"""
Prescription models for the Clinic CRM.
Manages medication prescriptions and pharmacy orders.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class Medication(UUIDModel, TimeStampedModel):
    """
    Medication catalog.
    Database of medications that can be prescribed.
    """
    DRUG_CLASS_CHOICES = [
        ('antibiotic', 'Antibiotic'),
        ('analgesic', 'Analgesic'),
        ('antihypertensive', 'Antihypertensive'),
        ('antidiabetic', 'Antidiabetic'),
        ('anticoagulant', 'Anticoagulant'),
        ('antidepressant', 'Antidepressant'),
        ('antipsychotic', 'Antipsychotic'),
        ('antihistamine', 'Antihistamine'),
        ('bronchodilator', 'Bronchodilator'),
        ('corticosteroid', 'Corticosteroid'),
        ('vitamin', 'Vitamin/Supplement'),
        ('other', 'Other'),
    ]

    # Medication identification
    ndc_code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        help_text="National Drug Code"
    )
    brand_name = models.CharField(max_length=200, db_index=True)
    generic_name = models.CharField(max_length=200, db_index=True)

    # Classification
    drug_class = models.CharField(max_length=50, choices=DRUG_CLASS_CHOICES, db_index=True)
    controlled_substance_schedule = models.CharField(
        max_length=10,
        blank=True,
        help_text="DEA schedule (I, II, III, IV, V) if controlled substance"
    )

    # Dosage information
    strength = models.CharField(max_length=100, help_text="e.g., 500mg, 10mg/5ml")
    dosage_form = models.CharField(
        max_length=100,
        help_text="e.g., tablet, capsule, liquid, injection"
    )

    # Usage
    typical_dosage = models.CharField(
        max_length=200,
        blank=True,
        help_text="Typical dosage instructions"
    )
    indications = models.TextField(blank=True, help_text="What it's used for")
    contraindications = models.TextField(blank=True, help_text="When NOT to use")
    side_effects = models.TextField(blank=True, help_text="Common side effects")
    interactions = models.TextField(blank=True, help_text="Drug interactions")

    # Manufacturer
    manufacturer = models.CharField(max_length=200, blank=True)

    # Pricing
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price per unit"
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_formulary = models.BooleanField(
        default=True,
        help_text="Whether this medication is on the clinic's formulary"
    )

    class Meta:
        ordering = ['generic_name', 'brand_name']
        indexes = [
            models.Index(fields=['generic_name']),
            models.Index(fields=['brand_name']),
            models.Index(fields=['drug_class', 'is_active']),
        ]
        verbose_name = 'Medication'
        verbose_name_plural = 'Medications'

    def __str__(self):
        if self.brand_name != self.generic_name:
            return f"{self.brand_name} ({self.generic_name}) {self.strength}"
        return f"{self.generic_name} {self.strength}"

    @property
    def is_controlled_substance(self):
        """Check if medication is a controlled substance."""
        return bool(self.controlled_substance_schedule)


class Prescription(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Patient prescriptions.
    Tracks medication prescriptions from doctors.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('on_hold', 'On Hold'),
    ]

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )
    medication = models.ForeignKey(
        Medication,
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions'
    )

    # Prescription details
    prescription_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique prescription number"
    )
    prescribed_date = models.DateField(default=timezone.now, db_index=True)

    # Dosage instructions
    dosage = models.CharField(max_length=200, help_text="e.g., 500mg")
    frequency = models.CharField(max_length=200, help_text="e.g., twice daily, every 6 hours")
    route = models.CharField(
        max_length=50,
        default='oral',
        help_text="e.g., oral, topical, injection"
    )
    duration = models.CharField(max_length=100, help_text="e.g., 10 days, 3 months")

    # Quantity and refills
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of units (tablets, ml, etc.)"
    )
    refills_allowed = models.PositiveIntegerField(
        default=0,
        help_text="Number of refills allowed"
    )
    refills_remaining = models.PositiveIntegerField(
        default=0,
        help_text="Number of refills remaining"
    )

    # Instructions
    instructions = models.TextField(
        help_text="Full instructions for patient (e.g., take with food)"
    )
    indication = models.TextField(
        blank=True,
        help_text="Reason for prescription"
    )

    # Pharmacy
    pharmacy_name = models.CharField(max_length=200, blank=True)
    pharmacy_phone = models.CharField(max_length=17, blank=True)

    # Status and dates
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    expiration_date = models.DateField(null=True, blank=True)
    last_filled_date = models.DateField(null=True, blank=True)

    # Controlled substance tracking
    dea_number_used = models.CharField(
        max_length=9,
        blank=True,
        help_text="DEA number if controlled substance"
    )

    # Electronic prescribing
    electronically_sent = models.BooleanField(default=False)
    sent_to_pharmacy_at = models.DateTimeField(null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-prescribed_date']
        indexes = [
            models.Index(fields=['patient', 'prescribed_date']),
            models.Index(fields=['doctor', 'prescribed_date']),
            models.Index(fields=['medication', 'status']),
            models.Index(fields=['status', 'expiration_date']),
        ]
        verbose_name = 'Prescription'
        verbose_name_plural = 'Prescriptions'

    def __str__(self):
        return f"{self.patient.full_name} - {self.medication} ({self.prescribed_date})"

    @property
    def is_active(self):
        """Check if prescription is active and not expired."""
        if self.status != 'active':
            return False
        if self.expiration_date and self.expiration_date < timezone.now().date():
            return False
        return True

    @property
    def is_expired(self):
        """Check if prescription has expired."""
        if not self.expiration_date:
            return False
        return self.expiration_date < timezone.now().date()

    @property
    def can_refill(self):
        """Check if prescription can be refilled."""
        return self.is_active and self.refills_remaining > 0

    def fill(self):
        """Record a fill of this prescription."""
        if not self.can_refill and self.last_filled_date is not None:
            raise ValueError("No refills remaining")

        self.refills_remaining = max(0, self.refills_remaining - 1)
        self.last_filled_date = timezone.now().date()

        if self.refills_remaining == 0:
            self.status = 'completed'

        self.save(update_fields=['refills_remaining', 'last_filled_date', 'status'])

    def cancel(self, reason=""):
        """Cancel the prescription."""
        self.status = 'cancelled'
        if reason:
            self.notes = f"{self.notes}\n\nCancellation: {reason}" if self.notes else f"Cancellation: {reason}"
        self.save(update_fields=['status', 'notes'])


class PrescriptionRefill(UUIDModel, TimeStampedModel):
    """
    Prescription refill requests and history.
    """
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
    ]

    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='refill_requests'
    )

    # Request details
    requested_date = models.DateTimeField(default=timezone.now, db_index=True)
    requested_by_patient = models.BooleanField(default=True)

    # Approval
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='requested',
        db_index=True
    )
    approved_by = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_refills'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Fill details
    filled_date = models.DateField(null=True, blank=True)
    pharmacy_name = models.CharField(max_length=200, blank=True)
    quantity_filled = models.PositiveIntegerField(null=True, blank=True)

    # Notes
    denial_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-requested_date']
        indexes = [
            models.Index(fields=['prescription', 'status']),
            models.Index(fields=['status', 'requested_date']),
        ]
        verbose_name = 'Prescription Refill'
        verbose_name_plural = 'Prescription Refills'

    def __str__(self):
        return f"Refill for {self.prescription} - {self.get_status_display()}"

    def approve(self, doctor):
        """Approve refill request."""
        self.status = 'approved'
        self.approved_by = doctor
        self.approved_at = timezone.now()
        self.save(update_fields=['status', 'approved_by', 'approved_at'])

    def deny(self, doctor, reason=""):
        """Deny refill request."""
        self.status = 'denied'
        self.approved_by = doctor
        self.approved_at = timezone.now()
        self.denial_reason = reason
        self.save(update_fields=['status', 'approved_by', 'approved_at', 'denial_reason'])

    def mark_as_filled(self, pharmacy_name, quantity):
        """Mark refill as filled."""
        self.status = 'filled'
        self.filled_date = timezone.now().date()
        self.pharmacy_name = pharmacy_name
        self.quantity_filled = quantity
        self.save(update_fields=['status', 'filled_date', 'pharmacy_name', 'quantity_filled'])

        # Update prescription
        self.prescription.fill()
