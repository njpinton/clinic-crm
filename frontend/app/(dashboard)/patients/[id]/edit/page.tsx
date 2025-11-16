'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PatientForm } from '@/components/patients/PatientForm';
import { fetchPatient, updatePatient } from '@/lib/api/patients';
import type { Patient } from '@/types/patient';
import type { PatientFormValues } from '@/lib/validations/patient';

/**
 * Edit patient page.
 * Fetches existing patient data and allows editing.
 */
export default function EditPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPatient() {
            try {
                const data = await fetchPatient(patientId);
                setPatient(data);
            } catch (err) {
                console.error('Error fetching patient:', err);
                setError('Failed to load patient data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }

        loadPatient();
    }, [patientId]);

    const handleSubmit = async (data: PatientFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const updatedPatient = await updatePatient(patientId, data);

            // Redirect to the updated patient's detail page
            router.push(`/patients/${updatedPatient.id}`);
        } catch (err) {
            console.error('Error updating patient:', err);
            setError(err instanceof Error ? err.message : 'Failed to update patient. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <div className="space-y-4">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !patient) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                    <p className="text-sm text-red-800">{error}</p>
                    <button
                        onClick={() => router.push('/patients')}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        Back to Patients
                    </button>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">Patient not found.</p>
                    <button
                        onClick={() => router.push('/patients')}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                    >
                        Back to Patients
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Update patient information for {patient.full_name} (MRN: {patient.medical_record_number})
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <PatientForm patient={patient} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">HIPAA Compliance Notice</h3>
                <p className="text-xs text-blue-800">
                    All patient information is protected health information (PHI) and is subject to HIPAA regulations.
                    This edit operation will be logged for audit purposes.
                </p>
            </div>
        </div>
    );
}
