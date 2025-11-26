import { handleResponse, API_URL } from './client';

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LIST' | 'EXPORT' | 'PRINT';

export interface AuditLog {
  id: string;
  user: string;
  user_email: string;
  user_role: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  details: string;
  ip_address: string;
  user_agent: string;
  request_method: string;
  request_path: string;
  query_params: string;
  was_successful: boolean;
  error_message: string;
  created_at: string; // ISO string
}

export interface AuditLogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

/**
 * Fetch all audit logs with optional filters
 */
export async function getAuditLogs(options?: {
  token?: string;
  action?: AuditAction;
  resource_type?: string;
  user?: string;
  page?: number;
}): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();

  if (options?.action) {
    searchParams.append('action', options.action);
  }
  if (options?.resource_type) {
    searchParams.append('resource_type', options.resource_type);
  }
  if (options?.user) {
    searchParams.append('user', options.user);
  }
  if (options?.page) {
    searchParams.append('page', options.page.toString());
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}/api/audit-logs/?${searchParams.toString()}`, {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  return handleResponse<AuditLogsResponse>(response);
}

/**
 * Fetch audit logs for a specific resource (e.g., a patient)
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  token?: string
): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('resource_type', resourceType);
  searchParams.append('resource_id', resourceId);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/audit-logs/?${searchParams.toString()}`, {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  return handleResponse<AuditLogsResponse>(response);
}

/**
 * Get color class for action badge
 */
export function getActionColor(action: AuditAction): string {
  const colors: Record<AuditAction, string> = {
    'CREATE': 'bg-green-100 text-green-800',
    'READ': 'bg-blue-100 text-blue-800',
    'UPDATE': 'bg-yellow-100 text-yellow-800',
    'DELETE': 'bg-red-100 text-red-800',
    'LIST': 'bg-purple-100 text-purple-800',
    'EXPORT': 'bg-indigo-100 text-indigo-800',
    'PRINT': 'bg-pink-100 text-pink-800'
  };
  return colors[action];
}
