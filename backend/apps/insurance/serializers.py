"""
Insurance serializers for the Clinic CRM.
"""
from rest_framework import serializers
from .models import InsuranceProvider, InsurancePlan, PatientInsurance, InsuranceClaim


class InsuranceProviderSerializer(serializers.ModelSerializer):
    """Serializer for insurance providers."""
    class Meta:
        model = InsuranceProvider
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class InsurancePlanSerializer(serializers.ModelSerializer):
    """Serializer for insurance plans."""
    provider_name = serializers.CharField(source='provider.company_name', read_only=True)
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)

    class Meta:
        model = InsurancePlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientInsuranceSerializer(serializers.ModelSerializer):
    """Serializer for patient insurance."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    insurance_plan_name = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='insurance_plan.provider.company_name', read_only=True)
    is_coverage_active = serializers.BooleanField(read_only=True)
    needs_verification = serializers.BooleanField(read_only=True)

    class Meta:
        model = PatientInsurance
        fields = '__all__'
        read_only_fields = [
            'id', 'patient_name', 'provider_name',
            'is_coverage_active', 'needs_verification',
            'created_at', 'updated_at', 'deleted_at'
        ]

    def get_insurance_plan_name(self, obj):
        return str(obj.insurance_plan)


class InsuranceClaimSerializer(serializers.ModelSerializer):
    """Serializer for insurance claims."""
    patient_name = serializers.CharField(source='patient_insurance.patient.full_name', read_only=True)
    provider_name = serializers.CharField(source='patient_insurance.insurance_plan.provider.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InsuranceClaim
        fields = '__all__'
        read_only_fields = [
            'id', 'patient_name', 'provider_name', 'status_display',
            'status_updated_at', 'created_at', 'updated_at'
        ]

    def validate_claim_number(self, value):
        """Validate claim number is unique."""
        if self.instance is None:  # Creating new claim
            if InsuranceClaim.objects.filter(claim_number=value).exists():
                raise serializers.ValidationError("Claim number already exists.")
        return value
