"""
Django admin configuration for prescriptions app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Medication, Prescription, PrescriptionRefill


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    """Admin interface for Medication model."""
    list_display = [
        'generic_name',
        'brand_name',
        'strength',
        'dosage_form',
        'drug_class',
        'is_controlled',
        'is_formulary',
        'is_active'
    ]
    list_filter = ['drug_class', 'is_active', 'is_formulary', 'controlled_substance_schedule']
    search_fields = ['brand_name', 'generic_name', 'ndc_code']
    ordering = ['generic_name']

    fieldsets = (
        ('Identification', {
            'fields': ('ndc_code', 'brand_name', 'generic_name')
        }),
        ('Classification', {
            'fields': ('drug_class', 'controlled_substance_schedule')
        }),
        ('Dosage', {
            'fields': ('strength', 'dosage_form', 'typical_dosage')
        }),
        ('Clinical Information', {
            'fields': ('indications', 'contraindications', 'side_effects', 'interactions'),
            'classes': ('collapse',)
        }),
        ('Manufacturer & Pricing', {
            'fields': ('manufacturer', 'unit_price')
        }),
        ('Status', {
            'fields': ('is_active', 'is_formulary')
        }),
    )

    def is_controlled(self, obj):
        """Display if medication is controlled substance."""
        if obj.is_controlled_substance:
            return format_html('<span style="color: red;">✓ Schedule {}</span>', obj.controlled_substance_schedule)
        return '-'
    is_controlled.short_description = 'Controlled'


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    """Admin interface for Prescription model."""
    list_display = [
        'prescription_number',
        'patient_name',
        'doctor_name',
        'medication_name',
        'prescribed_date',
        'status_badge',
        'refills_status',
        'is_active'
    ]
    list_filter = ['status', 'prescribed_date', 'electronically_sent']
    search_fields = [
        'prescription_number',
        'patient__user__first_name',
        'patient__user__last_name',
        'medication__brand_name',
        'medication__generic_name'
    ]
    ordering = ['-prescribed_date']
    date_hierarchy = 'prescribed_date'

    fieldsets = (
        ('Prescription Info', {
            'fields': ('prescription_number', 'patient', 'doctor', 'medication', 'appointment')
        }),
        ('Dosage', {
            'fields': ('dosage', 'frequency', 'route', 'duration', 'quantity')
        }),
        ('Instructions', {
            'fields': ('instructions', 'indication')
        }),
        ('Refills', {
            'fields': ('refills_allowed', 'refills_remaining')
        }),
        ('Pharmacy', {
            'fields': ('pharmacy_name', 'pharmacy_phone')
        }),
        ('Status', {
            'fields': ('status', 'prescribed_date', 'expiration_date', 'last_filled_date')
        }),
        ('Electronic Prescribing', {
            'fields': ('electronically_sent', 'sent_to_pharmacy_at'),
            'classes': ('collapse',)
        }),
    )

    def patient_name(self, obj):
        return obj.patient.full_name
    patient_name.short_description = 'Patient'

    def doctor_name(self, obj):
        return obj.doctor.full_name
    doctor_name.short_description = 'Doctor'

    def medication_name(self, obj):
        return str(obj.medication)
    medication_name.short_description = 'Medication'

    def status_badge(self, obj):
        """Display status with color."""
        colors = {
            'active': '#28A745',
            'completed': '#6C757D',
            'cancelled': '#DC3545',
            'expired': '#FFC107',
            'on_hold': '#17A2B8',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def refills_status(self, obj):
        """Display refills remaining."""
        return f"{obj.refills_remaining}/{obj.refills_allowed}"
    refills_status.short_description = 'Refills'


@admin.register(PrescriptionRefill)
class PrescriptionRefillAdmin(admin.ModelAdmin):
    """Admin interface for PrescriptionRefill model."""
    list_display = [
        'prescription_display',
        'requested_date',
        'status_badge',
        'approved_by',
        'approved_at'
    ]
    list_filter = ['status', 'requested_date', 'approved_at']
    search_fields = [
        'prescription__prescription_number',
        'prescription__patient__user__first_name',
        'prescription__patient__user__last_name'
    ]
    ordering = ['-requested_date']

    def prescription_display(self, obj):
        return f"{obj.prescription.prescription_number} - {obj.prescription.patient.full_name}"
    prescription_display.short_description = 'Prescription'

    def status_badge(self, obj):
        """Display status with color."""
        colors = {
            'requested': '#FFA500',
            'approved': '#28A745',
            'denied': '#DC3545',
            'filled': '#6C757D',
            'cancelled': '#6C757D',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
