'use client';

/**
 * Clinical Notes Creation Page
 * Allows doctors to create new clinical notes for patients
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClinicalNote, getNoteTypes, getNoteTypeDisplay, CreateClinicalNoteInput, NoteType, VitalSigns, SOAPNoteDetails, ProgressNoteDetails } from '@/lib/api/clinical-notes';
import { fetchPatients, Patient } from '@/lib/api/patients';
import { fetchDoctors, DoctorListResponse } from '@/lib/api/doctors';
import { VitalSignsForm } from '@/components/clinical-notes/VitalSignsForm';
import { useSession } from 'next-auth/react';

export default function CreateClinicalNotePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateClinicalNoteInput>({
    patient_id: '',
    doctor_id: '',
    note_type: 'soap',
    note_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    content: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_instructions: '',
    follow_up_date: ''
  });

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [soapDetails, setSoapDetails] = useState<Partial<SOAPNoteDetails>>({});
  const [progressDetails, setProgressDetails] = useState<Partial<ProgressNoteDetails>>({});

  // Fetch patients and doctors
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsFetching(true);
        const [patientsRes, doctorsRes] = await Promise.all([
          fetchPatients({ limit: 1000, token: session?.user?.accessToken }),
          fetchDoctors({ limit: 1000, token: session?.user?.accessToken })
        ]);
        setPatients(patientsRes.results);
        setDoctors(doctorsRes.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load patients and doctors';
        setError(errorMessage);
      } finally {
        setIsFetching(false);
      }
    };

    if (session?.user?.accessToken) {
      loadData();
    }
  }, [session]);

  const handleVitalSignChange = (field: keyof VitalSigns, value: number | undefined) => {
    setVitalSigns(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSOAPChange = (field: keyof SOAPNoteDetails, value: string) => {
    setSoapDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProgressChange = (field: keyof ProgressNoteDetails, value: string | boolean) => {
    setProgressDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.doctor_id || !formData.content) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload: CreateClinicalNoteInput = {
        ...formData,
        soap_details: formData.note_type === 'soap' ? { ...vitalSigns, ...soapDetails } : undefined,
        progress_details: formData.note_type === 'progress' ? progressDetails as Partial<ProgressNoteDetails> : undefined
      };

      const note = await createClinicalNote(payload, session?.user?.accessToken);

      // Redirect to the created note
      router.push(`/clinical-notes/${note.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create clinical note';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="text-gray-600">Loading patients and doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Clinical Note</h1>
          <p className="text-gray-600 mt-2">Document patient examination, assessment, and treatment plan</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient and Doctor Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Selection */}
              <div>
                <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  id="patient"
                  value={formData.patient_id}
                  onChange={(e) => handleInputChange('patient_id', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} (MRN: {patient.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  id="doctor"
                  value={formData.doctor_id}
                  onChange={(e) => handleInputChange('doctor_id', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  required
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note Type and Date */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note Type & Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Note Type */}
              <div>
                <label htmlFor="noteType" className="block text-sm font-medium text-gray-700 mb-1">
                  Note Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="noteType"
                  value={formData.note_type}
                  onChange={(e) => handleInputChange('note_type', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  required
                >
                  {getNoteTypes().map(type => (
                    <option key={type} value={type}>
                      {getNoteTypeDisplay(type as NoteType)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Date */}
              <div>
                <label htmlFor="noteDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Note
                </label>
                <input
                  id="noteDate"
                  type="date"
                  value={formData.note_date}
                  onChange={(e) => handleInputChange('note_date', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint
            </label>
            <input
              id="chiefComplaint"
              type="text"
              value={formData.chief_complaint || ''}
              onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
              disabled={isLoading}
              placeholder="e.g., Persistent cough, Chest pain"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          {/* Vital Signs (for SOAP notes) */}
          {formData.note_type === 'soap' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h2>
              <VitalSignsForm values={vitalSigns} onChange={handleVitalSignChange} disabled={isLoading} />
            </div>
          )}

          {/* SOAP Details */}
          {formData.note_type === 'soap' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SOAP Note Details</h2>
              <div className="space-y-4">
                {/* Subjective */}
                <div>
                  <label htmlFor="subjective" className="block text-sm font-medium text-gray-700 mb-2">
                    Subjective (Patient's reported symptoms)
                  </label>
                  <textarea
                    id="subjective"
                    value={soapDetails.subjective || ''}
                    onChange={(e) => handleSOAPChange('subjective', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Objective */}
                <div>
                  <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                    Objective (Exam findings, test results)
                  </label>
                  <textarea
                    id="objective"
                    value={soapDetails.objective || ''}
                    onChange={(e) => handleSOAPChange('objective', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Assessment */}
                <div>
                  <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment (Diagnosis & clinical impression)
                  </label>
                  <textarea
                    id="assessment"
                    value={soapDetails.assessment || ''}
                    onChange={(e) => handleSOAPChange('assessment', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Plan */}
                <div>
                  <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
                    Plan (Treatment & management)
                  </label>
                  <textarea
                    id="plan"
                    value={soapDetails.plan || ''}
                    onChange={(e) => handleSOAPChange('plan', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress Details */}
          {formData.note_type === 'progress' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Note Details</h2>
              <div className="space-y-4">
                {/* Current Status */}
                <div>
                  <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <textarea
                    id="currentStatus"
                    value={progressDetails.current_status || ''}
                    onChange={(e) => handleProgressChange('current_status', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Progress Since Last Visit */}
                <div>
                  <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Since Last Visit
                  </label>
                  <textarea
                    id="progress"
                    value={progressDetails.progress_since_last_visit || ''}
                    onChange={(e) => handleProgressChange('progress_since_last_visit', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Symptoms Update */}
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms Update
                  </label>
                  <textarea
                    id="symptoms"
                    value={progressDetails.symptoms_update || ''}
                    onChange={(e) => handleProgressChange('symptoms_update', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clinical Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Content</h2>
            <div className="space-y-4">
              {/* Main Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  placeholder="Detailed clinical notes, observations, and findings..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  required
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <input
                  id="diagnosis"
                  type="text"
                  value={formData.diagnosis || ''}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  disabled={isLoading}
                  placeholder="Primary and secondary diagnoses"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  id="treatmentPlan"
                  value={formData.treatment_plan || ''}
                  onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Medications, procedures, and interventions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              {/* Follow-up Instructions */}
              <div>
                <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Instructions
                </label>
                <textarea
                  id="followUp"
                  value={formData.follow_up_instructions || ''}
                  onChange={(e) => handleInputChange('follow_up_instructions', e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Patient instructions and next steps"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  id="followUpDate"
                  type="date"
                  value={formData.follow_up_date || ''}
                  onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
