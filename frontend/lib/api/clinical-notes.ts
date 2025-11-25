import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type NoteType = 'progress' | 'soap' | 'consultation' | 'procedure' | 'discharge';

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  noteType: NoteType;
  title: string;
  content: string;
  visitDate: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteCreatePayload {
  patientId: string;
  doctorId: string;
  noteType: NoteType;
  title: string;
  content: string;
  visitDate: string;
}

export interface ClinicalNotesResponse {
  count: number;
  results: ClinicalNote[];
}

const mockNotes: ClinicalNote[] = [
  {
    id: 'note-1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    noteType: 'progress',
    title: 'Follow-up: Hypertension Management',
    content: 'Patient reports compliance with medication. BP readings are stable at 130/80. Continue current regimen.',
    visitDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
  },
  {
    id: 'note-2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    noteType: 'soap',
    title: 'Acute Upper Respiratory Infection',
    content: 'S: Patient presents with cough, sore throat, and low-grade fever.\nO: Temp 99.5F, throat erythema noted.\nA: URI, viral etiology likely.\nP: Supportive care, rest, hydration. Return if symptoms worsen.',
    visitDate: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
  },
  {
    id: 'note-3',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    noteType: 'consultation',
    title: 'Cardiology Consultation',
    content: 'Pt reviewed for cardiac evaluation prior to surgery. EKG shows normal sinus rhythm. No contraindications to surgical intervention identified.',
    visitDate: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString()
  },
  {
    id: 'note-4',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    doctorId: 'doc-3',
    doctorName: 'Dr. Emily Brown',
    noteType: 'procedure',
    title: 'Suture Removal',
    content: 'Successfully removed 15 sutures from laceration on left forearm. Wound healing well with minimal scarring. Patient instructed on wound care.',
    visitDate: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString()
  }
];

export async function getClinicalNotes(options?: {
  token?: string;
  patientId?: string;
  doctorId?: string;
  noteType?: NoteType;
}): Promise<ClinicalNotesResponse> {
  try {
    let filtered = [...mockNotes];

    if (options?.patientId) {
      filtered = filtered.filter(n => n.patientId === options.patientId);
    }

    if (options?.doctorId) {
      filtered = filtered.filter(n => n.doctorId === options.doctorId);
    }

    if (options?.noteType) {
      filtered = filtered.filter(n => n.noteType === options.noteType);
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    };
  } catch (error) {
    return { count: mockNotes.length, results: mockNotes };
  }
}

export async function getClinicalNote(id: string, token?: string): Promise<ClinicalNote> {
  const note = mockNotes.find(n => n.id === id);
  if (!note) {
    throw new ApiError(`Clinical note ${id} not found`, 404, {});
  }
  return note;
}

export async function createClinicalNote(
  payload: ClinicalNoteCreatePayload,
  token?: string
): Promise<ClinicalNote> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clinical-notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(`Failed to create note: ${response.statusText}`, response.status, {});
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const newNote: ClinicalNote = {
        id: `note-${Date.now()}`,
        patientId: payload.patientId,
        patientName: 'Patient',
        doctorId: payload.doctorId,
        doctorName: 'Doctor',
        noteType: payload.noteType,
        title: payload.title,
        content: payload.content,
        visitDate: payload.visitDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockNotes.push(newNote);
      return newNote;
    }
    throw error;
  }
}

export async function updateClinicalNote(
  id: string,
  payload: Partial<ClinicalNoteCreatePayload>,
  token?: string
): Promise<ClinicalNote> {
  const index = mockNotes.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNotes[index] = {
      ...mockNotes[index],
      ...payload,
      updatedAt: new Date().toISOString()
    } as ClinicalNote;
    return mockNotes[index];
  }
  throw new ApiError(`Note not found`, 404, {});
}

export async function deleteClinicalNote(id: string, token?: string): Promise<void> {
  const index = mockNotes.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNotes.splice(index, 1);
  }
}

export function getNoteTypes(): NoteType[] {
  return ['progress', 'soap', 'consultation', 'procedure', 'discharge'];
}

export function getNoteTypeColor(type: NoteType): string {
  const colors: Record<NoteType, string> = {
    'progress': 'bg-blue-100 text-blue-800',
    'soap': 'bg-purple-100 text-purple-800',
    'consultation': 'bg-green-100 text-green-800',
    'procedure': 'bg-orange-100 text-orange-800',
    'discharge': 'bg-red-100 text-red-800'
  };
  return colors[type];
}
