"""
Doctor serializers for the Clinic CRM.
Following django-backend-guidelines: comprehensive validation and data transformation.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Doctor, Specialization, DoctorCredential, DoctorAvailability

User = get_user_model()


class SpecializationSerializer(serializers.ModelSerializer):
    """Serializer for medical specializations."""

    class Meta:
        model = Specialization
        fields = ['id', 'name', 'description', 'medical_code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorCredentialSerializer(serializers.ModelSerializer):
    """Serializer for doctor credentials and certifications."""

    is_expired = serializers.BooleanField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)

    class Meta:
        model = DoctorCredential
        fields = [
            'id', 'doctor', 'credential_type', 'credential_name',
            'issuing_organization', 'credential_number', 'issue_date',
            'expiry_date', 'is_verified', 'verification_date',
            'document', 'notes', 'is_expired', 'is_expiring_soon',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_expired', 'is_expiring_soon']

    def validate_expiry_date(self, value):
        """Ensure expiry date is after issue date."""
        if value and self.initial_data.get('issue_date'):
            from datetime import datetime
            issue_date = datetime.strptime(self.initial_data['issue_date'], '%Y-%m-%d').date()
            if value < issue_date:
                raise serializers.ValidationError("Expiry date cannot be before issue date")
        return value


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for doctor weekly availability schedule."""

    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor', 'day_of_week', 'day_of_week_display',
            'start_time', 'end_time', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Ensure end time is after start time."""
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError({
                    'end_time': "End time must be after start time"
                })
        return data


class DoctorListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for doctor list views.
    Includes minimal fields for performance.
    """
    full_name = serializers.CharField(read_only=True)
    primary_specialization = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'user_email', 'license_number',
            'primary_specialization', 'is_accepting_patients',
            'consultation_fee'
        ]
        read_only_fields = ['id', 'full_name']

    def get_primary_specialization(self, obj):
        """Get the first specialization name."""
        spec = obj.primary_specialization
        return spec.name if spec else None


class DoctorSerializer(serializers.ModelSerializer):
    """
    Complete doctor serializer with all fields and nested relationships.
    """
    full_name = serializers.CharField(read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    specialization_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Specialization.objects.all(),
        write_only=True,
        source='specializations'
    )
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    user_details = serializers.SerializerMethodField(read_only=True)
    credentials = DoctorCredentialSerializer(many=True, read_only=True)
    availability_schedules = DoctorAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'user_details', 'full_name',
            'license_number', 'npi_number', 'dea_number',
            'specializations', 'specialization_ids',
            'board_certified', 'years_of_experience',
            'consultation_fee', 'is_accepting_patients',
            'bio', 'education', 'languages',
            'credentials', 'availability_schedules',
            'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'full_name', 'user_details', 'credentials',
            'availability_schedules', 'created_at', 'updated_at'
        ]

    def get_user_details(self, obj):
        """Get basic user information."""
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'phone': obj.user.phone,
        }

    def validate_license_number(self, value):
        """Ensure license number is unique."""
        if self.instance and self.instance.license_number == value:
            return value
        if Doctor.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("Doctor with this license number already exists")
        return value

    def validate_npi_number(self, value):
        """Validate NPI number format (10 digits)."""
        if value and not value.isdigit():
            raise serializers.ValidationError("NPI number must contain only digits")
        if value and len(value) != 10:
            raise serializers.ValidationError("NPI number must be exactly 10 digits")
        return value

    def validate_user(self, value):
        """Ensure user has doctor role."""
        if value.role != 'doctor':
            raise serializers.ValidationError("User must have 'doctor' role")
        # Check if user already has doctor profile
        if Doctor.objects.filter(user=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("This user already has a doctor profile")
        return value


class DoctorCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new doctors.
    Includes additional validation for required fields.
    """
    specialization_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Specialization.objects.all(),
        source='specializations',
        required=False
    )

    class Meta:
        model = Doctor
        fields = [
            'user', 'license_number', 'npi_number', 'dea_number',
            'specialization_ids', 'board_certified', 'years_of_experience',
            'consultation_fee', 'is_accepting_patients',
            'bio', 'education', 'languages'
        ]

    def validate(self, data):
        """Additional validation for doctor creation."""
        # Ensure user has doctor role
        if data.get('user') and data['user'].role != 'doctor':
            raise serializers.ValidationError({
                'user': "User must have 'doctor' role"
            })
        return data

    def create(self, validated_data):
        """Create doctor with specializations."""
        specializations = validated_data.pop('specializations', [])
        doctor = Doctor.objects.create(**validated_data)
        if specializations:
            doctor.specializations.set(specializations)
        return doctor
