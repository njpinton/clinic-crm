/**
 * Patients list page - Server Component.
 * Fetches patients on the server and passes to client component.
 */

import Link from 'next/link';
import { fetchPatients } from '@/lib/api/patients';
import { PatientList } from '@/components/patients/PatientList';

export default async function PatientsPage() {
    // Fetch patients on server (Server Component)
    const data = await fetchPatients();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="mt-2 text-gray-600">
                        Manage patient records and information
                    </p>
                </div>

                <Link
                    href="/patients/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Patient
                </Link>
            </div>

            {/* Patient List - Client Component for interactivity */}
            <PatientList patients={data.results} />
        </div>
    );
}
