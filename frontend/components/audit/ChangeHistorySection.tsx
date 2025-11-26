'use client';

import { useEffect, useState } from 'react';
import { getResourceAuditLogs, getActionColor, type AuditLog } from '@/lib/api/audit-logs';

interface ChangeHistorySectionProps {
  resourceType: string;
  resourceId: string;
  token?: string;
}

/**
 * Change History Section - Shows audit trail for a specific resource
 * Similar to Odoo's change history at the bottom of records
 */
export function ChangeHistorySection({ resourceType, resourceId, token }: ChangeHistorySectionProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await getResourceAuditLogs(resourceType, resourceId, token);
        setLogs(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load change history');
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [resourceType, resourceId, token]);

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-500">Loading change history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p className="text-sm text-red-600">Error loading change history: {error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-500">No change history available</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">
            Change History ({logs.length})
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>

      {/* Change History List */}
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs">
                {/* Icon/Indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action Badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>

                    {/* User */}
                    <span className="font-medium text-gray-900">{log.user_email}</span>

                    {/* Time */}
                    <span className="text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Details */}
                  {log.details && (
                    <p className="mt-1 text-gray-700">{log.details}</p>
                  )}

                  {/* Additional Info (collapsed by default) */}
                  {log.ip_address && (
                    <p className="mt-1 text-gray-500">
                      IP: {log.ip_address}
                    </p>
                  )}

                  {/* Error Message */}
                  {!log.was_successful && log.error_message && (
                    <p className="mt-1 text-red-600">
                      Error: {log.error_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
