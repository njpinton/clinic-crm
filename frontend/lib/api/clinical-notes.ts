import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type NoteType = 'soap' | 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'operative' | 'followup';

// Vital signs for SOAP notes
export interface VitalSigns {
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
}

// SOAP note details
export interface SOAPNoteDetails extends VitalSigns {
  id: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  bmi?: number;
  blood_pressure?: string;
  created_at: string;
  updated_at: string;
}

// Progress note details
export interface ProgressNoteDetails {
  id: string;
  current_status?: string;
  progress_since_last_visit?: string;
  symptoms_update?: string;
  medications_review?: string;
  treatment_effectiveness?: string;
  plan_modifications?: string;
  next_steps?: string;
  treatment_goals?: string;
  goals_achieved?: boolean;
  created_at: string;
  updated_at: string;
}

// Full clinical note with all details
export interface ClinicalNote {
  id: string;
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    mrn: string;
  };
  patient_id: string;
  doctor: {
    id: string;
    user: { id: string; first_name: string; last_name: string };
    first_name: string;
    last_name: string;
  };
  doctor_id: string;
  appointment_id?: string;
  note_type: NoteType;
  note_date: string;
  chief_complaint?: string;
  content: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_instructions?: string;
  follow_up_date?: string;
  is_signed: boolean;
  signed_at?: string;
  signed_by?: { id: string; first_name: string; last_name: string };
  attachments: any[];
  soap_details?: SOAPNoteDetails;
  progress_details?: ProgressNoteDetails;
  created_at: string;
  updated_at: string;
}

// Lightweight list view
export interface ClinicalNotesList {
  id: string;
  patient_name: string;
  doctor_name: string;
  note_type: NoteType;
  note_type_display: string;
  note_date: string;
  chief_complaint?: string;
  is_signed: boolean;
  created_at: string;
}

// Create/update payload
export interface CreateClinicalNoteInput {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  note_type: NoteType;
  note_date?: string;
  chief_complaint?: string;
  content: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_instructions?: string;
  follow_up_date?: string;
  attachments?: any[];
  soap_details?: Omit<SOAPNoteDetails, 'id' | 'created_at' | 'updated_at' | 'bmi' | 'blood_pressure'>;
  progress_details?: Omit<ProgressNoteDetails, 'id' | 'created_at' | 'updated_at'>;
}

export interface ClinicalNotesResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ClinicalNotesList[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || error.message || `Request failed: ${response.statusText}`,
      response.status,
      error
    );
  }
  return response.json();
}

export async function createClinicalNote(
  payload: CreateClinicalNoteInput,
  token?: string
): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE_URL}/api/clinical-notes/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(payload),
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNote>(response);
}

export async function fetchClinicalNotes(
  params?: {
    page?: number;
    patient_id?: string;
    doctor_id?: string;
    note_type?: NoteType;
    search?: string;
    ordering?: string;
    token?: string;
  }
): Promise<ClinicalNotesResponse> {
  const url = new URL(`${API_BASE_URL}/api/clinical-notes/`);

  if (params?.page) url.searchParams.append('page', params.page.toString());
  if (params?.patient_id) url.searchParams.append('patient_id', params.patient_id);
  if (params?.doctor_id) url.searchParams.append('doctor_id', params.doctor_id);
  if (params?.note_type) url.searchParams.append('note_type', params.note_type);
  if (params?.search) url.searchParams.append('search', params.search);
  if (params?.ordering) url.searchParams.append('ordering', params.ordering);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(params?.token && { Authorization: `Bearer ${params.token}` })
    },
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNotesResponse>(response);
}

export async function fetchClinicalNote(
  id: string,
  token?: string
): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE_URL}/api/clinical-notes/${id}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNote>(response);
}

export async function fetchClinicalNotesByPatient(
  patientId: string,
  params?: {
    page?: number;
    ordering?: string;
    token?: string;
  }
): Promise<ClinicalNotesResponse> {
  const url = new URL(`${API_BASE_URL}/api/clinical-notes/by-patient/`);
  url.searchParams.append('patient_id', patientId);

  if (params?.page) url.searchParams.append('page', params.page.toString());
  if (params?.ordering) url.searchParams.append('ordering', params.ordering);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(params?.token && { Authorization: `Bearer ${params.token}` })
    },
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNotesResponse>(response);
}

export async function fetchClinicalNotesByDoctor(
  doctorId: string,
  params?: {
    page?: number;
    ordering?: string;
    token?: string;
  }
): Promise<ClinicalNotesResponse> {
  const url = new URL(`${API_BASE_URL}/api/clinical-notes/by-doctor/`);
  url.searchParams.append('doctor_id', doctorId);

  if (params?.page) url.searchParams.append('page', params.page.toString());
  if (params?.ordering) url.searchParams.append('ordering', params.ordering);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(params?.token && { Authorization: `Bearer ${params.token}` })
    },
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNotesResponse>(response);
}

export async function updateClinicalNote(
  id: string,
  payload: Partial<CreateClinicalNoteInput>,
  token?: string
): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE_URL}/api/clinical-notes/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(payload),
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNote>(response);
}

export async function deleteClinicalNote(
  id: string,
  token?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clinical-notes/${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    cache: 'no-cache'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || error.message || `Failed to delete note`,
      response.status,
      error
    );
  }
}

export async function signClinicalNote(
  id: string,
  token?: string
): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE_URL}/api/clinical-notes/${id}/sign/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    cache: 'no-cache'
  });

  return handleResponse<ClinicalNote>(response);
}

export function getNoteTypes(): NoteType[] {
  return ['soap', 'progress', 'consultation', 'admission', 'discharge', 'procedure', 'operative', 'followup'];
}

export function getNoteTypeDisplay(type: NoteType): string {
  const displays: Record<NoteType, string> = {
    'soap': 'SOAP Note',
    'progress': 'Progress Note',
    'consultation': 'Consultation',
    'admission': 'Admission Note',
    'discharge': 'Discharge Summary',
    'procedure': 'Procedure Note',
    'operative': 'Operative Report',
    'followup': 'Follow-up Note'
  };
  return displays[type];
}

export function getNoteTypeColor(type: NoteType): string {
  const colors: Record<NoteType, string> = {
    'progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'soap': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'consultation': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'procedure': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'discharge': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'admission': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'operative': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'followup': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
  };
  return colors[type];
}
