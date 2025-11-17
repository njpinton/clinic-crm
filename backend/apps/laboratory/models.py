"""
Laboratory models for the Clinic CRM.
Manages lab orders, tests, and results.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class LabTest(UUIDModel, TimeStampedModel):
    """
    Laboratory test catalog.
    Defines available lab tests and their parameters.
    """
    TEST_CATEGORY_CHOICES = [
        ('hematology', 'Hematology'),
        ('chemistry', 'Clinical Chemistry'),
        ('microbiology', 'Microbiology'),
        ('immunology', 'Immunology'),
        ('pathology', 'Pathology'),
        ('radiology', 'Radiology'),
        ('cardiology', 'Cardiology'),
        ('molecular', 'Molecular Diagnostics'),
        ('other', 'Other'),
    ]

    # Test identification
    test_code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Standard test code (e.g., LOINC, CPT)"
    )
    test_name = models.CharField(max_length=200, db_index=True)
    test_category = models.CharField(max_length=20, choices=TEST_CATEGORY_CHOICES)

    # Test details
    description = models.TextField(blank=True)
    specimen_type = models.CharField(
        max_length=100,
        blank=True,
        help_text="Type of specimen required (blood, urine, etc.)"
    )
    preparation_instructions = models.TextField(
        blank=True,
        help_text="Patient preparation instructions (e.g., fasting required)"
    )

    # Normal ranges
    normal_range_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    normal_range_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    unit_of_measure = models.CharField(max_length=50, blank=True)

    # Pricing and timing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Test price in USD"
    )
    turnaround_time_hours = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected time to results in hours"
    )

    # Status
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['test_category', 'test_name']
        indexes = [
            models.Index(fields=['test_code']),
            models.Index(fields=['test_category', 'is_active']),
        ]
        verbose_name = 'Lab Test'
        verbose_name_plural = 'Lab Tests'

    def __str__(self):
        return f"{self.test_code} - {self.test_name}"

    @property
    def normal_range_display(self):
        """Display normal range as string."""
        if self.normal_range_min and self.normal_range_max:
            return f"{self.normal_range_min}-{self.normal_range_max} {self.unit_of_measure}"
        return "N/A"


class LabOrder(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Laboratory test orders.
    Tracks orders from doctors for patient lab work.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ordered', 'Ordered'),
        ('specimen_collected', 'Specimen Collected'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]

    PRIORITY_CHOICES = [
        ('routine', 'Routine'),
        ('urgent', 'Urgent'),
        ('stat', 'STAT'),
    ]

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.PROTECT,
        related_name='lab_orders'
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.PROTECT,
        related_name='lab_orders'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lab_orders'
    )

    # Order details
    order_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique order number"
    )
    order_date = models.DateTimeField(default=timezone.now, db_index=True)

    # Tests ordered (many-to-many)
    tests = models.ManyToManyField(
        LabTest,
        related_name='orders'
    )

    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='routine'
    )

    # Clinical information
    clinical_indication = models.TextField(
        help_text="Clinical reason for ordering tests"
    )
    diagnosis_code = models.CharField(max_length=50, blank=True, help_text="ICD-10 code")

    # Specimen collection
    specimen_collected_at = models.DateTimeField(null=True, blank=True)
    specimen_collected_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='specimen_collections'
    )

    # Processing
    received_by_lab_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Review
    reviewed_by = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_lab_orders'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['patient', 'order_date']),
            models.Index(fields=['doctor', 'order_date']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['order_number']),
        ]
        verbose_name = 'Lab Order'
        verbose_name_plural = 'Lab Orders'

    def __str__(self):
        return f"Lab Order {self.order_number} - {self.patient.full_name}"

    @property
    def is_completed(self):
        """Check if order is completed."""
        return self.status == 'completed'

    @property
    def is_urgent(self):
        """Check if order is urgent or STAT."""
        return self.priority in ['urgent', 'stat']

    def mark_as_collected(self, user):
        """Mark specimen as collected."""
        self.status = 'specimen_collected'
        self.specimen_collected_at = timezone.now()
        self.specimen_collected_by = user
        self.save(update_fields=['status', 'specimen_collected_at', 'specimen_collected_by'])

    def mark_as_completed(self):
        """Mark order as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])


class LabResult(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Laboratory test results.
    Stores individual test results for lab orders.
    """
    RESULT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preliminary', 'Preliminary'),
        ('final', 'Final'),
        ('corrected', 'Corrected'),
        ('cancelled', 'Cancelled'),
    ]

    ABNORMAL_FLAG_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('low', 'Low'),
        ('critical_high', 'Critical High'),
        ('critical_low', 'Critical Low'),
        ('abnormal', 'Abnormal'),
    ]

    # Relationships
    lab_order = models.ForeignKey(
        LabOrder,
        on_delete=models.CASCADE,
        related_name='results'
    )
    lab_test = models.ForeignKey(
        LabTest,
        on_delete=models.PROTECT,
        related_name='results'
    )

    # Result details
    result_date = models.DateTimeField(default=timezone.now)
    result_value = models.CharField(max_length=500, help_text="Test result value")
    result_status = models.CharField(
        max_length=20,
        choices=RESULT_STATUS_CHOICES,
        default='pending'
    )

    # Interpretation
    abnormal_flag = models.CharField(
        max_length=20,
        choices=ABNORMAL_FLAG_CHOICES,
        default='normal',
        db_index=True
    )
    interpretation = models.TextField(blank=True, help_text="Clinical interpretation of result")

    # Reference range for this specific result
    reference_range = models.CharField(
        max_length=200,
        blank=True,
        help_text="Reference range applicable to this result"
    )
    unit = models.CharField(max_length=50, blank=True)

    # Performed by
    performed_by = models.CharField(
        max_length=200,
        blank=True,
        help_text="Lab technician or analyzer"
    )

    # File attachments (e.g., scanned reports, images)
    file_attachment = models.FileField(
        upload_to='lab_results/',
        null=True,
        blank=True
    )

    # Verification
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_lab_results'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-result_date']
        indexes = [
            models.Index(fields=['lab_order', 'lab_test']),
            models.Index(fields=['result_status', 'result_date']),
            models.Index(fields=['abnormal_flag']),
        ]
        verbose_name = 'Lab Result'
        verbose_name_plural = 'Lab Results'
        unique_together = [['lab_order', 'lab_test']]

    def __str__(self):
        return f"{self.lab_test.test_name}: {self.result_value}"

    @property
    def is_abnormal(self):
        """Check if result is abnormal."""
        return self.abnormal_flag != 'normal'

    @property
    def is_critical(self):
        """Check if result is critical."""
        return self.abnormal_flag in ['critical_high', 'critical_low']

    def verify(self, user):
        """Verify the lab result."""
        self.result_status = 'final'
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save(update_fields=['result_status', 'verified_by', 'verified_at'])
