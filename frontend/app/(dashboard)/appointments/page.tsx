'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getAppointments, deleteAppointment } from '@/lib/api/appointments';
import type { Appointment, AppointmentStatus } from '@/lib/api/appointments';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  checked_in: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  completed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  rescheduled: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAppointments(response.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  // Filter appointments by search query
  const filteredAppointments = appointments.filter((apt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      apt.patient_name.toLowerCase().includes(query) ||
      apt.doctor_name.toLowerCase().includes(query) ||
      apt.patient_email.toLowerCase().includes(query)
    );
  });

  // Handle appointment deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      setDeleting(id);
      await deleteAppointment(id);
      setAppointments(appointments.filter((apt) => apt.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
    } finally {
      setDeleting(null);
    }
  };

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
          </div>
          <Link
            href="/appointments/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Schedule Appointment
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by patient, doctor, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="ml-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">
              {appointments.length === 0
                ? 'No appointments scheduled yet.'
                : 'No appointments match your search.'}
            </p>
            {appointments.length === 0 && (
              <Link
                href="/appointments/new"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Schedule Your First Appointment
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => {
                    const statusColor = STATUS_COLORS[apt.status];
                    return (
                      <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {apt.patient_name}
                            </p>
                            <p className="text-xs text-gray-500">{apt.patient_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{apt.doctor_name}</p>
                          {apt.doctor_specializations?.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {apt.doctor_specializations.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDateTime(apt.appointment_datetime)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {apt.duration_minutes} min
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                          >
                            {apt.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/appointments/${apt.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(apt.id)}
                              disabled={deleting === apt.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === apt.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {filteredAppointments.map((apt) => {
                  const statusColor = STATUS_COLORS[apt.status];
                  return (
                    <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{apt.patient_name}</p>
                          <p className="text-xs text-gray-500">{apt.patient_email}</p>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                          {apt.status_display}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Doctor:</span> {apt.doctor_name}
                        </p>
                        <p>
                          <span className="font-medium">Date & Time:</span>{' '}
                          {formatDateTime(apt.appointment_datetime)}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span> {apt.duration_minutes} min
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/appointments/${apt.id}`}
                          className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(apt.id)}
                          disabled={deleting === apt.id}
                          className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === apt.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {!loading && appointments.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        )}
      </div>
    </div>
  );
}
