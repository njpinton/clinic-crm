'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppointmentsPage() {
  const [appointments] = useState([
    { id: 1, patient: 'John Doe', doctor: 'Dr. Sarah Johnson', date: '2025-11-24 10:00 AM', status: 'Scheduled' },
    { id: 2, patient: 'Jane Smith', doctor: 'Dr. Michael Chen', date: '2025-11-24 02:00 PM', status: 'Scheduled' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
          </div>
          <Link 
            href="/appointments/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            + Schedule Appointment
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Doctor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{apt.patient}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{apt.doctor}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{apt.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{apt.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm"><button className="text-blue-600 hover:text-blue-800">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
