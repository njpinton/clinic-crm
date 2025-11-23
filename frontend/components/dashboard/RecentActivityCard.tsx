'use client';

import React from 'react';
import Link from 'next/link';

interface Activity {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

interface RecentActivityCardProps {
  activities: Activity[];
  isLoading?: boolean;
  error?: string | null;
}

const iconColors = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600'
};

function DefaultIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  } catch {
    return timestamp;
  }
}

export default function RecentActivityCard({
  activities,
  isLoading = false,
  error = null
}: RecentActivityCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No activities yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className={`${iconColors[activity.color || 'blue']} p-2 rounded-full flex-shrink-0`}>
              {activity.icon || <DefaultIcon />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                <span className="font-semibold">{activity.user}</span> {activity.action}
              </p>
              <p className="text-sm text-gray-600 truncate">{activity.resource}</p>
              <p className="text-xs text-gray-400 mt-1">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/audit-logs" className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
        View all activities →
      </Link>
    </div>
  );
}
