'use client';

/**
 * Doctors Management Page
 * Manage healthcare providers and their credentials
 */

import { useState } from 'react';

export default function DoctorsPage() {
  const [doctors] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', license: 'MD-12345', status: 'Active' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Pediatrics', license: 'MD-12346', status: 'Active' },
    { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Orthopedics', license: 'MD-12347', status: 'Active' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600 mt-1">Manage healthcare providers and credentials</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add Doctor
          </button>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Specialty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">License</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{doctor.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialty}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doctor.license}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-700 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Doctors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{doctors.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{doctors.filter(d => d.status === 'Active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Specialties</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
