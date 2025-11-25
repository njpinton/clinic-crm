'use client';

import React, { useState, useEffect } from 'react';
import { Doctor, DoctorCreatePayload, getSpecialties, getStatuses, DoctorStatus } from '@/lib/api/doctors';

interface DoctorFormProps {
  doctor?: Doctor;
  onSubmit: (data: DoctorCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function DoctorForm({
  doctor,
  onSubmit,
  isSubmitting = false,
  error = null
}: DoctorFormProps) {
  const [formData, setFormData] = useState<DoctorCreatePayload>({
    firstName: doctor?.firstName || '',
    lastName: doctor?.lastName || '',
    email: doctor?.email || '',
    phone: doctor?.phone || '',
    specialty: doctor?.specialty || '',
    licenseNumber: doctor?.credentials.licenseNumber || '',
    licenseState: doctor?.credentials.licenseState || 'CA',
    deaNumber: doctor?.credentials.deaNumber || '',
    npiNumber: doctor?.credentials.npiNumber || '',
    status: doctor?.status || 'active',
    bio: doctor?.bio || '',
    yearsOfExperience: doctor?.yearsOfExperience || undefined,
    department: doctor?.department || '',
    boardCertifications: doctor?.credentials.boardCertifications || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const specialties = getSpecialties();
  const statuses = getStatuses();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.specialty) {
      newErrors.specialty = 'Specialty is required';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.licenseState.trim()) {
      newErrors.licenseState = 'License state is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }));
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

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Smith"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john@clinic.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Specialty */}
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
              Specialty *
            </label>
            <select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.specialty ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a specialty</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Cardiology Department"
            />
          </div>

          {/* Years of Experience */}
          <div>
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15"
              min="0"
              max="60"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Professional bio and expertise..."
          />
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credentials</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* License Number */}
          <div>
            <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
              License Number *
            </label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="MD-12345"
            />
            {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
          </div>

          {/* License State */}
          <div>
            <label htmlFor="licenseState" className="block text-sm font-medium text-gray-700 mb-1">
              License State *
            </label>
            <input
              type="text"
              id="licenseState"
              name="licenseState"
              value={formData.licenseState}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.licenseState ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="CA"
              maxLength="2"
            />
            {errors.licenseState && <p className="text-red-500 text-xs mt-1">{errors.licenseState}</p>}
          </div>

          {/* DEA Number */}
          <div>
            <label htmlFor="deaNumber" className="block text-sm font-medium text-gray-700 mb-1">
              DEA Number
            </label>
            <input
              type="text"
              id="deaNumber"
              name="deaNumber"
              value={formData.deaNumber || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="DJ1234567"
            />
          </div>

          {/* NPI Number */}
          <div>
            <label htmlFor="npiNumber" className="block text-sm font-medium text-gray-700 mb-1">
              NPI Number
            </label>
            <input
              type="text"
              id="npiNumber"
              name="npiNumber"
              value={formData.npiNumber || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890"
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
          {isSubmitting ? 'Saving...' : doctor ? 'Update Doctor' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
}
