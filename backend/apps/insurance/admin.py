"""
Django admin configuration for insurance app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import InsuranceProvider, InsurancePlan, PatientInsurance, InsuranceClaim


@admin.register(InsuranceProvider)
class InsuranceProviderAdmin(admin.ModelAdmin):
    """Admin for insurance providers."""
    list_display = ['company_name', 'payer_id', 'phone', 'is_active']
    list_filter = ['is_active', 'accepts_assignment']
    search_fields = ['company_name', 'payer_id']
    ordering = ['company_name']


@admin.register(InsurancePlan)
class InsurancePlanAdmin(admin.ModelAdmin):
    """Admin for insurance plans."""
    list_display = ['plan_name', 'provider', 'plan_type', 'is_active']
    list_filter = ['plan_type', 'is_active', 'provider']
    search_fields = ['plan_name', 'plan_number']
    ordering = ['provider__company_name', 'plan_name']


@admin.register(PatientInsurance)
class PatientInsuranceAdmin(admin.ModelAdmin):
    """Admin for patient insurance."""
    list_display = ['patient', 'insurance_plan', 'priority', 'is_active', 'coverage_status', 'verification_status']
    list_filter = ['priority', 'is_active', 'last_verified_date']
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'policy_number']
    ordering = ['patient', 'priority']

    def coverage_status(self, obj):
        if obj.is_coverage_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    coverage_status.short_description = 'Coverage'

    def verification_status(self, obj):
        if obj.needs_verification:
            return format_html('<span style="color: orange;">⚠ Needs Verification</span>')
        return format_html('<span style="color: green;">✓ Verified</span>')
    verification_status.short_description = 'Verification'


@admin.register(InsuranceClaim)
class InsuranceClaimAdmin(admin.ModelAdmin):
    """Admin for insurance claims."""
    list_display = ['claim_number', 'patient_name', 'service_date', 'billed_amount', 'status_badge', 'submission_date']
    list_filter = ['status', 'service_date', 'submission_date']
    search_fields = ['claim_number', 'patient_insurance__patient__user__first_name', 'patient_insurance__patient__user__last_name']
    ordering = ['-service_date']
    date_hierarchy = 'service_date'

    def patient_name(self, obj):
        return obj.patient_insurance.patient.full_name
    patient_name.short_description = 'Patient'

    def status_badge(self, obj):
        colors = {
            'draft': '#6C757D',
            'submitted': '#17A2B8',
            'pending': '#FFA500',
            'accepted': '#28A745',
            'rejected': '#DC3545',
            'paid': '#28A745',
            'appealed': '#FFC107',
            'denied': '#DC3545',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
