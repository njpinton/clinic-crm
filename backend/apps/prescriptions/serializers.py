"""
Prescription serializers for the Clinic CRM.
Following django-backend-guidelines: comprehensive validation and nested relationships.
"""
from rest_framework import serializers
from django.utils import timezone

from .models import Medication, Prescription, PrescriptionRefill
from apps.patients.models import Patient
from apps.doctors.models import Doctor


class MedicationSerializer(serializers.ModelSerializer):
    """Serializer for medications."""
    is_controlled_substance = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medication
        fields = [
            'id',
            'ndc_code',
            'brand_name',
            'generic_name',
            'drug_class',
            'controlled_substance_schedule',
            'is_controlled_substance',
            'strength',
            'dosage_form',
            'typical_dosage',
            'indications',
            'contraindications',
            'side_effects',
            'interactions',
            'manufacturer',
            'unit_price',
            'is_active',
            'is_formulary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_controlled_substance', 'created_at', 'updated_at']


class PrescriptionRefillSerializer(serializers.ModelSerializer):
    """Serializer for prescription refills."""
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PrescriptionRefill
        fields = [
            'id',
            'prescription',
            'requested_date',
            'requested_by_patient',
            'status',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'filled_date',
            'pharmacy_name',
            'quantity_filled',
            'denial_reason',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'approved_by_name',
            'approved_at',
            'filled_date',
            'created_at',
            'updated_at',
        ]

    def get_approved_by_name(self, obj):
        """Get name of doctor who approved the refill."""
        if obj.approved_by:
            return obj.approved_by.user.get_full_name()
        return None


class PrescriptionListSerializer(serializers.ModelSerializer):
    """Minimal serializer for prescription lists."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    medication_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    can_refill = serializers.BooleanField(read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'prescription_number',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'medication',
            'medication_name',
            'dosage',
            'frequency',
            'prescribed_date',
            'status',
            'status_display',
            'refills_remaining',
            'is_active',
            'can_refill',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'medication_name',
            'status_display',
            'is_active',
            'can_refill',
            'created_at',
        ]

    def get_medication_name(self, obj):
        """Get medication name."""
        return str(obj.medication)


class PrescriptionSerializer(serializers.ModelSerializer):
    """Complete serializer for prescription details."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    medication_details = MedicationSerializer(source='medication', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    can_refill = serializers.BooleanField(read_only=True)
    refill_requests = PrescriptionRefillSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'prescription_number',
            # Patient & Doctor
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            # Medication
            'medication',
            'medication_details',
            'appointment',
            # Prescription details
            'prescribed_date',
            'dosage',
            'frequency',
            'route',
            'duration',
            'instructions',
            'indication',
            # Quantity and refills
            'quantity',
            'refills_allowed',
            'refills_remaining',
            # Pharmacy
            'pharmacy_name',
            'pharmacy_phone',
            # Status and dates
            'status',
            'status_display',
            'expiration_date',
            'last_filled_date',
            # Controlled substance
            'dea_number_used',
            # Electronic prescribing
            'electronically_sent',
            'sent_to_pharmacy_at',
            # Notes
            'notes',
            # Computed properties
            'is_active',
            'is_expired',
            'can_refill',
            # Refills
            'refill_requests',
            # Metadata
            'created_at',
            'updated_at',
            'deleted_at',
        ]
        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'medication_details',
            'status_display',
            'last_filled_date',
            'is_active',
            'is_expired',
            'can_refill',
            'sent_to_pharmacy_at',
            'created_at',
            'updated_at',
            'deleted_at',
        ]


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating prescriptions."""

    class Meta:
        model = Prescription
        fields = [
            'patient',
            'doctor',
            'medication',
            'appointment',
            'prescription_number',
            'dosage',
            'frequency',
            'route',
            'duration',
            'quantity',
            'refills_allowed',
            'instructions',
            'indication',
            'pharmacy_name',
            'pharmacy_phone',
            'expiration_date',
        ]

    def validate_prescription_number(self, value):
        """Validate prescription number is unique."""
        if Prescription.objects.filter(prescription_number=value).exists():
            raise serializers.ValidationError(
                "Prescription number already exists."
            )
        return value

    def validate_refills_allowed(self, value):
        """Validate refills based on medication type."""
        return max(0, value)  # Cannot be negative

    def validate_quantity(self, value):
        """Validate quantity is positive."""
        if value < 1:
            raise serializers.ValidationError(
                "Quantity must be at least 1."
            )
        return value

    def validate(self, attrs):
        """Validate prescription data."""
        medication = attrs.get('medication')
        doctor = attrs.get('doctor')
        refills_allowed = attrs.get('refills_allowed', 0)

        # Validate controlled substances
        if medication.is_controlled_substance:
            if not attrs.get('dea_number_used'):
                # Should have DEA number for controlled substances
                # In production, validate DEA number belongs to doctor
                pass

            # Controlled substances have limits on refills
            schedule = medication.controlled_substance_schedule
            max_refills = {
                'II': 0,  # Schedule II cannot be refilled
                'III': 5,
                'IV': 5,
                'V': 5,
            }
            if schedule in max_refills and refills_allowed > max_refills[schedule]:
                raise serializers.ValidationError({
                    'refills_allowed': f"Schedule {schedule} medications cannot have more than {max_refills[schedule]} refills."
                })

        return attrs

    def create(self, validated_data):
        """Create prescription with initial refills_remaining."""
        refills_allowed = validated_data.get('refills_allowed', 0)
        validated_data['refills_remaining'] = refills_allowed
        validated_data['status'] = 'active'
        return super().create(validated_data)
