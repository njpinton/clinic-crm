'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctors, Doctor } from '@/lib/api/doctors';
import { createAppointment, AppointmentCreatePayload, AppointmentType } from '@/lib/api/appointments';
import { Patient } from '@/types/patient';
import { PatientSearch } from '@/components/appointments/PatientSearch';
import { QuickCreatePatientModal } from '@/components/appointments/QuickCreatePatientModal';

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);

  // Pre-fill patient_id from URL if available
  const initialPatientId = searchParams.get('patient_id') || '';

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    initialPatientId ? { id: initialPatientId } as Patient : null
  );
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;

      try {
        setIsLoading(true);
        const doctorsData = await getDoctors({ token: accessToken });
        setDoctors(doctorsData.results || []);
      } catch (err) {
        console.error('Error loading doctors:', err);
        setError('Failed to load doctors list. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!selectedPatient?.id || !selectedDoctor || !dateTime) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: AppointmentCreatePayload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor,
        dateTime: new Date(dateTime).toISOString(),
        type: type,
        duration: Number(duration),
        notes: notes,
        reminderEnabled: true
      };

      await createAppointment(payload, accessToken);
      router.push('/appointments');
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowCreatePatientModal(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="text-gray-600">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Appointment</h1>
        <p className="text-gray-600 mt-2">Create a new appointment for a patient.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <PatientSearch
              token={accessToken || ''}
              onPatientSelected={setSelectedPatient}
              onCreateNewClick={() => setShowCreatePatientModal(true)}
              disabled={!accessToken}
            />
            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  Selected: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> (MRN: {selectedPatient.medical_record_number})
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">Doctor <span className="text-red-500">*</span></label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="">Select a doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">Date & Time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                id="datetime"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Appointment Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AppointmentType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="check-up">Check-up</option>
              <option value="lab-work">Lab Work</option>
              <option value="procedure">Procedure</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Reason for Visit / Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Create Patient Modal */}
      <QuickCreatePatientModal
        isOpen={showCreatePatientModal}
        token={accessToken || ''}
        onClose={() => setShowCreatePatientModal(false)}
        onPatientCreated={handlePatientCreated}
      />
    </div>
  );
}