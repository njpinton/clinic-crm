import { ApiError } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TriageAssessment {
  id: string;
  appointment: string;
  performed_by: string;
  performed_by_name: string;
  chief_complaint: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
  created_at: string;
}

export interface TriageCreatePayload {
  appointment: string;
  chief_complaint: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export async function createTriageAssessment(
  payload: TriageCreatePayload,
  token: string
): Promise<TriageAssessment> {
  const response = await fetch(`${API_BASE_URL}/api/triage-assessments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to create triage assessment: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }

  return response.json();
}

export async function getTriageAssessment(
  appointmentId: string,
  token: string
): Promise<TriageAssessment | null> {
  const response = await fetch(`${API_BASE_URL}/api/triage-assessments/?appointment=${appointmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch triage assessment: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }

  const data = await response.json();
  // Filter logic assumes backend filtering works, but list endpoint returns array
  const results = Array.isArray(data) ? data : data.results;
  return results.length > 0 ? results[0] : null;
}
