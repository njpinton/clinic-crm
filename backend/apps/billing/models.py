"""
Billing models for the Clinic CRM.
Manages invoices, payments, and financial transactions.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel

class Invoice(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Invoice for patient services.
    Linked to an appointment (visit).
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('partially_paid', 'Partially Paid'),
    ]

    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices'
    )
    
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    notes = models.TextField(blank=True)

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.patient.full_name}"

    def update_totals(self):
        """Recalculate totals based on items and payments."""
        total = sum(item.amount for item in self.items.all())
        paid = sum(payment.amount for payment in self.payments.filter(status='completed'))
        
        self.total_amount = total
        self.paid_amount = paid
        self.balance_due = total - paid
        
        if self.balance_due <= 0 and self.total_amount > 0:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        
        self.save()

class InvoiceItem(UUIDModel, TimeStampedModel):
    """
    Line item for an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.invoice.update_totals()

class Payment(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Payment record for an invoice.
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('insurance', 'Insurance'),
        ('other', 'Other'),
        ('gcash', 'GCash'),
        ('maya', 'Maya'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    reference_number = models.CharField(max_length=100, blank=True, help_text="Transaction ID or Check Number")
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed'
    )
    
    notes = models.TextField(blank=True)
    
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_payments'
    )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.update_totals()
