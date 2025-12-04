'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAppointments,
  createAppointment,
  getAvailableSlots,
  checkConflict,
  type AppointmentCreatePayload,
  type AppointmentType
} from '@/lib/api/appointments';

const APPOINTMENT_TYPES: AppointmentType[] = [
  'consultation',
  'follow_up',
  'procedure',
  'lab_work',
  'vaccination',
  'physical_exam',
  'emergency',
  'telemedicine',
];

const DURATION_OPTIONS = [15, 30, 45, 60];

interface Doctor {
  id: string;
  full_name: string;
  email: string;
}

interface Patient {
  id: string;
  full_name: string;
  medical_record_number: string;
  email: string;
  phone: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Step management
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Patient selection
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);

  // Step 2: Doctor and date/time
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Step 3: Details
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Step 4: Review and submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients on mount and filter based on search
  useEffect(() => {
    if (step === 1 && user) {
      loadPatients();
    }
  }, [step, user]);

  // Fetch doctors when step 2 is reached
  useEffect(() => {
    if (step === 2 && user) {
      loadDoctors();
    }
  }, [step, user]);

  // Load available slots when doctor and date change
  useEffect(() => {
    if (step === 2 && selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, duration]);

  const loadPatients = async () => {
    try {
      setPatientLoading(true);
      const response = await getAppointments();
      const uniquePatients = new Map<string, Patient>();

      response.results?.forEach((apt) => {
        if (!uniquePatients.has(apt.patient)) {
          uniquePatients.set(apt.patient, {
            id: apt.patient,
            full_name: apt.patient_name,
            medical_record_number: 'MRN',
            email: apt.patient_email,
            phone: apt.patient_phone,
          });
        }
      });

      setPatients(Array.from(uniquePatients.values()));
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setPatientLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      // Fetch from appointments to get doctors (would be better with dedicated doctors endpoint)
      const response = await getAppointments();
      const uniqueDoctors = new Map<string, Doctor>();

      response.results?.forEach((apt) => {
        if (!uniqueDoctors.has(apt.doctor)) {
          uniqueDoctors.set(apt.doctor, {
            id: apt.doctor,
            full_name: apt.doctor_name,
            email: apt.doctor_email,
          });
        }
      });

      setDoctors(Array.from(uniqueDoctors.values()));
    } catch (err) {
      setError('Failed to load doctors');
      console.error(err);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      setError(null);

      const slots = await getAvailableSlots(selectedDoctor, selectedDate, duration);
      setAvailableSlots(slots.map((s) => s.datetime));
    } catch (err) {
      setError('Failed to load available slots');
      console.error(err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      patientSearch === '' ||
      p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleContinue = () => {
    if (step === 1 && !selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (step === 2 && (!selectedDoctor || !selectedDate || !selectedTime)) {
      setError('Please complete all appointment date/time fields');
      return;
    }
    if (step === 3 && !reason.trim()) {
      setError('Please enter a reason for visit');
      return;
    }

    setError(null);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime) {
      setError('Missing required appointment information');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Combine date and time
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

      // Check for conflicts
      const conflictResponse = await checkConflict(selectedDoctor, appointmentDateTime, duration);
      if (conflictResponse.has_conflict) {
        setError('This time slot conflicts with another appointment. Please select a different time.');
        setStep(2);
        return;
      }

      const payload: AppointmentCreatePayload = {
        patient: selectedPatient,
        doctor: selectedDoctor,
        appointment_datetime: appointmentDateTime,
        duration_minutes: duration,
        appointment_type: appointmentType,
        urgency: 'routine',
        reason: reason,
        notes: notes || undefined,
      };

      await createAppointment(payload);
      router.push('/appointments?created=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedPatientName = () => {
    const patient = patients.find((p) => p.id === selectedPatient);
    return patient ? patient.full_name : '';
  };

  const getSelectedDoctorName = () => {
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    return doctor ? doctor.full_name : '';
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Appointment</h1>
          <p className="text-gray-600 mt-1">Follow the steps to book a new appointment</p>
        </div>

        {/* Progress Indicators */}
        <div className="mb-8 flex justify-between">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= stepNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Select Patient */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patient
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onFocus={() => setShowPatientList(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {showPatientList && (
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {patientLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading patients...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No patients found</div>
                ) : (
                  <div>
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient.id);
                          setShowPatientList(false);
                          setPatientSearch('');
                        }}
                        className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{patient.full_name}</p>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPatient && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Selected:</span> {getSelectedPatientName()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Doctor and Date/Time */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Doctor & Date/Time</h2>

            <div className="space-y-4">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.target.value);
                    setAvailableSlots([]);
                    setSelectedTime('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailableSlots([]);
                    setSelectedTime('');
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setAvailableSlots([]);
                    setSelectedTime('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Time Slots */}
              {selectedDoctor && selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Times
                  </label>
                  {slotsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading available slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
                      No available slots for this date. Please select another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => {
                        const time = new Date(slot).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              selectedTime === time
                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                : 'border-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Appointment Details */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>

            <div className="space-y-4">
              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Annual checkup, Follow-up consultation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Appointment</h2>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium text-gray-900">{getSelectedPatientName()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-medium text-gray-900">{getSelectedDoctorName()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedDate, selectedTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">{duration} minutes</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">
                    {appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1).replace('_', ' ')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Reason for Visit</p>
                  <p className="font-medium text-gray-900">{reason}</p>
                </div>
                {notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium text-gray-900">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-4">
            <Link
              href="/appointments"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>

            {step < 4 ? (
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
