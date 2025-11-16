'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PatientForm } from '@/components/patients/PatientForm';
import { createPatient } from '@/lib/api/patients';
import type { PatientFormValues } from '@/lib/validations/patient';

/**
 * Create new patient page.
 * Uses client component for form interactivity.
 */
export default function NewPatientPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: PatientFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const patient = await createPatient(data);

            // Redirect to the newly created patient's detail page
            router.push(`/patients/${patient.id}`);
        } catch (err) {
            console.error('Error creating patient:', err);
            setError(err instanceof Error ? err.message : 'Failed to create patient. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New Patient</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Enter patient information. Fields marked with <span className="text-red-500">*</span> are required.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <PatientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">HIPAA Compliance Notice</h3>
                <p className="text-xs text-blue-800">
                    All patient information entered is protected health information (PHI) and is subject to HIPAA regulations.
                    Access to this data is logged for audit purposes.
                </p>
            </div>
        </div>
    );
}
