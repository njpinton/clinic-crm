'use client';

import { useState, useEffect } from 'react';
import {
  createPatient,
  checkDuplicatePatient,
  DuplicateCheckResponse,
  type DuplicateCheckResult
} from '@/lib/api/patients';
import { Patient } from '@/types/patient';

interface QuickCreatePatientModalProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
}

type FormStep = 'details' | 'duplicate-check' | 'confirm';

export const QuickCreatePatientModal = ({
  isOpen,
  token,
  onClose,
  onPatientCreated
}: QuickCreatePatientModalProps) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // UI state
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [duplicates, setDuplicates] = useState<DuplicateCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setPhone('');
    setEmail('');
    setCurrentStep('details');
    setDuplicates([]);
    setError(null);
    setSelectedDuplicateId(null);
  };

  const validateDetailsStep = (): boolean => {
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      setError('Invalid date of birth format');
      return false;
    }

    // Check age (must be 18+)
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

    if (actualAge < 18) {
      setError('Patient must be at least 18 years old');
      return false;
    }

    setError(null);
    return true;
  };

  const handleCheckDuplicates = async () => {
    if (!validateDetailsStep()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await checkDuplicatePatient(
        {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          phone: phone || undefined,
          email: email || undefined,
        },
        token
      );

      setDuplicates(response.potential_duplicates);

      if (response.duplicates_found) {
        setCurrentStep('duplicate-check');
      } else {
        // No duplicates, proceed to confirm
        setCurrentStep('confirm');
      }
    } catch (err) {
      console.error('Duplicate check error:', err);
      setError('Failed to check for duplicates. Proceeding anyway.');
      setCurrentStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePatient = async (useExistingPatientId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (useExistingPatientId) {
        // User selected an existing patient instead
        // We need to fetch and return that patient
        // For now, we'll just close and let the user know
        onClose();
        return;
      }

      const response = await createPatient(
        {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          phone: phone ? phone : undefined,
          email: email ? email : undefined,
        },
        token
      );

      onPatientCreated(response);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Create patient error:', err);
      setError('Failed to create patient. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {currentStep === 'details' && 'New Patient Registration'}
            {currentStep === 'duplicate-check' && 'Check for Duplicates'}
            {currentStep === 'confirm' && 'Confirm Patient Details'}
          </h3>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckDuplicates();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Checking...' : 'Next'}
                </button>
              </div>
            </form>
          )}

          {/* Duplicate Check Step */}
          {currentStep === 'duplicate-check' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We found potential duplicate patient records. Please select which action to take:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {duplicates.map((duplicate) => (
                  <label
                    key={duplicate.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duplicate-action"
                      value={duplicate.id}
                      checked={selectedDuplicateId === duplicate.id}
                      onChange={(e) => setSelectedDuplicateId(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-gray-900">
                        {duplicate.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        MRN: {duplicate.medical_record_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {duplicate.confidence}% ({duplicate.match_type.replace('_', ' ')})
                      </div>
                    </div>
                  </label>
                ))}

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer bg-blue-50 border-blue-200">
                  <input
                    type="radio"
                    name="duplicate-action"
                    value="new"
                    checked={selectedDuplicateId === 'new'}
                    onChange={() => setSelectedDuplicateId('new')}
                    className="mt-1"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">
                      None of these - Create new patient
                    </div>
                    <div className="text-xs text-gray-500">
                      Create a new record for {firstName} {lastName}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDuplicateId === 'new') {
                      setCurrentStep('confirm');
                    } else if (selectedDuplicateId) {
                      // Use existing patient
                      handleCreatePatient(selectedDuplicateId);
                    }
                  }}
                  disabled={!selectedDuplicateId || isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-3">Patient Details</h4>
                <dl className="text-sm space-y-2">
                  <div>
                    <dt className="text-gray-600">Name:</dt>
                    <dd className="text-gray-900 font-medium">
                      {firstName} {lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Date of Birth:</dt>
                    <dd className="text-gray-900 font-medium">
                      {new Date(dateOfBirth).toLocaleDateString()}
                    </dd>
                  </div>
                  {phone && (
                    <div>
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="text-gray-900 font-medium">{phone}</dd>
                    </div>
                  )}
                  {email && (
                    <div>
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="text-gray-900 font-medium">{email}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <p className="text-sm text-gray-600">
                Click "Create Patient" to create this new patient record. A medical record number will be automatically generated.
              </p>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleCreatePatient()}
                  disabled={isLoading}
                  className="px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Patient'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
