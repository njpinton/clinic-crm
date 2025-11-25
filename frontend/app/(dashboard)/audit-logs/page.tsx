'use client';

/**
 * Audit Logs Page - Read-only compliance logging
 * Track all system actions for HIPAA compliance and security auditing
 */

import { useEffect, useState, useMemo } from 'react';
import { getAuditLogs, AuditLog, getActionColor, getResourceColor } from '@/lib/api/audit-logs';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  // Fetch audit logs on mount
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getAuditLogs();
        setLogs(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        searchTerm === '' ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.includes(searchTerm);

      const matchesAction = actionFilter === '' || log.action === actionFilter;
      const matchesResource = resourceFilter === '' || log.resource === resourceFilter;

      return matchesSearch && matchesAction && matchesResource;
    });
  }, [logs, searchTerm, actionFilter, resourceFilter]);

  const actions = useMemo(() => {
    return [...new Set(logs.map(l => l.action))].sort();
  }, [logs]);

  const resources = useMemo(() => {
    return [...new Set(logs.map(l => l.resource))].sort();
  }, [logs]);

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">HIPAA compliance and access logging - All activities are tracked and immutable</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="User, action, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                id="action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-1">
                Resource
              </label>
              <select
                id="resource"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Resources</option>
                {resources.map(resource => (
                  <option key={resource} value={resource}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading audit logs...</div>
          </div>
        ) : (
          <>
            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resource</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.userName}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getResourceColor(log.resource)}`}>
                              {log.resource.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{log.description}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{log.ipAddress || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{logs.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Unique Users</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {[...new Set(logs.map(l => l.userId))].length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Action Types</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{actions.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Resource Types</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{resources.length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
