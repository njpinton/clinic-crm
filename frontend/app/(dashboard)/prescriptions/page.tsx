'use client';

/**
 * Prescriptions Management Page - Full CRUD with real data
 * Create, manage, and track patient prescriptions and medications
 */

import { useEffect, useState, useMemo } from 'react';
import PrescriptionModal from '@/components/prescriptions/PrescriptionModal';
import { getPrescriptions, deletePrescription, Prescription, getStatusBadgeColor } from '@/lib/api/prescriptions';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch prescriptions on mount
  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getPrescriptions();
        setPrescriptions(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load prescriptions';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  // Filter prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(prescription => {
      const matchesSearch =
        searchTerm === '' ||
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || prescription.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const statuses = useMemo(() => {
    return [...new Set(prescriptions.map(p => p.status))].sort();
  }, [prescriptions]);

  const dispensedCount = useMemo(() => {
    return prescriptions.filter(p => p.status === 'dispensed').length;
  }, [prescriptions]);

  const pendingCount = useMemo(() => {
    return prescriptions.filter(p => p.status === 'pending').length;
  }, [prescriptions]);

  const handleAddClick = () => {
    setSelectedPrescription(undefined);
    setModalOpen(true);
  };

  const handleEditClick = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setModalOpen(true);
  };

  const handleDeleteClick = async (prescription: Prescription) => {
    if (!confirm(`Are you sure you want to delete the prescription for ${prescription.medication.name}?`)) {
      return;
    }

    try {
      await deletePrescription(prescription.id);
      setPrescriptions(prescriptions.filter(p => p.id !== prescription.id));
    } catch (err) {
      alert('Failed to delete prescription: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleModalSuccess = (prescription: Prescription) => {
    if (selectedPrescription) {
      // Update existing prescription
      setPrescriptions(prescriptions.map(p => (p.id === prescription.id ? prescription : p)));
    } else {
      // Add new prescription
      setPrescriptions([...prescriptions, prescription]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-600 mt-1">Manage patient medications and prescriptions</p>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            New Prescription
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
                placeholder="Search by patient, medication, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
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
            <div className="text-gray-600">Loading prescriptions...</div>
          </div>
        ) : (
          <>
            {/* Prescriptions Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              {filteredPrescriptions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No prescriptions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Medication</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Doctor</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dosage</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issued Date</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.map((prescription) => (
                        <tr key={prescription.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div>
                              <div className="font-medium">{prescription.medication.name}</div>
                              <div className="text-xs text-gray-500">{prescription.medication.strength}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{prescription.patientName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{prescription.doctorName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="text-sm">
                              {prescription.dosage.amount} {prescription.dosage.unit}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {prescription.dosage.frequency.replace('-', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(prescription.status)}`}>
                              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(prescription.dateIssued)}</td>
                          <td className="px-6 py-4 text-sm text-right">
                            <button
                              onClick={() => handleEditClick(prescription)}
                              className="text-blue-600 hover:text-blue-700 mr-4 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(prescription)}
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
                <p className="text-gray-600 text-sm">Total Prescriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{prescriptions.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Dispensed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{dispensedCount}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={modalOpen}
        prescription={selectedPrescription}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
