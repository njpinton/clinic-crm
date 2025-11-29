/**
 * API client functions for patient endpoints.
 * Handles all CRUD operations for patients.
 */

import type { Patient, PatientsResponse } from '@/types/patient';
import type { CreatePatientInput, UpdatePatientInput } from '@/lib/validations/patient';
import { handleResponse, API_URL, ApiError } from './client';

// Re-export ApiError and Patient types for backward compatibility
export { ApiError };
export type { Patient, PatientsResponse };

/**
 * Fetch all patients with optional filters
 */
export async function fetchPatients(params?: {
  page?: number;
  search?: string;
  gender?: string;
  ordering?: string;
  token?: string;
}): Promise<PatientsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.search) {
    searchParams.append('search', params.search);
  }
  if (params?.gender) {
    searchParams.append('gender', params.gender);
  }
  if (params?.ordering) {
    searchParams.append('ordering', params.ordering);
  }

  const url = `${API_URL}/api/patients/?${searchParams.toString()}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (params?.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    // Include credentials for session-based auth
    credentials: 'include',
    // Disable caching for patient data (PHI)
    cache: 'no-store',
  });

  return handleResponse<PatientsResponse>(response);
}

/**
 * Fetch a single patient by ID
 */
export async function fetchPatient(id: string, token?: string): Promise<Patient> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  return handleResponse<Patient>(response);
}

/**
 * Create a new patient
 */
export async function createPatient(data: CreatePatientInput, token?: string): Promise<Patient> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Update a patient (full update)
 */
export async function updatePatient(id: string, data: CreatePatientInput, token?: string): Promise<Patient> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Partially update a patient
 */
export async function patchPatient(id: string, data: UpdatePatientInput, token?: string): Promise<Patient> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Delete a patient (soft delete)
 */
export async function deletePatient(id: string, token?: string): Promise<void> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  return handleResponse<void>(response);
}

/**
 * Restore a soft-deleted patient (admin only)
 */
export async function restorePatient(id: string, token?: string): Promise<Patient> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/patients/${id}/restore/`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  return handleResponse<Patient>(response);
}

/**
 * Search patients by query
 * Convenience wrapper around fetchPatients
 */
export async function searchPatients(query: string): Promise<PatientsResponse> {
  return fetchPatients({ search: query });
}

/**
 * Filter patients by gender
 * Convenience wrapper around fetchPatients
 */
export async function filterPatientsByGender(gender: string): Promise<PatientsResponse> {
  return fetchPatients({ gender });
}
