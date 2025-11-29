'use client';

import Link from 'next/link';
import { DashboardAppointment } from '@/lib/api/dashboard';

interface DailyQueueCardProps {
  appointments: DashboardAppointment[];
  isLoading?: boolean;
  error?: string | null;
}

export default function DailyQueueCard({
  appointments,
  isLoading = false,
  error = null
}: DailyQueueCardProps) {
  
  // Filter for today's appointments
  const today = new Date().toDateString();
  const todaysAppointments = appointments.filter(apt => 
    new Date(apt.dateTime).toDateString() === today
  ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Mocking some "Checked In" status since the API only returns scheduled/confirmed
  // In a real app, this would come from the backend status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAction = (apt: DashboardAppointment) => {
    if (apt.status === 'scheduled' || apt.status === 'confirmed') {
      return (
        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
          Check In
        </button>
      );
    } else if (apt.status === 'checked-in') {
       return (
        <Link 
          href={`/triage/${apt.id}`}
          className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition-colors"
        >
          Triage
        </Link>
      );
    } else if (apt.status === 'in-progress') {
       return (
        <Link 
          href={`/clinical-notes/new?appointment=${apt.id}`}
          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
        >
          Doctor Visit
        </Link>
      );
    } else if (apt.status === 'completed') {
       return (
        <Link 
          href={`/billing/${apt.id}`}
          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
        >
          Bill
        </Link>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Patient Queue</h2>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Patient Queue</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Patient Queue</h2>
        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
          {todaysAppointments.length} Patients
        </span>
      </div>

      {todaysAppointments.length === 0 ? (
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 max-h-[400px] pr-2">
          {todaysAppointments.map((apt) => {
            const time = new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={apt.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-bold text-gray-900">{time}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-1 capitalize ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{apt.patientName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {apt.doctorName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{apt.type}</p>
                  </div>
                </div>
                
                <div>
                  {getAction(apt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link href="/appointments" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center">
          View Full Schedule
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
