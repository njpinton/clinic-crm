/**
 * QuickActionCard component for dashboard quick actions
 * Clean, professional medical interface
 */

import React from 'react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
}

export function QuickActionCard({
  title,
  description,
  icon,
  href,
  colorScheme = 'blue',
}: QuickActionCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200',
    green: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200',
    purple: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200',
    orange: 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-orange-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <a
      href={href}
      className={`block p-6 bg-gradient-to-br ${colorClasses[colorScheme]} border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${iconColorClasses[colorScheme]} transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
