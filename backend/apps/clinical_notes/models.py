"""
Clinical Notes models for the Clinic CRM.
Manages clinical documentation including SOAP notes and progress notes.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import UUIDModel, TimeStampedModel, SoftDeleteModel


class ClinicalNote(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Base clinical note model.
    Records clinical encounters and documentation.
    """
    NOTE_TYPE_CHOICES = [
        ('soap', 'SOAP Note'),
        ('progress', 'Progress Note'),
        ('consultation', 'Consultation Note'),
        ('admission', 'Admission Note'),
        ('discharge', 'Discharge Summary'),
        ('procedure', 'Procedure Note'),
        ('operative', 'Operative Note'),
        ('followup', 'Follow-up Note'),
    ]

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.PROTECT,
        related_name='clinical_notes'
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.PROTECT,
        related_name='clinical_notes'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clinical_notes'
    )

    # Note details
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, db_index=True)
    note_date = models.DateTimeField(default=timezone.now, db_index=True)

    # Chief complaint
    chief_complaint = models.TextField(help_text="Patient's main reason for visit")

    # Clinical content (can be overridden by subclasses)
    content = models.TextField(help_text="Main clinical note content")

    # Diagnosis and treatment
    diagnosis = models.TextField(blank=True, help_text="Primary and differential diagnoses")
    treatment_plan = models.TextField(blank=True, help_text="Treatment and management plan")

    # Follow-up
    follow_up_instructions = models.TextField(
        blank=True,
        help_text="Instructions for patient follow-up"
    )
    follow_up_date = models.DateField(null=True, blank=True)

    # Signature and verification
    is_signed = models.BooleanField(default=False)
    signed_at = models.DateTimeField(null=True, blank=True)
    signed_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='signed_notes'
    )

    # Attachments
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="List of attached file URLs or references"
    )

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-note_date']
        indexes = [
            models.Index(fields=['patient', 'note_date']),
            models.Index(fields=['doctor', 'note_date']),
            models.Index(fields=['note_type', 'note_date']),
        ]
        verbose_name = 'Clinical Note'
        verbose_name_plural = 'Clinical Notes'

    def __str__(self):
        return f"{self.get_note_type_display()} - {self.patient.full_name} ({self.note_date.date()})"

    def sign(self, user):
        """Sign the clinical note."""
        self.is_signed = True
        self.signed_at = timezone.now()
        self.signed_by = user
        self.save(update_fields=['is_signed', 'signed_at', 'signed_by'])


class SOAPNote(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    SOAP (Subjective, Objective, Assessment, Plan) Note.
    Standard format for clinical documentation.
    """
    # Link to base clinical note
    clinical_note = models.OneToOneField(
        ClinicalNote,
        on_delete=models.CASCADE,
        related_name='soap_details'
    )

    # SOAP components
    subjective = models.TextField(
        help_text="Patient's subjective description of their condition"
    )
    objective = models.TextField(
        help_text="Objective findings: vital signs, physical exam, lab results"
    )
    assessment = models.TextField(
        help_text="Clinical assessment and diagnosis"
    )
    plan = models.TextField(
        help_text="Treatment plan and next steps"
    )

    # Vital signs (common objective data)
    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Temperature in Fahrenheit"
    )
    blood_pressure_systolic = models.PositiveIntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True)
    heart_rate = models.PositiveIntegerField(null=True, blank=True, help_text="BPM")
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True, help_text="Breaths per minute")
    oxygen_saturation = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="SpO2 percentage"
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weight in pounds"
    )
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Height in inches"
    )

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'SOAP Note'
        verbose_name_plural = 'SOAP Notes'

    def __str__(self):
        return f"SOAP Note - {self.clinical_note.patient.full_name}"

    @property
    def bmi(self):
        """Calculate Body Mass Index."""
        if self.weight and self.height:
            # BMI = (weight in pounds / (height in inches)^2) * 703
            return round((float(self.weight) / (float(self.height) ** 2)) * 703, 1)
        return None

    @property
    def blood_pressure(self):
        """Return blood pressure as string (e.g., '120/80')."""
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}"
        return None


class ProgressNote(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Progress notes for ongoing patient care.
    Documents patient progress and updates.
    """
    # Link to base clinical note
    clinical_note = models.OneToOneField(
        ClinicalNote,
        on_delete=models.CASCADE,
        related_name='progress_details'
    )

    # Progress tracking
    current_status = models.TextField(help_text="Patient's current condition and status")
    progress_since_last_visit = models.TextField(
        blank=True,
        help_text="Changes since last visit"
    )
    symptoms_update = models.TextField(blank=True, help_text="Update on symptoms")

    # Treatment review
    medications_review = models.TextField(
        blank=True,
        help_text="Review of current medications and effectiveness"
    )
    treatment_effectiveness = models.TextField(
        blank=True,
        help_text="How well is the treatment working"
    )

    # Plan updates
    plan_modifications = models.TextField(
        blank=True,
        help_text="Any changes to the treatment plan"
    )
    next_steps = models.TextField(blank=True, help_text="Next steps in care")

    # Goals
    treatment_goals = models.TextField(blank=True, help_text="Treatment goals and milestones")
    goals_achieved = models.TextField(blank=True, help_text="Goals that have been achieved")

    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Progress Note'
        verbose_name_plural = 'Progress Notes'

    def __str__(self):
        return f"Progress Note - {self.clinical_note.patient.full_name}"


class ClinicalNoteTemplate(UUIDModel, TimeStampedModel):
    """
    Templates for clinical notes.
    Helps doctors quickly create standardized notes.
    """
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)

    note_type = models.CharField(
        max_length=20,
        choices=ClinicalNote.NOTE_TYPE_CHOICES,
        db_index=True
    )

    # Template content (using placeholders)
    template_content = models.TextField(
        help_text="Template with placeholders like {{patient_name}}, {{date}}, etc."
    )

    # Specific to doctor or system-wide
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='note_templates'
    )
    is_system_template = models.BooleanField(
        default=False,
        help_text="Whether this is a system-wide template"
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Clinical Note Template'
        verbose_name_plural = 'Clinical Note Templates'

    def __str__(self):
        return f"{self.name} ({self.get_note_type_display()})"


class TriageAssessment(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Triage assessment performed by a nurse before the doctor encounter.
    Records vital signs and initial assessment.
    """
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='triage_assessment'
    )
    
    performed_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='performed_triages'
    )
    
    chief_complaint = models.TextField(help_text="Patient's stated reason for visit")
    
    # Vital Signs
    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Temperature in Celsius"
    )
    blood_pressure_systolic = models.PositiveIntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True)
    heart_rate = models.PositiveIntegerField(null=True, blank=True, help_text="BPM")
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True, help_text="Breaths per minute")
    oxygen_saturation = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="SpO2 percentage"
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weight in kg"
    )
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Height in cm"
    )
    
    notes = models.TextField(blank=True, help_text="Nurse's observations")
    
    # Managers
    from apps.core.models import SoftDeleteManager, AllObjectsManager
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Triage Assessment'
        verbose_name_plural = 'Triage Assessments'

    def __str__(self):
        return f"Triage for {self.appointment}"