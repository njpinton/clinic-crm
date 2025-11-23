'use client';

import React from 'react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  description?: string;
}

interface QuickActionsCardProps {
  actions?: QuickAction[];
}

function DefaultPlus() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
    </svg>
  );
}

function DefaultUser() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 16.5a6 6 0 11 0-12 6 6 0 0110 12zM7 20H5v-5h2v5zm8-6v6h2v-6h-2z" />
    </svg>
  );
}

function DefaultCalendar() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}

function DefaultBeaker() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7 2a1 1 0 00-.707.293l-7 7a1 1 0 000 1.414l7 7a1 1 0 001.414 0l7-7a1 1 0 000-1.414l-7-7A1 1 0 007 2zm4 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
    </svg>
  );
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-700'
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-700'
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    icon: 'bg-orange-100 text-orange-600',
    text: 'text-orange-700'
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-700'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-700'
  }
};

const defaultActions: QuickAction[] = [
  {
    id: 'add-patient',
    label: 'Add Patient',
    href: '/patients/new',
    icon: <DefaultUser />,
    color: 'blue',
    description: 'Register a new patient'
  },
  {
    id: 'schedule-appointment',
    label: 'Schedule Appointment',
    href: '/appointments',
    icon: <DefaultCalendar />,
    color: 'green',
    description: 'Book an appointment'
  },
  {
    id: 'lab-order',
    label: 'Lab Order',
    href: '/laboratory',
    icon: <DefaultBeaker />,
    color: 'orange',
    description: 'Create lab test order'
  },
  {
    id: 'new-prescription',
    label: 'New Prescription',
    href: '/prescriptions',
    icon: <DefaultPlus />,
    color: 'purple',
    description: 'Write a prescription'
  }
];

export default function QuickActionsCard({
  actions = defaultActions
}: QuickActionsCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`${colors.bg} p-4 rounded-lg border border-gray-200 transition-all hover:shadow-md group`}
            >
              <div className={`${colors.icon} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h4 className={`${colors.text} font-medium text-sm`}>{action.label}</h4>
              {action.description && (
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
