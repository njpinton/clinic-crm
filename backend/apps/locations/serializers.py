"""
Serializers for PSGC Location data.
Provides hierarchical serialization of Philippine geographic data.
"""
from rest_framework import serializers
from .models import PSGCRegion, PSGCProvince, PSGCMunicipality, PSGCBarangay


class PSGCBarangaySerializer(serializers.ModelSerializer):
    """Serializer for PSGC Barangay model."""

    class Meta:
        model = PSGCBarangay
        fields = [
            'id',
            'psgc_id',
            'name',
            'municipality',
            'correspondence_code',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PSGCBarangayListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing barangays."""

    class Meta:
        model = PSGCBarangay
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
        ]


class PSGCMunicipalitySerializer(serializers.ModelSerializer):
    """Serializer for PSGC Municipality model."""
    barangay_count = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = PSGCMunicipality
        fields = [
            'id',
            'psgc_id',
            'name',
            'province',
            'correspondence_code',
            'is_city',
            'type',
            'barangay_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_barangay_count(self, obj):
        """Return the number of barangays in this municipality."""
        return obj.barangays.count()

    def get_type(self, obj):
        """Return 'City' or 'Municipality'."""
        return 'City' if obj.is_city else 'Municipality'


class PSGCMunicipalityListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing municipalities."""
    type = serializers.SerializerMethodField()

    class Meta:
        model = PSGCMunicipality
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
            'is_city',
            'type',
        ]

    def get_type(self, obj):
        """Return 'City' or 'Municipality'."""
        return 'City' if obj.is_city else 'Municipality'


class PSGCMunicipalityDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for municipality with nested barangays."""
    barangays = PSGCBarangayListSerializer(many=True, read_only=True)
    type = serializers.SerializerMethodField()
    province_name = serializers.CharField(source='province.name', read_only=True)

    class Meta:
        model = PSGCMunicipality
        fields = [
            'id',
            'psgc_id',
            'name',
            'province',
            'province_name',
            'correspondence_code',
            'is_city',
            'type',
            'barangays',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_type(self, obj):
        """Return 'City' or 'Municipality'."""
        return 'City' if obj.is_city else 'Municipality'


class PSGCProvinceSerializer(serializers.ModelSerializer):
    """Serializer for PSGC Province model."""
    municipality_count = serializers.SerializerMethodField()
    city_count = serializers.SerializerMethodField()

    class Meta:
        model = PSGCProvince
        fields = [
            'id',
            'psgc_id',
            'name',
            'region',
            'correspondence_code',
            'municipality_count',
            'city_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_municipality_count(self, obj):
        """Return the number of municipalities in this province."""
        return obj.municipalities.filter(is_city=False).count()

    def get_city_count(self, obj):
        """Return the number of cities in this province."""
        return obj.municipalities.filter(is_city=True).count()


class PSGCProvinceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing provinces."""

    class Meta:
        model = PSGCProvince
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
        ]


class PSGCProvinceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for province with nested municipalities."""
    municipalities = PSGCMunicipalityListSerializer(many=True, read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)

    class Meta:
        model = PSGCProvince
        fields = [
            'id',
            'psgc_id',
            'name',
            'region',
            'region_name',
            'correspondence_code',
            'municipalities',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PSGCRegionSerializer(serializers.ModelSerializer):
    """Serializer for PSGC Region model."""
    province_count = serializers.SerializerMethodField()

    class Meta:
        model = PSGCRegion
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
            'province_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_province_count(self, obj):
        """Return the number of provinces in this region."""
        return obj.provinces.count()


class PSGCRegionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing regions."""

    class Meta:
        model = PSGCRegion
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
        ]


class PSGCRegionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for region with nested provinces."""
    provinces = PSGCProvinceListSerializer(many=True, read_only=True)

    class Meta:
        model = PSGCRegion
        fields = [
            'id',
            'psgc_id',
            'name',
            'correspondence_code',
            'provinces',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
