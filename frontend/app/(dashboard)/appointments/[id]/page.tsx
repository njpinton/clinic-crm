'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment,
  type AppointmentStatus,
} from '@/lib/api/appointments';

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; badge: string }> = {
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  checked_in: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  completed: { bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
  rescheduled: { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
};

const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: [],
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<AppointmentStatus>('scheduled');

  useEffect(() => {
    if (user && appointmentId) {
      loadAppointment();
    }
  }, [user, appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointment(appointmentId);
      setAppointment(data);
      setEditReason(data.reason || '');
      setEditNotes(data.notes || '');
      setEditStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!appointment || !appointmentId) return;

    try {
      setIsSaving(true);
      setError(null);

      const updates: Partial<Appointment> = {};
      if (editReason !== appointment.reason) updates.reason = editReason;
      if (editNotes !== appointment.notes) updates.notes = editNotes;
      if (editStatus !== appointment.status) updates.status = editStatus;

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      const updated = await updateAppointment(appointmentId, updates as any);
      setAppointment(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteAppointment(appointmentId);
      router.push('/appointments?deleted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Appointment not found</p>
            <Link
              href="/appointments"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[appointment.status];
  const availableTransitions = VALID_STATUS_TRANSITIONS[appointment.status] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Link
              href="/appointments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
            >
              ← Back to Appointments
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Appointment with {appointment.doctor_name}
            </h1>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor.badge}`}>
            {appointment.status_display}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left Column - Appointment Details */}
          <div className="col-span-2 space-y-6">
            {/* Date and Time */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDateTime(appointment.appointment_datetime)}
                  </p>
                </div>
                {appointment.end_datetime && (
                  <div>
                    <p className="text-sm text-gray-600">End Time</p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatDateTime(appointment.end_datetime)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-medium text-gray-900">
                    {appointment.duration_minutes} minutes
                  </p>
                </div>
                {appointment.is_walk_in && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800 font-medium">Walk-in Appointment</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-gray-900 font-medium">{appointment.appointment_type_display}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgency</p>
                  <p className="text-gray-900 font-medium">
                    {appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1)}
                  </p>
                </div>

                {!isEditing ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Reason for Visit</p>
                      <p className="text-gray-900 font-medium">{appointment.reason}</p>
                    </div>
                    {appointment.notes && (
                      <div>
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-gray-900">{appointment.notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Visit
                      </label>
                      <input
                        type="text"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Management */}
            {availableTransitions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Change Status
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as AppointmentStatus)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={appointment.status}>{appointment.status_display}</option>
                      {availableTransitions.map((transition) => (
                        <option key={transition} value={transition}>
                          {transition.charAt(0).toUpperCase() + transition.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Patient and Doctor Info */}
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{appointment.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 break-all">{appointment.patient_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">{appointment.patient_phone}</p>
                </div>
                <Link
                  href={`/patients/${appointment.patient}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Patient Details →
                </Link>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{appointment.doctor_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 break-all">{appointment.doctor_email}</p>
                </div>
                {appointment.doctor_specializations?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Specializations</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {appointment.doctor_specializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="text-gray-900">{formatDateTime(appointment.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="text-gray-900">{formatDateTime(appointment.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isDeleting ? 'Deleting...' : 'Delete Appointment'}
          </button>

          <div className="flex gap-4">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditReason(appointment.reason || '');
                  setEditNotes(appointment.notes || '');
                  setEditStatus(appointment.status);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Edit Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
