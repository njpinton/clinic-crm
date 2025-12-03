"""
Django admin configuration for PSGC Locations.
Provides admin interface for managing Philippine geographic data.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import PSGCRegion, PSGCProvince, PSGCMunicipality, PSGCBarangay


@admin.register(PSGCRegion)
class PSGCRegionAdmin(admin.ModelAdmin):
    """Admin interface for Philippine Regions."""
    list_display = ['name', 'psgc_id', 'correspondence_code', 'province_count', 'created_at']
    search_fields = ['name', 'psgc_id', 'correspondence_code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']

    fieldsets = (
        ('Region Information', {
            'fields': ('name', 'psgc_id', 'correspondence_code')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def province_count(self, obj):
        """Display number of provinces in this region."""
        count = obj.provinces.count()
        return format_html(
            '<span style="background-color: #17A2B8; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            count
        )
    province_count.short_description = 'Provinces'


@admin.register(PSGCProvince)
class PSGCProvinceAdmin(admin.ModelAdmin):
    """Admin interface for Philippine Provinces."""
    list_display = ['name', 'region_link', 'psgc_id', 'correspondence_code', 'municipality_count', 'created_at']
    list_filter = ['region']
    search_fields = ['name', 'psgc_id', 'correspondence_code', 'region__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['region__name', 'name']
    autocomplete_fields = ['region']

    fieldsets = (
        ('Province Information', {
            'fields': ('name', 'psgc_id', 'correspondence_code', 'region')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def region_link(self, obj):
        """Display region as a link."""
        if obj.region:
            return format_html(
                '<a href="/admin/locations/psgcregion/{}/change/">{}</a>',
                obj.region.id,
                obj.region.name
            )
        return '-'
    region_link.short_description = 'Region'
    region_link.admin_order_field = 'region__name'

    def municipality_count(self, obj):
        """Display number of municipalities in this province."""
        count = obj.municipalities.count()
        return format_html(
            '<span style="background-color: #28A745; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            count
        )
    municipality_count.short_description = 'Municipalities'


@admin.register(PSGCMunicipality)
class PSGCMunicipalityAdmin(admin.ModelAdmin):
    """Admin interface for Philippine Cities and Municipalities."""
    list_display = ['name', 'type_badge', 'province_link', 'psgc_id', 'correspondence_code', 'barangay_count', 'created_at']
    list_filter = ['is_city', 'province__region', 'province']
    search_fields = ['name', 'psgc_id', 'correspondence_code', 'province__name', 'province__region__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['province__region__name', 'province__name', 'name']
    autocomplete_fields = ['province']

    fieldsets = (
        ('Municipality Information', {
            'fields': ('name', 'psgc_id', 'correspondence_code', 'province', 'is_city')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def type_badge(self, obj):
        """Display city/municipality badge."""
        if obj.is_city:
            return format_html(
                '<span style="background-color: #FFC107; color: #000; padding: 2px 8px; '
                'border-radius: 3px; font-weight: bold;">City</span>'
            )
        return format_html(
            '<span style="background-color: #6C757D; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-weight: bold;">Municipality</span>'
        )
    type_badge.short_description = 'Type'
    type_badge.admin_order_field = 'is_city'

    def province_link(self, obj):
        """Display province as a link."""
        if obj.province:
            return format_html(
                '<a href="/admin/locations/psgcprovince/{}/change/">{}</a>',
                obj.province.id,
                obj.province.name
            )
        return '-'
    province_link.short_description = 'Province'
    province_link.admin_order_field = 'province__name'

    def barangay_count(self, obj):
        """Display number of barangays in this municipality."""
        count = obj.barangays.count()
        return format_html(
            '<span style="background-color: #DC3545; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            count
        )
    barangay_count.short_description = 'Barangays'


@admin.register(PSGCBarangay)
class PSGCBarangayAdmin(admin.ModelAdmin):
    """Admin interface for Philippine Barangays."""
    list_display = ['name', 'municipality_link', 'province_name', 'psgc_id', 'correspondence_code', 'created_at']
    list_filter = ['municipality__province__region', 'municipality__province', 'municipality']
    search_fields = ['name', 'psgc_id', 'correspondence_code', 'municipality__name', 'municipality__province__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['municipality__province__region__name', 'municipality__province__name', 'municipality__name', 'name']
    autocomplete_fields = ['municipality']

    fieldsets = (
        ('Barangay Information', {
            'fields': ('name', 'psgc_id', 'correspondence_code', 'municipality')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def municipality_link(self, obj):
        """Display municipality as a link."""
        if obj.municipality:
            return format_html(
                '<a href="/admin/locations/psgcmunicipality/{}/change/">{}</a>',
                obj.municipality.id,
                obj.municipality.name
            )
        return '-'
    municipality_link.short_description = 'Municipality/City'
    municipality_link.admin_order_field = 'municipality__name'

    def province_name(self, obj):
        """Display province name."""
        if obj.municipality and obj.municipality.province:
            return obj.municipality.province.name
        return '-'
    province_name.short_description = 'Province'
    province_name.admin_order_field = 'municipality__province__name'
