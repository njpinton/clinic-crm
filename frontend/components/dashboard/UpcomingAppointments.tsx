/**
 * UpcomingAppointments component for dashboard
 * Displays today's and upcoming appointments
 */

'use client';

import React from 'react';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed';
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'John Doe',
    doctorName: 'Dr. Sarah Smith',
    time: '09:00 AM',
    type: 'Annual Checkup',
    status: 'confirmed',
  },
  {
    id: '2',
    patientName: 'Jane Williams',
    doctorName: 'Dr. Michael Brown',
    time: '10:30 AM',
    type: 'Follow-up',
    status: 'confirmed',
  },
  {
    id: '3',
    patientName: 'Robert Johnson',
    doctorName: 'Dr. Sarah Smith',
    time: '02:00 PM',
    type: 'Consultation',
    status: 'scheduled',
  },
  {
    id: '4',
    patientName: 'Emily Davis',
    doctorName: 'Dr. Michael Brown',
    time: '03:30 PM',
    type: 'Lab Review',
    status: 'scheduled',
  },
];

export function UpcomingAppointments() {
  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      scheduled: 'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
        <span className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {mockAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-md">
                    {appointment.time.split(':')[0]}
                    <span className="text-xs ml-0.5">
                      {appointment.time.includes('AM') ? 'AM' : 'PM'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {appointment.patientName}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{appointment.doctorName}</p>
                  <p className="text-xs text-gray-500 mt-1">{appointment.type}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <a
          href="/appointments"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
        >
          View all appointments
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          New Appointment
        </button>
      </div>
    </div>
  );
}
