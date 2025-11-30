'use client';

/**
 * Doctors Management Page - Full CRUD with real data
 * Manage healthcare providers and their credentials
 */

import { useEffect, useState, useMemo } from 'react';
import DoctorModal from '@/components/doctors/DoctorModal';
import { getDoctors, deleteDoctor, Doctor } from '@/lib/api/doctors';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Fetch doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getDoctors();
        setDoctors(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load doctors';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch =
        searchTerm === '' ||
        doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.user_details?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

      const specialty = doctor.specializations?.[0]?.name || '';
      const matchesSpecialty = specialtyFilter === '' || specialty === specialtyFilter;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchTerm, specialtyFilter]);

  const specialties = useMemo(() => {
    return [...new Set(doctors.map(d => d.specializations?.[0]?.name).filter(Boolean))].sort();
  }, [doctors]);

  const activeCount = useMemo(() => {
    return doctors.filter(d => d.status === 'active').length;
  }, [doctors]);

  const handleAddClick = () => {
    setSelectedDoctor(undefined);
    setModalOpen(true);
  };

  const handleEditClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setModalOpen(true);
  };

  const handleDeleteClick = async (doctor: Doctor) => {
    if (!confirm(`Are you sure you want to delete ${doctor.full_name}?`)) {
      return;
    }

    try {
      await deleteDoctor(doctor.id);
      setDoctors(doctors.filter(d => d.id !== doctor.id));
    } catch (err) {
      alert('Failed to delete doctor: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleModalSuccess = (doctor: Doctor) => {
    if (selectedDoctor) {
      // Update existing doctor
      setDoctors(doctors.map(d => (d.id === doctor.id ? doctor : d)));
    } else {
      // Add new doctor
      setDoctors([...doctors, doctor]);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
      retired: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600 mt-1">Manage healthcare providers and credentials</p>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            Add Doctor
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </label>
              <select
                id="specialty"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Specialties</option>
                {specialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading doctors...</div>
          </div>
        ) : (
          <>
            {/* Doctors Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              {filteredDoctors.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No doctors found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Specialty</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">License</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map((doctor) => (
                        <tr key={doctor.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {doctor.full_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{doctor.specializations?.[0]?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{doctor.user_details?.email || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{doctor.license_number}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(doctor.status || 'active')}`}>
                              {(doctor.status || 'active').charAt(0).toUpperCase() + (doctor.status || 'active').slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <button
                              onClick={() => handleEditClick(doctor)}
                              className="text-blue-600 hover:text-blue-700 mr-4 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(doctor)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{doctors.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Specialties</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{specialties.length}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Doctor Modal */}
      <DoctorModal
        isOpen={modalOpen}
        doctor={selectedDoctor}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
