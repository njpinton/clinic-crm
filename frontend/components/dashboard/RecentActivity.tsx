/**
 * RecentActivity component for dashboard
 * Displays recent patient activities and appointments
 */

'use client';

import React from 'react';

interface Activity {
  id: string;
  type: 'appointment' | 'patient' | 'lab' | 'prescription';
  title: string;
  description: string;
  time: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'Appointment with Dr. Smith',
    description: 'John Doe - Annual Checkup',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: '2',
    type: 'patient',
    title: 'New Patient Registered',
    description: 'Jane Smith - MRN: 1234567',
    time: '3 hours ago',
    status: 'completed',
  },
  {
    id: '3',
    type: 'lab',
    title: 'Lab Results Available',
    description: 'Blood Test - Michael Johnson',
    time: '5 hours ago',
    status: 'pending',
  },
  {
    id: '4',
    type: 'prescription',
    title: 'Prescription Filled',
    description: 'Sarah Williams - Lisinopril 10mg',
    time: '6 hours ago',
    status: 'completed',
  },
];

export function RecentActivity() {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'appointment':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'patient':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'lab':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
          </svg>
        );
      case 'prescription':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status?: Activity['status']) => {
    if (!status) return null;

    const badges = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-100">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h3>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <a
          href="#"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center"
        >
          View all activity
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
