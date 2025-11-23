'use client';

import React from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface UpcomingAppointmentsCardProps {
  appointments: Appointment[];
  isLoading?: boolean;
  error?: string | null;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const appointmentTypeColors = {
  consultation: 'bg-purple-50 border-purple-200',
  'follow-up': 'bg-blue-50 border-blue-200',
  'check-up': 'bg-green-50 border-green-200',
  'lab-work': 'bg-orange-50 border-orange-200',
  other: 'bg-gray-50 border-gray-200'
};

function formatDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateTimeString;
  }
}

export default function UpcomingAppointmentsCard({
  appointments,
  isLoading = false,
  error = null
}: UpcomingAppointmentsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No upcoming appointments</p>
          <Link href="/appointments" className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
            Schedule an appointment →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
      <div className="space-y-3">
        {appointments.slice(0, 5).map((appointment) => (
          <Link
            key={appointment.id}
            href={`/appointments`}
            className={`block p-4 border rounded-lg transition-colors hover:shadow-md ${appointmentTypeColors[appointment.type as keyof typeof appointmentTypeColors] || appointmentTypeColors.other}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{appointment.patientName}</p>
                <p className="text-sm text-gray-600">Dr. {appointment.doctorName}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(appointment.dateTime)}</p>
              </div>
              <span className={`${statusColors[appointment.status]} px-2 py-1 rounded text-xs font-medium whitespace-nowrap`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/appointments" className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
        View all appointments →
      </Link>
    </div>
  );
}
