"""
Patient serializers for API endpoints.
Handles validation and data transformation for patient records.
"""
from rest_framework import serializers
from datetime import date
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient model.
    Includes validation for all fields and computed properties.
    """
    # Read-only computed fields
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            'id',
            'medical_record_number',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'date_of_birth',
            'age',
            'gender',
            'phone',
            'email',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'zip_code',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_phone',
            'insurance_info',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age']

    def validate_date_of_birth(self, value):
        """Validate that date of birth is not in the future and patient is 18+."""
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")

        # Calculate age accurately
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))

        # Check if patient is not too old (reasonable limit)
        if age > 150:
            raise serializers.ValidationError("Please check the date of birth. Age cannot exceed 150 years.")

        # HIPAA/Legal: Patients must be 18+ (adults only)
        if age < 18:
            raise serializers.ValidationError("Patient must be at least 18 years old.")

        return value

    def validate_medical_record_number(self, value):
        """Validate medical record number format."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Medical record number is required.")

        # Check for uniqueness on create
        if not self.instance:  # Creating new patient
            if Patient.objects.filter(medical_record_number=value).exists():
                raise serializers.ValidationError(
                    f"Patient with medical record number {value} already exists."
                )

        return value.strip().upper()

    def validate_email(self, value):
        """Validate and normalize email."""
        if value:
            return value.lower().strip()
        return value

    def validate_state(self, value):
        """Validate US state code."""
        if value:
            value = value.upper().strip()
            if len(value) != 2:
                raise serializers.ValidationError("State must be a 2-letter code.")
        return value

    def validate_zip_code(self, value):
        """Validate US ZIP code format."""
        if value:
            import re
            # Accept formats: 12345 or 12345-6789
            if not re.match(r'^\d{5}(-\d{4})?$', value):
                raise serializers.ValidationError(
                    "ZIP code must be in format 12345 or 12345-6789."
                )
        return value


class PatientListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing patients.
    Excludes sensitive information for performance.
    """
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            'id',
            'medical_record_number',
            'full_name',
            'date_of_birth',
            'age',
            'gender',
            'phone',
            'email',
        ]


class PatientCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new patients.
    Includes all required fields with strict validation.
    """
    class Meta:
        model = Patient
        fields = [
            'medical_record_number',
            'first_name',
            'middle_name',
            'last_name',
            'date_of_birth',
            'gender',
            'phone',
            'email',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'zip_code',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_phone',
            'insurance_info',
        ]

    def validate(self, data):
        """Cross-field validation."""
        # Ensure required fields are present
        required_fields = ['medical_record_number', 'first_name', 'last_name', 'date_of_birth']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: f"{field} is required."})

        return data
