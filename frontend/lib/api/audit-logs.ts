import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export';
export type AuditResource = 'patient' | 'doctor' | 'prescription' | 'appointment' | 'lab-order' | 'insurance' | 'user' | 'settings';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  description: string;
  timestamp: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
}

export interface AuditLogsResponse {
  count: number;
  results: AuditLog[];
}

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'user-1',
    userName: 'admin@clinic.com',
    action: 'create',
    resource: 'patient',
    resourceId: 'patient-10',
    description: 'Created new patient record',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log-2',
    userId: 'user-2',
    userName: 'dr.johnson@clinic.com',
    action: 'update',
    resource: 'appointment',
    resourceId: 'appt-5',
    description: 'Updated appointment status to completed',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    ipAddress: '192.168.1.101',
    changes: { status: 'scheduled -> completed' }
  },
  {
    id: 'log-3',
    userId: 'user-1',
    userName: 'admin@clinic.com',
    action: 'create',
    resource: 'prescription',
    resourceId: 'rx-10',
    description: 'Created new prescription',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log-4',
    userId: 'user-3',
    userName: 'nurse.smith@clinic.com',
    action: 'read',
    resource: 'patient',
    resourceId: 'patient-5',
    description: 'Accessed patient record',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    ipAddress: '192.168.1.102'
  },
  {
    id: 'log-5',
    userId: 'user-2',
    userName: 'dr.johnson@clinic.com',
    action: 'create',
    resource: 'lab-order',
    resourceId: 'lab-10',
    description: 'Ordered lab tests',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log-6',
    userId: 'user-1',
    userName: 'admin@clinic.com',
    action: 'delete',
    resource: 'appointment',
    resourceId: 'appt-8',
    description: 'Cancelled appointment',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log-7',
    userId: 'user-1',
    userName: 'admin@clinic.com',
    action: 'login',
    resource: 'user',
    resourceId: 'user-1',
    description: 'User logged in',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    ipAddress: '192.168.1.100'
  }
];

export async function getAuditLogs(options?: {
  token?: string;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: Date;
  endDate?: Date;
}): Promise<AuditLogsResponse> {
  try {
    let filtered = [...mockAuditLogs];

    if (options?.userId) {
      filtered = filtered.filter(l => l.userId === options.userId);
    }

    if (options?.action) {
      filtered = filtered.filter(l => l.action === options.action);
    }

    if (options?.resource) {
      filtered = filtered.filter(l => l.resource === options.resource);
    }

    if (options?.startDate) {
      const start = options.startDate.getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= start);
    }

    if (options?.endDate) {
      const end = options.endDate.getTime();
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= end);
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  } catch (error) {
    return { count: mockAuditLogs.length, results: mockAuditLogs };
  }
}

export function getActionColor(action: AuditAction): string {
  const colors: Record<AuditAction, string> = {
    'create': 'bg-green-100 text-green-800',
    'read': 'bg-blue-100 text-blue-800',
    'update': 'bg-yellow-100 text-yellow-800',
    'delete': 'bg-red-100 text-red-800',
    'login': 'bg-purple-100 text-purple-800',
    'logout': 'bg-gray-100 text-gray-800',
    'export': 'bg-indigo-100 text-indigo-800'
  };
  return colors[action];
}

export function getResourceColor(resource: AuditResource): string {
  const colors: Record<AuditResource, string> = {
    'patient': 'bg-blue-50 text-blue-700',
    'doctor': 'bg-purple-50 text-purple-700',
    'prescription': 'bg-green-50 text-green-700',
    'appointment': 'bg-orange-50 text-orange-700',
    'lab-order': 'bg-pink-50 text-pink-700',
    'insurance': 'bg-indigo-50 text-indigo-700',
    'user': 'bg-red-50 text-red-700',
    'settings': 'bg-gray-50 text-gray-700'
  };
  return colors[resource];
}
