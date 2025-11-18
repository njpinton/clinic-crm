"""
Django admin configuration for laboratory app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import LabTest, LabOrder, LabResult


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    """Admin for lab tests."""
    list_display = ['test_code', 'test_name', 'test_category', 'normal_range_display', 'price', 'is_active']
    list_filter = ['test_category', 'is_active']
    search_fields = ['test_code', 'test_name']
    ordering = ['test_category', 'test_name']


@admin.register(LabOrder)
class LabOrderAdmin(admin.ModelAdmin):
    """Admin for lab orders."""
    list_display = ['order_number', 'patient_name', 'doctor_name', 'order_date', 'status_badge', 'priority']
    list_filter = ['status', 'priority', 'order_date']
    search_fields = ['order_number', 'patient__user__first_name', 'patient__user__last_name']
    ordering = ['-order_date']
    filter_horizontal = ['tests']

    def patient_name(self, obj):
        return obj.patient.full_name
    patient_name.short_description = 'Patient'

    def doctor_name(self, obj):
        return obj.doctor.full_name
    doctor_name.short_description = 'Doctor'

    def status_badge(self, obj):
        colors = {
            'pending': '#6C757D',
            'ordered': '#17A2B8',
            'specimen_collected': '#FFC107',
            'in_progress': '#FFA500',
            'completed': '#28A745',
            'cancelled': '#DC3545',
            'on_hold': '#6C757D',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    """Admin for lab results."""
    list_display = ['lab_order', 'lab_test_name', 'result_value', 'abnormal_badge', 'result_status', 'result_date']
    list_filter = ['result_status', 'abnormal_flag', 'result_date']
    search_fields = ['lab_order__order_number', 'lab_test__test_name']
    ordering = ['-result_date']

    def lab_test_name(self, obj):
        return obj.lab_test.test_name
    lab_test_name.short_description = 'Test'

    def abnormal_badge(self, obj):
        colors = {
            'normal': '#28A745',
            'high': '#FFA500',
            'low': '#FFA500',
            'critical_high': '#DC3545',
            'critical_low': '#DC3545',
            'abnormal': '#FFC107',
        }
        color = colors.get(obj.abnormal_flag, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_abnormal_flag_display()
        )
    abnormal_badge.short_description = 'Flag'
