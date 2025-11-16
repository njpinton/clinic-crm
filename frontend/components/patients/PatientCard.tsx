/**
 * Patient card component for displaying patient summary.
 */

import Link from 'next/link';
import type { Patient } from '@/types/patient';

interface PatientCardProps {
    patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
    return (
        <Link
            href={`/patients/${patient.id}`}
            className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        {patient.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        MRN: {patient.medical_record_number}
                    </p>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                        Age {patient.age}
                    </span>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                </div>

                {patient.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {patient.phone}
                    </div>
                )}

                {patient.email && (
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {patient.email}
                    </div>
                )}
            </div>
        </Link>
    );
}
