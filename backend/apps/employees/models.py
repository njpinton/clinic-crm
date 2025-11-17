"""
Employee models for the Clinic CRM.
Manages employee HR data, departments, and organizational structure.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class Department(UUIDModel, TimeStampedModel):
    """
    Organizational departments within the clinic.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    code = models.CharField(max_length=20, unique=True, blank=True)
    description = models.TextField(blank=True)

    # Department head
    head = models.ForeignKey(
        'Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departments_headed'
    )

    # Contact information
    phone = models.CharField(max_length=17, blank=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=200, blank=True)

    # Budget (optional)
    annual_budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual budget in USD"
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return self.name

    @property
    def employee_count(self):
        """Return number of employees in this department."""
        return self.employees.filter(is_deleted=False, employment_status='active').count()


class Employee(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Employee HR records.
    Links to User model and contains employment details.
    """
    EMPLOYMENT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('suspended', 'Suspended'),
        ('terminated', 'Terminated'),
        ('retired', 'Retired'),
    ]

    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('temporary', 'Temporary'),
        ('intern', 'Intern'),
    ]

    # Link to user account
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )

    # Employee identification
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique employee ID number"
    )

    # Department and position
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='employees'
    )
    position = models.CharField(max_length=100, help_text="Job title")

    # Reporting structure
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )

    # Employment details
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default='full_time'
    )
    employment_status = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_STATUS_CHOICES,
        default='active',
        db_index=True
    )

    # Dates
    hire_date = models.DateField(db_index=True)
    termination_date = models.DateField(null=True, blank=True)
    last_promotion_date = models.DateField(null=True, blank=True)

    # Compensation
    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual salary or hourly rate"
    )
    pay_frequency = models.CharField(
        max_length=20,
        choices=[
            ('hourly', 'Hourly'),
            ('weekly', 'Weekly'),
            ('biweekly', 'Bi-weekly'),
            ('monthly', 'Monthly'),
            ('annually', 'Annually'),
        ],
        default='biweekly'
    )

    # Benefits
    benefits_enrolled = models.JSONField(
        default=list,
        blank=True,
        help_text="List of benefits employee is enrolled in"
    )

    # Work schedule
    work_schedule = models.JSONField(
        default=dict,
        blank=True,
        help_text="Weekly work schedule"
    )
    pto_balance = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text="Paid time off balance in days"
    )

    # Performance
    performance_rating = models.CharField(
        max_length=50,
        blank=True,
        help_text="Latest performance rating"
    )
    last_review_date = models.DateField(null=True, blank=True)

    # Documents
    resume = models.FileField(upload_to='employee_documents/', null=True, blank=True)
    contract = models.FileField(upload_to='employee_documents/', null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True, help_text="Internal HR notes")

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['department', 'employment_status']),
            models.Index(fields=['manager']),
            models.Index(fields=['hire_date']),
        ]
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id}) - {self.position}"

    @property
    def full_name(self):
        """Return employee's full name."""
        return self.user.get_full_name()

    @property
    def years_of_service(self):
        """Calculate years of service."""
        if not self.hire_date:
            return 0

        end_date = self.termination_date or timezone.now().date()
        delta = end_date - self.hire_date
        return round(delta.days / 365.25, 1)

    @property
    def is_active(self):
        """Check if employee is actively employed."""
        return self.employment_status == 'active'

    def terminate(self, termination_date, reason=""):
        """Terminate employment."""
        self.employment_status = 'terminated'
        self.termination_date = termination_date
        if reason:
            self.notes = f"{self.notes}\n\nTermination: {reason}" if self.notes else f"Termination: {reason}"
        self.save(update_fields=['employment_status', 'termination_date', 'notes'])


class EmployeeTimeOff(UUIDModel, TimeStampedModel):
    """
    Employee time off requests and tracking.
    """
    PTO_TYPE_CHOICES = [
        ('vacation', 'Vacation'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Day'),
        ('bereavement', 'Bereavement'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='time_off_requests'
    )

    # Request details
    pto_type = models.CharField(max_length=20, choices=PTO_TYPE_CHOICES)
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    days_requested = models.DecimalField(max_digits=5, decimal_places=2)

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )

    # Approval
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_time_off'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Notes
    reason = models.TextField(blank=True, help_text="Reason for time off")
    denial_reason = models.TextField(blank=True, help_text="Reason for denial if denied")
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['employee', 'start_date']),
            models.Index(fields=['status', 'start_date']),
        ]
        verbose_name = 'Employee Time Off'
        verbose_name_plural = 'Employee Time Off Requests'

    def __str__(self):
        return f"{self.employee.full_name} - {self.get_pto_type_display()} ({self.start_date} to {self.end_date})"

    def approve(self, approver):
        """Approve time off request."""
        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.save(update_fields=['status', 'approved_by', 'approved_at'])

        # Deduct from employee PTO balance
        self.employee.pto_balance -= self.days_requested
        self.employee.save(update_fields=['pto_balance'])

    def deny(self, approver, reason=""):
        """Deny time off request."""
        self.status = 'denied'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.denial_reason = reason
        self.save(update_fields=['status', 'approved_by', 'approved_at', 'denial_reason'])


class EmployeePerformanceReview(UUIDModel, TimeStampedModel):
    """
    Employee performance reviews.
    """
    REVIEW_TYPE_CHOICES = [
        ('annual', 'Annual Review'),
        ('probation', 'Probation Review'),
        ('mid_year', 'Mid-Year Review'),
        ('project', 'Project Review'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='performance_reviews'
    )

    # Review details
    review_type = models.CharField(max_length=20, choices=REVIEW_TYPE_CHOICES)
    review_period_start = models.DateField()
    review_period_end = models.DateField()
    review_date = models.DateField(db_index=True)

    # Reviewer
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='conducted_reviews'
    )

    # Ratings
    overall_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        help_text="Overall rating (1-5 scale)"
    )
    technical_skills_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True
    )
    communication_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True
    )
    teamwork_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True
    )
    leadership_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True
    )

    # Feedback
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    goals = models.TextField(blank=True, help_text="Goals for next review period")
    comments = models.TextField(blank=True)

    # Employee acknowledgment
    employee_acknowledged = models.BooleanField(default=False)
    employee_acknowledged_at = models.DateTimeField(null=True, blank=True)
    employee_comments = models.TextField(blank=True)

    # Document
    review_document = models.FileField(
        upload_to='performance_reviews/',
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-review_date']
        indexes = [
            models.Index(fields=['employee', 'review_date']),
            models.Index(fields=['review_type', 'review_date']),
        ]
        verbose_name = 'Performance Review'
        verbose_name_plural = 'Performance Reviews'

    def __str__(self):
        return f"{self.employee.full_name} - {self.get_review_type_display()} ({self.review_date})"
