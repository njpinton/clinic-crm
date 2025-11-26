/**
 * Patient detail page - Server Component.
 */

import Link from 'next/link';
import { fetchPatient } from '@/lib/api/patients';
import { notFound } from 'next/navigation';

interface PatientDetailPageProps {
    params: {
        id: string;
    };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
    let patient;

    try {
        patient = await fetchPatient(params.id);
    } catch (error) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/patients"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patients
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{patient.full_name}</h1>
                        <p className="text-gray-600 mt-1">MRN: {patient.medical_record_number}</p>
                    </div>

                    <Link
                        href={`/patients/${patient.id}/edit`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </Link>
                </div>
            </div>

            {/* Patient Information */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Personal Information */}
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                </div>
                <div className="px-6 py-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">{patient.full_name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {new Date(patient.date_of_birth).toLocaleDateString()} (Age {patient.age})
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Gender</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender === 'O' ? 'Other' : 'Prefer not to say'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Medical Record Number</dt>
                            <dd className="mt-1 text-sm text-gray-900">{patient.medical_record_number}</dd>
                        </div>
                    </dl>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                </div>
                <div className="px-6 py-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{patient.phone || 'Not provided'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{patient.email || 'Not provided'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {patient.address_line1 ? (
                                    <>
                                        {patient.address_line1}
                                        {patient.address_line2 && <><br />{patient.address_line2}</>}
                                        <br />
                                        {patient.city && `${patient.city}, `}
                                        {patient.province && `${patient.province} `}
                                        {patient.postal_code}
                                    </>
                                ) : (
                                    'Not provided'
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Emergency Contact */}
                {patient.emergency_contact_name && (
                    <>
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">Emergency Contact</h2>
                        </div>
                        <div className="px-6 py-4">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.emergency_contact_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Relationship</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.emergency_contact_relationship || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.emergency_contact_phone || 'Not provided'}</dd>
                                </div>
                            </dl>
                        </div>
                    </>
                )}

                {/* Metadata */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                            <dt className="font-medium">Created</dt>
                            <dd className="mt-1">{new Date(patient.created_at).toLocaleString()}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Last Updated</dt>
                            <dd className="mt-1">{new Date(patient.updated_at).toLocaleString()}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
