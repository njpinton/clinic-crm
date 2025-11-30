'use client';

import React, { useState, useEffect } from 'react';
import {
  LabOrderDetails,
  LabOrderCreatePayload,
  getLabTestTypes,
  getTestsForType,
  LabTest,
  LabTestType
} from '@/lib/api/laboratory';

interface LabOrderFormProps {
  order?: LabOrderDetails;
  onSubmit: (data: LabOrderCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function LabOrderForm({
  order,
  onSubmit,
  isSubmitting = false,
  error = null
}: LabOrderFormProps) {
  const [formData, setFormData] = useState<LabOrderCreatePayload>({
    patientId: order?.patientId || '',
    doctorId: order?.doctorId || '',
    testType: order?.testType || 'blood-work',
    tests: order?.tests || [],
    priority: order?.priority || 'routine',
    sampleType: order?.sampleType || '',
    instructions: order?.instructions || '',
    notes: order?.notes || '',
    dueDate: order?.dueDate ? order.dueDate.split('T')[0] : ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTests, setSelectedTests] = useState<string[]>(
    order?.tests.map(t => t.code) || []
  );

  const testTypes = getLabTestTypes();
  const availableTests = getTestsForType(formData.testType as LabTestType);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient is required';
    }

    if (!formData.doctorId.trim()) {
      newErrors.doctorId = 'Doctor is required';
    }

    if (!formData.testType) {
      newErrors.testType = 'Test type is required';
    }

    if (selectedTests.length === 0) {
      newErrors.tests = 'At least one test must be selected';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'testType') {
      setFormData(prev => ({
        ...prev,
        testType: value as any,
        tests: [] // Reset tests when type changes
      }));
      setSelectedTests([]);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTestToggle = (testCode: string, testName: string) => {
    setSelectedTests(prev => {
      const newTests = prev.includes(testCode)
        ? prev.filter(t => t !== testCode)
        : [...prev, testCode];

      // Update form data with selected tests
      const selectedTestObjects = newTests.map(code => {
        const test = availableTests.find(t => t.code === code);
        return test || { name: testName, code };
      });

      setFormData(prevForm => ({
        ...prevForm,
        tests: selectedTestObjects
      }));

      if (errors.tests) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.tests;
          return newErrors;
        });
      }

      return newTests;
    });
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

      {/* Order Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>

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
              disabled={!!order}
            />
            {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Doctor ID */}
          <div>
            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
              Ordering Doctor *
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
              disabled={!!order}
            />
            {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority || 'routine'}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (Immediate)</option>
            </select>
            {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Test Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Selection</h3>

        {/* Test Type */}
        <div className="mb-6">
          <label htmlFor="testType" className="block text-sm font-medium text-gray-700 mb-2">
            Test Type *
          </label>
          <select
            id="testType"
            name="testType"
            value={formData.testType}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.testType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a test type</option>
            {testTypes.map(type => (
              <option key={type} value={type}>
                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          {errors.testType && <p className="text-red-500 text-xs mt-1">{errors.testType}</p>}
        </div>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Tests *
            </label>
            <div className="space-y-2 bg-gray-50 p-4 rounded">
              {availableTests.map(test => (
                <label key={test.code} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.code)}
                    onChange={() => handleTestToggle(test.code, test.name)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">{test.code}</span> - {test.name}
                  </span>
                </label>
              ))}
            </div>
            {errors.tests && <p className="text-red-500 text-xs mt-2">{errors.tests}</p>}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Sample Type */}
          <div>
            <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700 mb-1">
              Sample Type
            </label>
            <input
              type="text"
              id="sampleType"
              name="sampleType"
              value={formData.sampleType || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., EDTA Blood, Serum, Urine Sample"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
            Patient Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Fasting required. No food or drink for 12 hours before test."
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional clinical notes or context..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating Order...' : order ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
