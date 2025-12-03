'use client';

/**
 * Appointment Type Selector Step
 *
 * Displays available appointment types and allows the user to select one.
 */

import { memo } from 'react';

const APPOINTMENT_TYPES = [
  {
    id: 'consultation',
    label: 'General Consultation',
    description: 'Regular check-up or medical consultation',
    icon: '🏥',
  },
  {
    id: 'follow_up',
    label: 'Follow-up Visit',
    description: 'Follow-up appointment for ongoing treatment',
    icon: '📋',
  },
  {
    id: 'procedure',
    label: 'Procedure',
    description: 'Medical procedure or treatment',
    icon: '🔬',
  },
  {
    id: 'lab_work',
    label: 'Lab Work',
    description: 'Blood tests or laboratory work',
    icon: '🧪',
  },
  {
    id: 'vaccination',
    label: 'Vaccination',
    description: 'Immunization appointment',
    icon: '💉',
  },
  {
    id: 'physical_exam',
    label: 'Physical Exam',
    description: 'Annual physical or health screening',
    icon: '🩺',
  },
  {
    id: 'telemedicine',
    label: 'Telemedicine',
    description: 'Virtual appointment via video call',
    icon: '💻',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    description: 'Urgent medical issue requiring immediate attention',
    icon: '🚨',
  },
];

interface AppointmentTypeSelectorProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

function AppointmentTypeSelector({
  selectedType,
  onSelect,
}: AppointmentTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What type of appointment do you need?
        </h2>
        <p className="text-gray-600">
          Select the type of appointment that best fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {APPOINTMENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedType === type.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{type.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{type.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </div>
              {selectedType === type.id && (
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(AppointmentTypeSelector);
