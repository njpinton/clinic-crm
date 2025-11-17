"""
Insurance models for the Clinic CRM.
Manages insurance providers, plans, and patient coverage.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class InsuranceProvider(UUIDModel, TimeStampedModel):
    """
    Insurance companies/providers.
    """
    # Company information
    company_name = models.CharField(max_length=200, unique=True, db_index=True)
    payer_id = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        help_text="Insurance payer ID for claims"
    )

    # Contact information
    phone = models.CharField(max_length=17, blank=True)
    fax = models.CharField(max_length=17, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)

    # Claims submission
    claims_address = models.TextField(blank=True, help_text="Address for claims submission")
    electronic_claims_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID for electronic claims submission"
    )

    # Status
    is_active = models.BooleanField(default=True)
    accepts_assignment = models.BooleanField(
        default=True,
        help_text="Whether provider accepts assignment"
    )

    # Notes
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['company_name']
        verbose_name = 'Insurance Provider'
        verbose_name_plural = 'Insurance Providers'

    def __str__(self):
        return self.company_name


class InsurancePlan(UUIDModel, TimeStampedModel):
    """
    Specific insurance plans offered by providers.
    """
    PLAN_TYPE_CHOICES = [
        ('hmo', 'HMO - Health Maintenance Organization'),
        ('ppo', 'PPO - Preferred Provider Organization'),
        ('epo', 'EPO - Exclusive Provider Organization'),
        ('pos', 'POS - Point of Service'),
        ('medicare', 'Medicare'),
        ('medicaid', 'Medicaid'),
        ('tricare', 'TRICARE'),
        ('other', 'Other'),
    ]

    provider = models.ForeignKey(
        InsuranceProvider,
        on_delete=models.PROTECT,
        related_name='plans'
    )

    # Plan details
    plan_name = models.CharField(max_length=200, db_index=True)
    plan_number = models.CharField(max_length=100, blank=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)

    # Coverage details
    group_number = models.CharField(max_length=100, blank=True)

    # Copay and deductible
    copay_primary_care = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Copay for primary care visits"
    )
    copay_specialist = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Copay for specialist visits"
    )
    copay_emergency = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Copay for emergency room visits"
    )

    annual_deductible = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual deductible amount"
    )
    out_of_pocket_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual out-of-pocket maximum"
    )

    # Coverage percentages
    in_network_coverage = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Percentage covered for in-network providers (0-100)"
    )
    out_of_network_coverage = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Percentage covered for out-of-network providers (0-100)"
    )

    # Status
    is_active = models.BooleanField(default=True)

    # Notes
    coverage_details = models.TextField(blank=True, help_text="Additional coverage details")
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['provider__company_name', 'plan_name']
        indexes = [
            models.Index(fields=['provider', 'is_active']),
        ]
        verbose_name = 'Insurance Plan'
        verbose_name_plural = 'Insurance Plans'
        unique_together = [['provider', 'plan_name']]

    def __str__(self):
        return f"{self.provider.company_name} - {self.plan_name}"


class PatientInsurance(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Patient's insurance coverage.
    Links patients to their insurance plans.
    """
    RELATIONSHIP_CHOICES = [
        ('self', 'Self'),
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('other', 'Other'),
    ]

    # Patient and insurance
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='insurance_coverages'
    )
    insurance_plan = models.ForeignKey(
        InsurancePlan,
        on_delete=models.PROTECT,
        related_name='patient_coverages'
    )

    # Coverage priority
    priority = models.PositiveIntegerField(
        default=1,
        help_text="1 = Primary, 2 = Secondary, etc."
    )

    # Policy holder information
    policy_holder_name = models.CharField(max_length=200)
    policy_holder_relationship = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_CHOICES,
        default='self'
    )
    policy_holder_dob = models.DateField(help_text="Policy holder's date of birth")

    # Policy details
    policy_number = models.CharField(max_length=100, db_index=True)
    group_number = models.CharField(max_length=100, blank=True)
    member_id = models.CharField(max_length=100, blank=True)

    # Coverage dates
    effective_date = models.DateField(db_index=True)
    termination_date = models.DateField(null=True, blank=True)

    # Status
    is_active = models.BooleanField(default=True, db_index=True)

    # Verification
    last_verified_date = models.DateField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=50,
        blank=True,
        help_text="Status from last verification"
    )

    # Card images
    front_card_image = models.ImageField(
        upload_to='insurance_cards/',
        null=True,
        blank=True
    )
    back_card_image = models.ImageField(
        upload_to='insurance_cards/',
        null=True,
        blank=True
    )

    # Notes
    notes = models.TextField(blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['patient', 'priority']
        indexes = [
            models.Index(fields=['patient', 'priority', 'is_active']),
            models.Index(fields=['policy_number']),
            models.Index(fields=['effective_date', 'termination_date']),
        ]
        verbose_name = 'Patient Insurance'
        verbose_name_plural = 'Patient Insurance Coverages'
        unique_together = [['patient', 'priority']]

    def __str__(self):
        priority_text = ['Primary', 'Secondary', 'Tertiary'][self.priority - 1] if self.priority <= 3 else f"{self.priority}th"
        return f"{self.patient.full_name} - {priority_text} - {self.insurance_plan}"

    @property
    def is_coverage_active(self):
        """Check if coverage is currently active."""
        if not self.is_active:
            return False

        today = timezone.now().date()

        if today < self.effective_date:
            return False

        if self.termination_date and today > self.termination_date:
            return False

        return True

    @property
    def needs_verification(self):
        """Check if insurance needs reverification (more than 90 days old)."""
        if not self.last_verified_date:
            return True

        from datetime import timedelta
        return timezone.now().date() - self.last_verified_date > timedelta(days=90)

    def verify(self, status_message=""):
        """Update verification date and status."""
        self.last_verified_date = timezone.now().date()
        self.verification_status = status_message
        self.save(update_fields=['last_verified_date', 'verification_status'])


class InsuranceClaim(UUIDModel, TimeStampedModel):
    """
    Insurance claims for services rendered.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('appealed', 'Appealed'),
        ('denied', 'Denied'),
    ]

    # Relationships
    patient_insurance = models.ForeignKey(
        PatientInsurance,
        on_delete=models.PROTECT,
        related_name='claims'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='insurance_claims'
    )

    # Claim details
    claim_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique claim number"
    )
    service_date = models.DateField(db_index=True)
    submission_date = models.DateField(null=True, blank=True)

    # Diagnosis and procedure codes
    diagnosis_codes = models.JSONField(
        default=list,
        help_text="List of ICD-10 diagnosis codes"
    )
    procedure_codes = models.JSONField(
        default=list,
        help_text="List of CPT/HCPCS procedure codes"
    )

    # Financial
    billed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    allowed_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount allowed by insurance"
    )
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount paid by insurance"
    )
    patient_responsibility = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount patient owes"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    status_updated_at = models.DateTimeField(null=True, blank=True)

    # Response from insurance
    insurance_reference_number = models.CharField(max_length=100, blank=True)
    response_date = models.DateField(null=True, blank=True)
    denial_reason = models.TextField(blank=True)

    # Payment
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)

    # Documents
    claim_form = models.FileField(
        upload_to='insurance_claims/',
        null=True,
        blank=True
    )
    eob_document = models.FileField(
        upload_to='insurance_eob/',
        null=True,
        blank=True,
        help_text="Explanation of Benefits document"
    )

    # Notes
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-service_date']
        indexes = [
            models.Index(fields=['patient_insurance', 'service_date']),
            models.Index(fields=['status', 'submission_date']),
            models.Index(fields=['claim_number']),
        ]
        verbose_name = 'Insurance Claim'
        verbose_name_plural = 'Insurance Claims'

    def __str__(self):
        return f"Claim {self.claim_number} - {self.patient_insurance.patient.full_name}"

    def submit(self):
        """Submit claim to insurance."""
        self.status = 'submitted'
        self.submission_date = timezone.now().date()
        self.status_updated_at = timezone.now()
        self.save(update_fields=['status', 'submission_date', 'status_updated_at'])

    def mark_as_paid(self, paid_amount, payment_reference=""):
        """Mark claim as paid."""
        self.status = 'paid'
        self.paid_amount = paid_amount
        self.payment_date = timezone.now().date()
        self.payment_reference = payment_reference
        self.status_updated_at = timezone.now()
        self.save(update_fields=[
            'status', 'paid_amount', 'payment_date',
            'payment_reference', 'status_updated_at'
        ])
