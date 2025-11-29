'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Patient } from '@/types/patient';

interface PatientTableProps {
  patients: Patient[];
  isLoading?: boolean;
  error?: string | null;
  onDelete?: (id: string) => void;
}

type SortField = 'name' | 'mrn' | 'dob' | 'phone' | 'email';
type SortOrder = 'asc' | 'desc';

export default function PatientTable({
  patients,
  isLoading = false,
  error = null,
  onDelete
}: PatientTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedPatients = useMemo(() => {
    const sorted = [...patients].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortField) {
        case 'name':
          aVal = `${a.first_name} ${a.last_name}`;
          bVal = `${b.first_name} ${b.last_name}`;
          break;
        case 'mrn':
          aVal = a.medical_record_number;
          bVal = b.medical_record_number;
          break;
        case 'dob':
          aVal = new Date(a.date_of_birth).getTime();
          bVal = new Date(b.date_of_birth).getTime();
          break;
        case 'phone':
          aVal = a.phone;
          bVal = b.phone;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [patients, sortField, sortOrder]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPatients.slice(start, start + itemsPerPage);
  }, [sortedPatients, currentPage]);

  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h5a1 1 0 000-2H3zm0 4a1 1 0 000 2h4a1 1 0 000-2H3z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg
        className={`w-4 h-4 text-blue-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h5a1 1 0 000-2H3zm0 4a1 1 0 000 2h4a1 1 0 000-2H3z" clipRule="evenodd" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">No patients found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('mrn')}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                >
                  MRN
                  <SortIcon field="mrn" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('dob')}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                >
                  Date of Birth
                  <SortIcon field="dob" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('phone')}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                >
                  Phone
                  <SortIcon field="phone" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                >
                  Email
                  <SortIcon field="email" />
                </button>
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPatients.map((patient, index) => {
              const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
              const dob = new Date(patient.date_of_birth);
              const dobString = dob.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <tr
                  key={patient.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-6 py-4">
                    <Link href={`/patients/${patient.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {patient.first_name} {patient.last_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.medical_record_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{dobString}</div>
                    <div className="text-xs text-gray-400">{age} years old</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/patients/${patient.id}/edit`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${patient.first_name} ${patient.last_name}?`)) {
                              onDelete(patient.id);
                            }
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedPatients.length)} of {sortedPatients.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
