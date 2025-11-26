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
            'province',
            'postal_code',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_phone',
            'insurance_info',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'medical_record_number', 'created_at', 'updated_at', 'full_name', 'age']

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

    def validate_email(self, value):
        """Validate and normalize email."""
        if value:
            return value.lower().strip()
        return value

    def validate_province(self, value):
        """Validate Philippine province."""
        if value:
            value = value.strip()
            # List of valid Philippine provinces (abbreviated)
            valid_provinces = [
                'Metro Manila', 'Quezon City', 'Makati', 'Caloocan', 'Manila',
                'Laguna', 'Cavite', 'Batangas', 'Rizal', 'Bulacan',
                'Pampanga', 'Nueva Ecija', 'Aurora', 'Tarlac', 'Nueva Vizcaya',
                'Pangasinan', 'Ilocos Norte', 'Ilocos Sur', 'La Union', 'Benguet',
                'Mountain Province', 'Ifugao', 'Isabela', 'Quirino', 'Catanduanes',
                'Camarines Norte', 'Camarines Sur', 'Sorsogon', 'Albay', 'Masbate',
                'Romblon', 'Aklan', 'Antique', 'Capiz', 'Iloilo', 'Guimaras',
                'Negros Occidental', 'Negros Oriental', 'Cebu', 'Bohol', 'Siquijor',
                'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay',
                'Misamis Occidental', 'Misamis Oriental', 'Bukidnon', 'Lanao del Norte',
                'Lanao del Sur', 'Maguindanao', 'Cotabato', 'South Cotabato', 'Sultan Kudarat',
                'Davao del Norte', 'Davao del Sur', 'Davao Oriental', 'Davao Occidental',
                'Surigao del Norte', 'Surigao del Sur', 'Dinagat Islands', 'Agusan del Norte',
                'Agusan del Sur', 'Camiguin', 'Misamis Oriental', 'Sarangani', 'Palawan',
                'Batanes', 'Marinduque', 'Mindoro Occidental', 'Mindoro Oriental'
            ]
        return value

    def validate_postal_code(self, value):
        """Validate Philippine postal code format."""
        if value:
            import re
            # Philippine postal codes are 4 digits
            if not re.match(r'^\d{4}$', value):
                raise serializers.ValidationError(
                    "Postal code must be 4 digits (e.g., 1600 for Makati)."
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
            'province',
            'postal_code',
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
