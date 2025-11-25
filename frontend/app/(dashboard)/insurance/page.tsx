'use client';

/**
 * Insurance Management Page - Full CRUD with real data
 * Manage patient insurance policies and coverage information
 */

import { useEffect, useState, useMemo } from 'react';
import { getInsurances, deleteInsurance, InsurancePolicy, getStatusBadgeColor } from '@/lib/api/insurance';

export default function InsurancePage() {
  const [insurances, setInsurances] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch insurance policies on mount
  useEffect(() => {
    const loadInsurances = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getInsurances();
        setInsurances(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load insurance policies';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsurances();
  }, []);

  // Filter insurance policies
  const filteredInsurances = useMemo(() => {
    return insurances.filter(policy => {
      const matchesSearch =
        searchTerm === '' ||
        policy.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.memberId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || policy.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [insurances, searchTerm, statusFilter]);

  const statuses = useMemo(() => {
    return [...new Set(insurances.map(i => i.status))].sort();
  }, [insurances]);

  const activeCount = useMemo(() => {
    return insurances.filter(i => i.status === 'active').length;
  }, [insurances]);

  const handleDeleteClick = async (policy: InsurancePolicy) => {
    if (!confirm(`Are you sure you want to delete the insurance policy for ${policy.patientName}?`)) {
      return;
    }

    try {
      await deleteInsurance(policy.id);
      setInsurances(insurances.filter(i => i.id !== policy.id));
    } catch (err) {
      alert('Failed to delete insurance policy: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
            <h1 className="text-3xl font-bold text-gray-900">Insurance</h1>
            <p className="text-gray-600 mt-1">Manage patient insurance policies and coverage</p>
          </div>
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
                placeholder="Search by patient, provider, or member ID..."
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
            <div className="text-gray-600">Loading insurance policies...</div>
          </div>
        ) : (
          <>
            {/* Insurance Policies Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              {filteredInsurances.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No insurance policies found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Member ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Copay</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Effective Date</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInsurances.map((policy) => (
                        <tr key={policy.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{policy.patientName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{policy.provider}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{policy.planType}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{policy.memberId}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {policy.copay ? `$${policy.copay}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(policy.status)}`}>
                              {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(policy.effectiveDate)}</td>
                          <td className="px-6 py-4 text-sm text-right">
                            <button
                              onClick={() => handleDeleteClick(policy)}
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
                <p className="text-gray-600 text-sm">Total Policies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{insurances.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Active Policies</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Patients Covered</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{insurances.length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
