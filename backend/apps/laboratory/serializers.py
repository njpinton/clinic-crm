"""
Laboratory serializers for the Clinic CRM.
"""
from rest_framework import serializers
from .models import LabTest, LabOrder, LabResult


class LabTestSerializer(serializers.ModelSerializer):
    """Serializer for lab tests."""
    normal_range_display = serializers.CharField(read_only=True)

    class Meta:
        model = LabTest
        fields = '__all__'
        read_only_fields = ['id', 'normal_range_display', 'created_at', 'updated_at']


class LabResultSerializer(serializers.ModelSerializer):
    """Serializer for lab results."""
    lab_test_name = serializers.CharField(source='lab_test.test_name', read_only=True)
    abnormal_flag_display = serializers.CharField(source='get_abnormal_flag_display', read_only=True)
    is_abnormal = serializers.BooleanField(read_only=True)
    is_critical = serializers.BooleanField(read_only=True)

    class Meta:
        model = LabResult
        fields = '__all__'
        read_only_fields = [
            'id', 'lab_test_name', 'abnormal_flag_display',
            'is_abnormal', 'is_critical', 'verified_at',
            'created_at', 'updated_at', 'deleted_at'
        ]


class LabOrderSerializer(serializers.ModelSerializer):
    """Serializer for lab orders."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_urgent = serializers.BooleanField(read_only=True)
    tests_list = LabTestSerializer(source='tests', many=True, read_only=True)
    results = LabResultSerializer(many=True, read_only=True)
    test_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=LabTest.objects.all(),
        write_only=True,
        source='tests'
    )

    class Meta:
        model = LabOrder
        fields = '__all__'
        read_only_fields = [
            'id', 'patient_name', 'doctor_name', 'status_display',
            'priority_display', 'is_completed', 'is_urgent',
            'specimen_collected_at', 'received_by_lab_at',
            'completed_at', 'reviewed_at',
            'created_at', 'updated_at', 'deleted_at'
        ]

    def validate_order_number(self, value):
        """Validate order number is unique."""
        if self.instance is None:
            if LabOrder.objects.filter(order_number=value).exists():
                raise serializers.ValidationError("Order number already exists.")
        return value
