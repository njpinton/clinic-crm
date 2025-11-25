'use client';

import React, { useState } from 'react';
import LabOrderForm from './LabOrderForm';
import { LabOrderDetails, LabOrderCreatePayload, createLabOrder, updateLabOrder } from '@/lib/api/laboratory';

interface LabOrderModalProps {
  isOpen: boolean;
  order?: LabOrderDetails;
  onClose: () => void;
  onSuccess: (order: LabOrderDetails) => void;
}

export default function LabOrderModal({
  isOpen,
  order,
  onClose,
  onSuccess
}: LabOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (data: LabOrderCreatePayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result: LabOrderDetails;

      if (order) {
        // Update existing lab order
        result = await updateLabOrder(order.id, data);
      } else {
        // Create new lab order
        result = await createLabOrder(data);
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save lab order';
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
            {order ? 'Edit Lab Order' : 'Create New Lab Order'}
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
          <LabOrderForm
            order={order}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
