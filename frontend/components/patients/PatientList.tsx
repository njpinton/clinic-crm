'use client';

/**
 * Patient list component with search and filtering.
 */

import { useState, useMemo } from 'react';
import { PatientCard } from './PatientCard';
import type { Patient } from '@/types/patient';

interface PatientListProps {
    patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState<string>('');

    const filteredPatients = useMemo(() => {
        return patients.filter(patient => {
            const matchesSearch = searchQuery === '' ||
                patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.medical_record_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGender = genderFilter === '' || patient.gender === genderFilter;

            return matchesSearch && matchesGender;
        });
    }, [patients, searchQuery, genderFilter]);

    return (
        <div>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="search" className="sr-only">Search patients</label>
                    <input
                        type="text"
                        id="search"
                        placeholder="Search by name, MRN, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="gender" className="sr-only">Filter by gender</label>
                    <select
                        id="gender"
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Genders</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                        <option value="U">Prefer not to say</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredPatients.length} of {patients.length} patients
            </div>

            {/* Patient cards */}
            {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No patients found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                    ))}
                </div>
            )}
        </div>
    );
}
