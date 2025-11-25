'use client';

import React, { useState, useEffect } from 'react';
import {
  Prescription,
  PrescriptionCreatePayload,
  getMockMedications,
  getFrequencies,
  getRoutes,
  Medication
} from '@/lib/api/prescriptions';

interface PrescriptionFormProps {
  prescription?: Prescription;
  onSubmit: (data: PrescriptionCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function PrescriptionForm({
  prescription,
  onSubmit,
  isSubmitting = false,
  error = null
}: PrescriptionFormProps) {
  const [formData, setFormData] = useState<PrescriptionCreatePayload>({
    patientId: prescription?.patientId || '',
    doctorId: prescription?.doctorId || '',
    medication: prescription?.medication || { name: '', generic: '', strength: '', form: '' },
    dosage: prescription?.dosage || {
      amount: 0,
      unit: 'mg',
      frequency: 'daily',
      route: 'oral'
    },
    quantity: prescription?.quantity || 30,
    refills: prescription?.refills || 0,
    indications: prescription?.indications || '',
    notes: prescription?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMedication, setSelectedMedication] = useState<string>(
    prescription?.medication.name || ''
  );

  const medications = getMockMedications();
  const frequencies = getFrequencies();
  const routes = getRoutes();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient is required';
    }

    if (!formData.doctorId.trim()) {
      newErrors.doctorId = 'Doctor is required';
    }

    if (!selectedMedication) {
      newErrors.medication = 'Medication is required';
    }

    if (!formData.dosage.amount || formData.dosage.amount <= 0) {
      newErrors.dosageAmount = 'Dose amount must be greater than 0';
    }

    if (!formData.dosage.frequency) {
      newErrors.frequency = 'Frequency is required';
    }

    if (!formData.dosage.route) {
      newErrors.route = 'Route is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.refills < 0) {
      newErrors.refills = 'Refills cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'medicationSelect') {
      const med = medications.find(m => m.name === value);
      if (med) {
        setFormData(prev => ({
          ...prev,
          medication: med
        }));
        setSelectedMedication(value);
      }
    } else if (name.startsWith('dosage.')) {
      const dosageField = name.split('.')[1];
      if (type === 'number') {
        setFormData(prev => ({
          ...prev,
          dosage: {
            ...prev.dosage,
            [dosageField]: parseFloat(value) || 0
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dosage: {
            ...prev.dosage,
            [dosageField]: value
          }
        }));
      }
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    const errorKey = name === 'medicationSelect' ? 'medication' : name.split('.')[0];
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Patient & Doctor Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient & Doctor</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient ID */}
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <input
              type="text"
              id="patientId"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.patientId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="patient-123"
              disabled={!!prescription}
            />
            {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Doctor ID */}
          <div>
            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
              Prescribing Doctor *
            </label>
            <input
              type="text"
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.doctorId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="doc-1"
              disabled={!!prescription}
            />
            {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
          </div>
        </div>
      </div>

      {/* Medication */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Medication Selection */}
          <div className="md:col-span-2">
            <label htmlFor="medicationSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Select Medication *
            </label>
            <select
              id="medicationSelect"
              name="medicationSelect"
              value={selectedMedication}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.medication ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Choose a medication...</option>
              {medications.map(med => (
                <option key={med.ndc || med.name} value={med.name}>
                  {med.name} ({med.strength} {med.form})
                </option>
              ))}
            </select>
            {errors.medication && <p className="text-red-500 text-xs mt-1">{errors.medication}</p>}
          </div>

          {/* Generic Name */}
          {selectedMedication && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generic Name
                </label>
                <input
                  type="text"
                  value={formData.medication.generic}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {/* Strength */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strength
                </label>
                <input
                  type="text"
                  value={formData.medication.strength}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dosage Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dosage</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dose Amount */}
          <div>
            <label htmlFor="dosageAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Dose Amount *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="dosageAmount"
                name="dosage.amount"
                value={formData.dosage.amount}
                onChange={handleChange}
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dosageAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
                step="0.1"
              />
              <input
                type="text"
                name="dosage.unit"
                value={formData.dosage.unit}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
                placeholder="mg"
              />
            </div>
            {errors.dosageAmount && <p className="text-red-500 text-xs mt-1">{errors.dosageAmount}</p>}
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              id="frequency"
              name="dosage.frequency"
              value={formData.dosage.frequency}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.frequency ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {frequencies.map(freq => (
                <option key={freq} value={freq}>
                  {freq.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {errors.frequency && <p className="text-red-500 text-xs mt-1">{errors.frequency}</p>}
          </div>

          {/* Route */}
          <div>
            <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-1">
              Route *
            </label>
            <select
              id="route"
              name="dosage.route"
              value={formData.dosage.route}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.route ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {routes.map(route => (
                <option key={route} value={route}>
                  {route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {errors.route && <p className="text-red-500 text-xs mt-1">{errors.route}</p>}
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Patient Instructions
            </label>
            <textarea
              id="instructions"
              name="dosage.instructions"
              value={formData.dosage.instructions || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Take with food, Do not take with milk..."
            />
          </div>
        </div>
      </div>

      {/* Prescription Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="30"
              min="1"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>

          {/* Refills */}
          <div>
            <label htmlFor="refills" className="block text-sm font-medium text-gray-700 mb-1">
              Refills
            </label>
            <input
              type="number"
              id="refills"
              name="refills"
              value={formData.refills || 0}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.refills ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="3"
              min="0"
            />
            {errors.refills && <p className="text-red-500 text-xs mt-1">{errors.refills}</p>}
          </div>

          {/* Indications */}
          <div className="md:col-span-2">
            <label htmlFor="indications" className="block text-sm font-medium text-gray-700 mb-1">
              Indications (Why prescribed)
            </label>
            <textarea
              id="indications"
              name="indications"
              value={formData.indications || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., High blood pressure, Type 2 diabetes..."
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or warnings..."
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating Prescription...' : prescription ? 'Update Prescription' : 'Create Prescription'}
        </button>
      </div>
    </form>
  );
}
