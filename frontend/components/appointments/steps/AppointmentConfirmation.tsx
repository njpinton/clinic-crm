'use client';

/**
 * Appointment Confirmation Step
 *
 * Displays a summary of all appointment details for final review and confirmation.
 */

import { memo } from 'react';
import { AppointmentFormData } from '../AppointmentWizard';

interface AppointmentConfirmationProps {
  formData: AppointmentFormData;
  isSubmitting: boolean;
  onConfirm: () => void;
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  consultation: 'General Consultation',
  follow_up: 'Follow-up Visit',
  procedure: 'Procedure',
  lab_work: 'Lab Work',
  vaccination: 'Vaccination',
  physical_exam: 'Physical Exam',
  telemedicine: 'Telemedicine',
  emergency: 'Emergency',
};

function AppointmentConfirmation({
  formData,
  isSubmitting,
  onConfirm,
}: AppointmentConfirmationProps) {
  const appointmentDateTime = new Date(formData.appointmentDatetime);
  const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const appointmentTypeLabel =
    APPOINTMENT_TYPE_LABELS[formData.appointmentType] || formData.appointmentType;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm Your Appointment
        </h2>
        <p className="text-gray-600">
          Please review the details below before confirming your appointment.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
        <div className="space-y-4">
          {/* Appointment Type */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Appointment Type</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {appointmentTypeLabel}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
              {formData.durationMinutes} min
            </span>
          </div>

          {/* Date and Time */}
          <div className="border-t border-blue-200 pt-4">
            <p className="text-sm font-medium text-gray-700">Date & Time</p>
            <div className="flex items-center gap-3 mt-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5a2 2 0 002 2h8a2 2 0 002-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {formattedDate}
                </p>
                <p className="text-sm text-gray-600">{formattedTime}</p>
              </div>
            </div>
          </div>

          {/* Reason for Visit */}
          <div className="border-t border-blue-200 pt-4">
            <p className="text-sm font-medium text-gray-700">Reason for Visit</p>
            <p className="text-base text-gray-900 mt-2 italic">"{formData.reason}"</p>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium text-amber-900">Before Your Appointment</p>
            <ul className="text-sm text-amber-800 mt-2 space-y-1">
              <li>• Arrive 10 minutes early</li>
              <li>• Bring your insurance card and photo ID</li>
              <li>• Wear comfortable clothing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900 mb-2">
          Cancellation Policy
        </p>
        <p className="text-sm text-gray-600">
          You can cancel or reschedule your appointment up to 24 hours before the
          scheduled time without any charges.
        </p>
      </div>

      {/* Confirmation Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-2">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-green-800">
            A confirmation email will be sent to your registered email address
            after booking.
          </p>
        </div>
      </div>

      {/* Confirmation Button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                />
              </svg>
              Booking Appointment...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(AppointmentConfirmation);
