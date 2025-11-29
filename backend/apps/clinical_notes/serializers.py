"""
Serializers for Clinical Notes.
Handles serialization/deserialization of clinical notes, SOAP notes, and progress notes.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import ClinicalNote, SOAPNote, ProgressNote, ClinicalNoteTemplate, TriageAssessment
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorListSerializer
from apps.users.serializers import UserListSerializer


class SOAPNoteSerializer(serializers.ModelSerializer):
    """Serializer for SOAP (Subjective, Objective, Assessment, Plan) notes."""

    bmi = serializers.SerializerMethodField(read_only=True)
    blood_pressure = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SOAPNote
        fields = [
            'id',
            'subjective',
            'objective',
            'assessment',
            'plan',
            'temperature',
            'blood_pressure_systolic',
            'blood_pressure_diastolic',
            'blood_pressure',
            'heart_rate',
            'respiratory_rate',
            'oxygen_saturation',
            'weight',
            'height',
            'bmi',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'bmi', 'blood_pressure']

    def get_bmi(self, obj):
        """Get BMI calculation."""
        return obj.bmi

    def get_blood_pressure(self, obj):
        """Get blood pressure as formatted string."""
        return obj.blood_pressure


class ProgressNoteSerializer(serializers.ModelSerializer):
    """Serializer for Progress notes."""

    class Meta:
        model = ProgressNote
        fields = [
            'id',
            'current_status',
            'progress_since_last_visit',
            'symptoms_update',
            'medications_review',
            'treatment_effectiveness',
            'plan_modifications',
            'next_steps',
            'treatment_goals',
            'goals_achieved',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClinicalNoteDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for clinical notes with nested SOAP/Progress details."""

    patient = PatientSerializer(read_only=True)
    patient_id = serializers.UUIDField(write_only=True)

    doctor = DoctorListSerializer(read_only=True)
    doctor_id = serializers.UUIDField(write_only=True)

    signed_by = UserListSerializer(read_only=True)

    soap_details = SOAPNoteSerializer(read_only=True)
    progress_details = ProgressNoteSerializer(read_only=True)

    class Meta:
        model = ClinicalNote
        fields = [
            'id',
            'patient',
            'patient_id',
            'doctor',
            'doctor_id',
            'appointment_id',
            'note_type',
            'note_date',
            'chief_complaint',
            'content',
            'diagnosis',
            'treatment_plan',
            'follow_up_instructions',
            'follow_up_date',
            'is_signed',
            'signed_at',
            'signed_by',
            'attachments',
            'soap_details',
            'progress_details',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'signed_at',
            'signed_by',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        """Create a clinical note with related SOAP/Progress details if provided."""
        patient_id = validated_data.pop('patient_id')
        doctor_id = validated_data.pop('doctor_id')

        # Set patient and doctor
        from apps.patients.models import Patient
        from apps.doctors.models import Doctor

        validated_data['patient'] = Patient.objects.get(id=patient_id)
        validated_data['doctor'] = Doctor.objects.get(id=doctor_id)

        # Set default note_date to current time if not provided
        if 'note_date' not in validated_data:
            validated_data['note_date'] = timezone.now()

        clinical_note = ClinicalNote.objects.create(**validated_data)
        return clinical_note


class ClinicalNoteListSerializer(serializers.ModelSerializer):
    """List serializer for clinical notes (lighter weight)."""

    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    note_type_display = serializers.CharField(source='get_note_type_display', read_only=True)

    class Meta:
        model = ClinicalNote
        fields = [
            'id',
            'patient_name',
            'doctor_name',
            'note_type',
            'note_type_display',
            'note_date',
            'chief_complaint',
            'is_signed',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'patient_name',
            'doctor_name',
            'note_type',
            'note_type_display',
            'note_date',
            'chief_complaint',
            'is_signed',
            'created_at',
        ]


class ClinicalNoteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating clinical notes."""

    patient_id = serializers.UUIDField()
    doctor_id = serializers.UUIDField()

    class Meta:
        model = ClinicalNote
        fields = [
            'patient_id',
            'doctor_id',
            'appointment_id',
            'note_type',
            'note_date',
            'chief_complaint',
            'content',
            'diagnosis',
            'treatment_plan',
            'follow_up_instructions',
            'follow_up_date',
            'attachments',
        ]

    def validate_note_date(self, value):
        """Ensure note date is not in the future."""
        if value > timezone.now():
            raise serializers.ValidationError("Note date cannot be in the future.")
        return value

    def validate_patient_id(self, value):
        """Validate patient exists."""
        from apps.patients.models import Patient
        try:
            Patient.objects.get(id=value)
        except Patient.DoesNotExist:
            raise serializers.ValidationError("Patient not found.")
        return value

    def validate_doctor_id(self, value):
        """Validate doctor exists."""
        from apps.doctors.models import Doctor
        try:
            Doctor.objects.get(id=value)
        except Doctor.DoesNotExist:
            raise serializers.ValidationError("Doctor not found.")
        return value

    def create(self, validated_data):
        """Create a clinical note."""
        from apps.patients.models import Patient
        from apps.doctors.models import Doctor

        patient_id = validated_data.pop('patient_id')
        doctor_id = validated_data.pop('doctor_id')

        patient = Patient.objects.get(id=patient_id)
        doctor = Doctor.objects.get(id=doctor_id)

        validated_data['patient'] = patient
        validated_data['doctor'] = doctor

        # Set default note_date to current time if not provided
        if 'note_date' not in validated_data:
            validated_data['note_date'] = timezone.now()

        return ClinicalNote.objects.create(**validated_data)


class ClinicalNoteTemplateSerializer(serializers.ModelSerializer):
    """Serializer for clinical note templates."""

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    note_type_display = serializers.CharField(source='get_note_type_display', read_only=True)

    class Meta:
        model = ClinicalNoteTemplate
        fields = [
            'id',
            'name',
            'description',
            'note_type',
            'note_type_display',
            'template_content',
            'created_by',
            'created_by_name',
            'is_system_template',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'created_by_name']


class TriageAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Triage Assessments."""
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = TriageAssessment
        fields = [
            'id', 'appointment', 'performed_by', 'performed_by_name',
            'chief_complaint', 'temperature', 'blood_pressure_systolic',
            'blood_pressure_diastolic', 'heart_rate', 'respiratory_rate',
            'oxygen_saturation', 'weight', 'height', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['performed_by', 'created_at', 'updated_at']
