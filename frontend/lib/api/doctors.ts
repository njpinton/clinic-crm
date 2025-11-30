import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type DoctorStatus = 'active' | 'inactive' | 'on-leave' | 'retired';

export interface DoctorCredential {
  licenseNumber: string;
  licenseState: string;
  deaNumber?: string;
  npiNumber?: string;
  boardCertifications?: string[];
}

export interface DoctorAvailability {
  mondayStart?: string; // HH:MM
  mondayEnd?: string;
  tuesdayStart?: string;
  tuesdayEnd?: string;
  wednesdayStart?: string;
  wednesdayEnd?: string;
  thursdayStart?: string;
  thursdayEnd?: string;
  fridayStart?: string;
  fridayEnd?: string;
  saturdayStart?: string;
  saturdayEnd?: string;
  sundayStart?: string;
  sundayEnd?: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  user_details?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  license_number: string;
  npi_number?: string;
  dea_number?: string;
  specializations?: Array<{ id: string; name: string }>;
  board_certified?: boolean;
  years_of_experience?: number;
  consultation_fee?: string;
  is_accepting_patients?: boolean;
  bio?: string;
  education?: string;
  languages?: string;
  credentials?: DoctorCredential[];
  status?: DoctorStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorCreatePayload {
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  licenseState: string;
  deaNumber?: string;
  npiNumber?: string;
  status: DoctorStatus;
  bio?: string;
  yearsOfExperience?: number;
  department?: string;
  availability?: DoctorAvailability;
  boardCertifications?: string[];
}

export interface DoctorsResponse {
  count: number;
  results: Doctor[];
}

const specialties = [
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Psychiatry',
  'Surgery',
  'Internal Medicine',
  'Family Medicine',
  'Emergency Medicine'
];

// Mock data for doctors
const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    full_name: 'Dr. Sarah Johnson',
    user_details: {
      id: 'user-1',
      email: 'sarah.johnson@clinic.com',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '(555) 123-4567'
    },
    license_number: 'MD-12345',
    dea_number: 'DJ1234567',
    npi_number: '1234567890',
    board_certified: true,
    years_of_experience: 15,
    consultation_fee: '150.00',
    is_accepting_patients: true,
    bio: 'Board-certified cardiologist with 15 years of experience',
    education: 'MD from Johns Hopkins University',
    languages: 'English, Spanish',
    specializations: [{ id: 'spec-1', name: 'Cardiology' }],
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-11-25T12:00:00Z'
  }
];

export async function getDoctors(options?: {
  token?: string;
  specialty?: string;
  status?: DoctorStatus;
}): Promise<DoctorsResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    let filtered = [...mockDoctors];

    if (options?.specialty) {
      filtered = filtered.filter(d => d.specializations?.some(s => s.name.toLowerCase() === options.specialty?.toLowerCase()));
    }

    return {
      count: filtered.length,
      results: filtered
    };
  } catch (error) {
    return {
      count: mockDoctors.length,
      results: mockDoctors
    };
  }
}

export async function getDoctor(id: string, token?: string): Promise<Doctor> {
  const doctor = mockDoctors.find(d => d.id === id);
  if (!doctor) {
    throw new ApiError(`Doctor ${id} not found`, 404, {});
  }
  return doctor;
}

export async function createDoctor(
  payload: DoctorCreatePayload,
  token?: string
): Promise<Doctor> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/doctors/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to create doctor: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, create a mock doctor
    if (error instanceof ApiError && error.status === 404) {
      const newDoctor: Doctor = {
        id: `doc-${Date.now()}`,
        full_name: payload.full_name,
        license_number: payload.licenseNumber,
        dea_number: payload.deaNumber,
        npi_number: payload.npiNumber,
        specializations: payload.specialty ? [{ id: `spec-${Date.now()}`, name: payload.specialty }] : undefined,
        status: payload.status,
        bio: payload.bio,
        years_of_experience: payload.yearsOfExperience,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockDoctors.push(newDoctor);
      return newDoctor;
    }
    throw error;
  }
}

export async function updateDoctor(
  id: string,
  payload: Partial<DoctorCreatePayload>,
  token?: string
): Promise<Doctor> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/doctors/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to update doctor: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, update mock doctor
    const index = mockDoctors.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDoctors[index] = {
        ...mockDoctors[index],
        ...payload,
        updated_at: new Date().toISOString()
      } as Doctor;
      return mockDoctors[index];
    }
    throw error;
  }
}

export async function deleteDoctor(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/doctors/${id}/`, {
      method: 'DELETE',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to delete doctor: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }
  } catch (error) {
    // For demo purposes, remove from mock data
    const index = mockDoctors.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDoctors.splice(index, 1);
    }
    throw error;
  }
}

export function getSpecialties(): string[] {
  return specialties;
}

export function getStatuses(): DoctorStatus[] {
  return ['active', 'inactive', 'on-leave', 'retired'];
}

// Alias for compatibility
export const fetchDoctors = getDoctors;
export type DoctorListResponse = DoctorsResponse;
