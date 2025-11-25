'use client';

import React, { useState } from 'react';
import DoctorForm from './DoctorForm';
import { Doctor, DoctorCreatePayload, createDoctor, updateDoctor } from '@/lib/api/doctors';

interface DoctorModalProps {
  isOpen: boolean;
  doctor?: Doctor;
  onClose: () => void;
  onSuccess: (doctor: Doctor) => void;
}

export default function DoctorModal({
  isOpen,
  doctor,
  onClose,
  onSuccess
}: DoctorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (data: DoctorCreatePayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result: Doctor;

      if (doctor) {
        // Update existing doctor
        result = await updateDoctor(doctor.id, data);
      } else {
        // Create new doctor
        result = await createDoctor(data);
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save doctor';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <DoctorForm
            doctor={doctor}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
