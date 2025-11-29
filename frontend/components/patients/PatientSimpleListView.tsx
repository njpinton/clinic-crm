'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Patient } from '@/types/patient';

interface PatientSimpleListViewProps {
  patients: Patient[];
  isLoading?: boolean;
  error?: string | null;
  onDelete?: (id: string) => void;
}

export default function PatientSimpleListView({
  patients,
  isLoading = false,
  error = null,
  onDelete
}: PatientSimpleListViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return patients.slice(start, start + itemsPerPage);
  }, [patients, currentPage]);

  const totalPages = Math.ceil(patients.length / itemsPerPage);

  function getInitials(firstName: string, lastName: string): string {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
  }

  function getAvatarColor(id: string): string {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const charCode = id.charCodeAt(0);
    return colors[charCode % colors.length];
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
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
    <div className="space-y-3">
      {paginatedPatients.map((patient) => {
        const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
        const initials = getInitials(patient.first_name, patient.last_name);
        const avatarColor = getAvatarColor(patient.id);

        return (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`${avatarColor} text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-semibold text-sm`}>
                  {initials}
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {patient.first_name} {patient.last_name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2 text-sm">
                    {/* MRN */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <span className="truncate">{patient.medical_record_number}</span>
                    </div>

                    {/* Age */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-2.414 2.414a1 1 0 101.414 1.414L9 11.414V6z" clipRule="evenodd" />
                      </svg>
                      <span>{age} years</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-gray-600 col-span-2 sm:col-span-1">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.832-.98c.341.772.906 1.465 1.657 1.998l1.831.98a1 1 0 01-.54 1.06l-4.434.74a1 1 0 01-.986-.836L2 5.153V3z" />
                      </svg>
                      <span className="truncate">{patient.phone}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-gray-600 col-span-2 sm:col-span-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      </svg>
                      <span className="truncate text-xs">{patient.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/patients/${patient.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
                >
                  Edit
                </Link>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete ${patient.first_name} ${patient.last_name}?`)) {
                        onDelete(patient.id);
                      }
                    }}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, patients.length)} of {patients.length}
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
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2">...</span>
              )}
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
