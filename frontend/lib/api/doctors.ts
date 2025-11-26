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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  credentials: DoctorCredential;
  availability: DoctorAvailability;
  status: DoctorStatus;
  bio?: string;
  profileImage?: string;
  yearsOfExperience?: number;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorCreatePayload {
  firstName: string;
  lastName: string;
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
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    phone: '(555) 123-4567',
    specialty: 'Cardiology',
    credentials: {
      licenseNumber: 'MD-12345',
      licenseState: 'CA',
      deaNumber: 'DJ1234567',
      npiNumber: '1234567890'
    },
    availability: {
      mondayStart: '08:00',
      mondayEnd: '17:00',
      tuesdayStart: '08:00',
      tuesdayEnd: '17:00',
      wednesdayStart: '08:00',
      wednesdayEnd: '17:00',
      thursdayStart: '08:00',
      thursdayEnd: '17:00',
      fridayStart: '08:00',
      fridayEnd: '17:00'
    },
    status: 'active',
    bio: 'Board-certified cardiologist with 15 years of experience',
    yearsOfExperience: 15,
    department: 'Cardiology',
    boardCertifications: ['American Board of Internal Medicine', 'American Board of Cardiovascular Disease'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-11-25T12:00:00Z'
  },
  {
    id: 'doc-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@clinic.com',
    phone: '(555) 234-5678',
    specialty: 'Orthopedics',
    credentials: {
      licenseNumber: 'MD-12346',
      licenseState: 'CA',
      deaNumber: 'DJ1234568',
      npiNumber: '1234567891'
    },
    availability: {
      mondayStart: '09:00',
      mondayEnd: '18:00',
      tuesdayStart: '09:00',
      tuesdayEnd: '18:00',
      wednesdayStart: '09:00',
      wednesdayEnd: '18:00',
      thursdayStart: '09:00',
      thursdayEnd: '18:00',
      fridayStart: '09:00',
      fridayEnd: '18:00'
    },
    status: 'active',
    bio: 'Specialized in orthopedic surgery and sports medicine',
    yearsOfExperience: 12,
    department: 'Orthopedics',
    boardCertifications: ['American Board of Orthopedic Surgery'],
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-11-25T12:00:00Z'
  },
  {
    id: 'doc-3',
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@clinic.com',
    phone: '(555) 345-6789',
    specialty: 'Pediatrics',
    credentials: {
      licenseNumber: 'MD-12347',
      licenseState: 'CA',
      deaNumber: 'DJ1234569',
      npiNumber: '1234567892'
    },
    availability: {
      mondayStart: '08:00',
      mondayEnd: '16:00',
      tuesdayStart: '08:00',
      tuesdayEnd: '16:00',
      wednesdayStart: '08:00',
      wednesdayEnd: '16:00',
      thursdayStart: '08:00',
      thursdayEnd: '16:00',
      fridayStart: '08:00',
      fridayEnd: '16:00'
    },
    status: 'active',
    bio: 'Dedicated to providing compassionate pediatric care',
    yearsOfExperience: 10,
    department: 'Pediatrics',
    boardCertifications: ['American Board of Pediatrics'],
    createdAt: '2024-03-05T08:00:00Z',
    updatedAt: '2024-11-25T12:00:00Z'
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
      filtered = filtered.filter(d => d.specialty === options.specialty);
    }

    if (options?.status) {
      filtered = filtered.filter(d => d.status === options.status);
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
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        specialty: payload.specialty,
        credentials: {
          licenseNumber: payload.licenseNumber,
          licenseState: payload.licenseState,
          deaNumber: payload.deaNumber,
          npiNumber: payload.npiNumber,
          boardCertifications: payload.boardCertifications
        },
        availability: payload.availability || {},
        status: payload.status,
        bio: payload.bio,
        yearsOfExperience: payload.yearsOfExperience,
        department: payload.department,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
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
