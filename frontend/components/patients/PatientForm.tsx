'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema, type PatientFormValues } from '@/lib/validations/patient';
import type { Patient } from '@/types/patient';

interface PatientFormProps {
    patient?: Patient;
    onSubmit: (data: PatientFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

/**
 * Reusable patient form component for create and edit operations.
 * Uses React Hook Form with Zod validation.
 */
export function PatientForm({ patient, onSubmit, isSubmitting = false }: PatientFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: patient ? {
            medical_record_number: patient.medical_record_number,
            first_name: patient.first_name,
            middle_name: patient.middle_name || '',
            last_name: patient.last_name,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender || '',
            phone: patient.phone || '',
            email: patient.email || '',
            address_line1: patient.address_line1 || '',
            address_line2: patient.address_line2 || '',
            city: patient.city || '',
            state: patient.state || '',
            zip_code: patient.zip_code || '',
            emergency_contact_name: patient.emergency_contact_name || '',
            emergency_contact_relationship: patient.emergency_contact_relationship || '',
            emergency_contact_phone: patient.emergency_contact_phone || '',
        } : undefined,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="medical_record_number" className="block text-sm font-medium text-gray-700 mb-1">
                            Medical Record Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('medical_record_number')}
                            type="text"
                            id="medical_record_number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.medical_record_number && (
                            <p className="mt-1 text-sm text-red-600">{errors.medical_record_number.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('date_of_birth')}
                            type="date"
                            id="date_of_birth"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.date_of_birth && (
                            <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('first_name')}
                            type="text"
                            id="first_name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Middle Name
                        </label>
                        <input
                            {...register('middle_name')}
                            type="text"
                            id="middle_name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.middle_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.middle_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('last_name')}
                            type="text"
                            id="last_name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                    </label>
                    <select
                        {...register('gender')}
                        id="gender"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    >
                        <option value="">Select gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                        <option value="U">Prefer not to say</option>
                    </select>
                    {errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                    )}
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            {...register('phone')}
                            type="tel"
                            id="phone"
                            placeholder="+1234567890"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            id="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>

                <div>
                    <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                    </label>
                    <input
                        {...register('address_line1')}
                        type="text"
                        id="address_line1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    />
                    {errors.address_line1 && (
                        <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                    </label>
                    <input
                        {...register('address_line2')}
                        type="text"
                        id="address_line2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    />
                    {errors.address_line2 && (
                        <p className="mt-1 text-sm text-red-600">{errors.address_line2.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City
                        </label>
                        <input
                            {...register('city')}
                            type="text"
                            id="city"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            State
                        </label>
                        <input
                            {...register('state')}
                            type="text"
                            id="state"
                            placeholder="CA"
                            maxLength={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.state && (
                            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code
                        </label>
                        <input
                            {...register('zip_code')}
                            type="text"
                            id="zip_code"
                            placeholder="12345"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.zip_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.zip_code.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Name
                        </label>
                        <input
                            {...register('emergency_contact_name')}
                            type="text"
                            id="emergency_contact_name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.emergency_contact_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship
                        </label>
                        <input
                            {...register('emergency_contact_relationship')}
                            type="text"
                            id="emergency_contact_relationship"
                            placeholder="Spouse, Parent, Sibling, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                        />
                        {errors.emergency_contact_relationship && (
                            <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_relationship.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone Number
                    </label>
                    <input
                        {...register('emergency_contact_phone')}
                        type="tel"
                        id="emergency_contact_phone"
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    />
                    {errors.emergency_contact_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone.message}</p>
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : patient ? 'Update Patient' : 'Create Patient'}
                </button>
            </div>
        </form>
    );
}
