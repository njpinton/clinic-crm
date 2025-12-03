'use client';

/**
 * Enhanced Appointment Wizard
 *
 * Multi-step form for booking appointments with:
 * - Appointment type selection
 * - Doctor selection
 * - Available slot picker
 * - Clinical context display
 * - Confirmation
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppointmentTypeSelector from './steps/AppointmentTypeSelector';
import DoctorSelector from './steps/DoctorSelector';
import AvailabilitySlotPicker from './steps/AvailabilitySlotPicker';
import ClinicalContextPanel from './steps/ClinicalContextPanel';
import AppointmentConfirmation from './steps/AppointmentConfirmation';

export type WizardStep = 'type' | 'doctor' | 'date' | 'slots' | 'context' | 'confirm';

export interface AppointmentFormData {
  appointmentType: string;
  doctorId: string;
  date: string;
  appointmentDatetime: string;
  durationMinutes: number;
  patientId?: string;
  reason: string;
}

interface AppointmentWizardProps {
  patientId?: string;
  onComplete?: (appointmentId: string) => void;
  onCancel?: () => void;
}

const STEPS: WizardStep[] = ['type', 'doctor', 'date', 'slots', 'context', 'confirm'];

export default function AppointmentWizard({
  patientId,
  onComplete,
  onCancel,
}: AppointmentWizardProps) {
  const { accessToken } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<AppointmentFormData>({
    appointmentType: 'consultation',
    doctorId: '',
    date: '',
    appointmentDatetime: '',
    durationMinutes: 30,
    patientId,
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentStep = STEPS[currentStepIndex];

  const updateFormData = useCallback(
    (updates: Partial<AppointmentFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      setError(null);
    },
    []
  );

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStepIndex(stepIndex);
      setError(null);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setError(null);
    }
  }, [currentStepIndex]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setError(null);
    }
  }, [currentStepIndex]);

  const handleTypeSelect = (type: string) => {
    updateFormData({ appointmentType: type });
    goNext();
  };

  const handleDoctorSelect = (doctorId: string) => {
    updateFormData({ doctorId });
    goNext();
  };

  const handleDateSelect = (date: string) => {
    updateFormData({ date });
    goNext();
  };

  const handleSlotSelect = (appointmentDatetime: string, duration: number) => {
    updateFormData({ appointmentDatetime, durationMinutes: duration });
    goNext();
  };

  const handleReasonChange = (reason: string) => {
    updateFormData({ reason });
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create appointment via API
      const response = await fetch('/api/appointments/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: formData.patientId,
          doctor_id: formData.doctorId,
          appointment_datetime: formData.appointmentDatetime,
          appointment_type: formData.appointmentType,
          duration_minutes: formData.durationMinutes,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create appointment');
      }

      const appointment = await response.json();
      onComplete?.(appointment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-600 mt-2">Step {currentStepIndex + 1} of {STEPS.length}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded ${
                  index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          {currentStep === 'type' && (
            <AppointmentTypeSelector
              selectedType={formData.appointmentType}
              onSelect={handleTypeSelect}
            />
          )}

          {currentStep === 'doctor' && (
            <DoctorSelector
              selectedDoctorId={formData.doctorId}
              appointmentType={formData.appointmentType}
              onSelect={handleDoctorSelect}
            />
          )}

          {currentStep === 'date' && (
            <AvailabilitySlotPicker
              doctorId={formData.doctorId}
              selectedDate={formData.date}
              appointmentDatetime={formData.appointmentDatetime}
              durationMinutes={formData.durationMinutes}
              onDateSelect={handleDateSelect}
              onSlotSelect={handleSlotSelect}
              token={accessToken}
            />
          )}

          {currentStep === 'context' && (
            <div className="space-y-6">
              <ClinicalContextPanel patientId={formData.patientId} token={accessToken} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  placeholder="Describe the reason for your visit..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <AppointmentConfirmation
              formData={formData}
              isSubmitting={isLoading}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={onCancel || goBack}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep !== 'confirm' && (
            <button
              onClick={goNext}
              disabled={isLoading || !canProceed(currentStep, formData)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          )}

          {currentStep === 'confirm' && (
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function canProceed(step: WizardStep, data: AppointmentFormData): boolean {
  switch (step) {
    case 'type':
      return !!data.appointmentType;
    case 'doctor':
      return !!data.doctorId;
    case 'date':
      return !!data.date && !!data.appointmentDatetime;
    case 'context':
      return !!data.reason;
    case 'slots':
      return true;
    case 'confirm':
      return true;
    default:
      return false;
  }
}
