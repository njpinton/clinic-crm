/**
 * API client functions for patient endpoints.
 * Handles all CRUD operations for patients.
 */

import type { Patient, PatientsResponse } from '@/types/patient';
import type { CreatePatientInput, UpdatePatientInput } from '@/lib/validations/patient';

/**
 * Base API URL from environment variables
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

/**
 * API error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorData;

    try {
      errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If response is not JSON, use default error message
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Fetch all patients with optional filters
 */
export async function fetchPatients(params?: {
  page?: number;
  search?: string;
  gender?: string;
  ordering?: string;
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

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
export async function fetchPatient(id: string): Promise<Patient> {
  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  });

  return handleResponse<Patient>(response);
}

/**
 * Create a new patient
 */
export async function createPatient(data: CreatePatientInput): Promise<Patient> {
  const response = await fetch(`${API_URL}/api/patients/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Update a patient (full update)
 */
export async function updatePatient(id: string, data: CreatePatientInput): Promise<Patient> {
  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Partially update a patient
 */
export async function patchPatient(id: string, data: UpdatePatientInput): Promise<Patient> {
  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Patient>(response);
}

/**
 * Delete a patient (soft delete)
 */
export async function deletePatient(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/patients/${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return handleResponse<void>(response);
}

/**
 * Restore a soft-deleted patient (admin only)
 */
export async function restorePatient(id: string): Promise<Patient> {
  const response = await fetch(`${API_URL}/api/patients/${id}/restore/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
