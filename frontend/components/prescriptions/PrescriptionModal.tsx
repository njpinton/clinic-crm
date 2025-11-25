'use client';

import React, { useState } from 'react';
import PrescriptionForm from './PrescriptionForm';
import { Prescription, PrescriptionCreatePayload, createPrescription, updatePrescription } from '@/lib/api/prescriptions';

interface PrescriptionModalProps {
  isOpen: boolean;
  prescription?: Prescription;
  onClose: () => void;
  onSuccess: (prescription: Prescription) => void;
}

export default function PrescriptionModal({
  isOpen,
  prescription,
  onClose,
  onSuccess
}: PrescriptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (data: PrescriptionCreatePayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result: Prescription;

      if (prescription) {
        // Update existing prescription
        result = await updatePrescription(prescription.id, data);
      } else {
        // Create new prescription
        result = await createPrescription(data);
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save prescription';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {prescription ? 'Edit Prescription' : 'Create New Prescription'}
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
          <PrescriptionForm
            prescription={prescription}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
