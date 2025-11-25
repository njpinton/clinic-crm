import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type PrescriptionStatus = 'pending' | 'dispensed' | 'refunded' | 'voided' | 'expired';
export type Frequency = 'once' | 'daily' | 'twice-daily' | 'three-times-daily' | 'four-times-daily' | 'weekly' | 'monthly';
export type Route = 'oral' | 'injection' | 'topical' | 'inhaled' | 'nasal' | 'rectal' | 'transdermal';

export interface Medication {
  name: string;
  generic: string;
  strength: string;
  form: string; // tablet, capsule, liquid, injection, etc
  ndc?: string; // National Drug Code
}

export interface Dosage {
  amount: number;
  unit: string; // mg, ml, g, etc
  frequency: Frequency;
  route: Route;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medication: Medication;
  dosage: Dosage;
  quantity: number;
  refills: number;
  status: PrescriptionStatus;
  dateIssued: string; // ISO string
  dateExpired?: string;
  dateDispensed?: string;
  indications?: string; // Why the medication is prescribed
  contraindications?: string;
  notes?: string;
  pharmacyId?: string;
  pharmacyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionCreatePayload {
  patientId: string;
  doctorId: string;
  medication: Medication;
  dosage: Dosage;
  quantity: number;
  refills?: number;
  indications?: string;
  contraindications?: string;
  notes?: string;
  pharmacyId?: string;
}

export interface PrescriptionsResponse {
  count: number;
  results: Prescription[];
}

// Mock medications database
const mockMedications: Medication[] = [
  { name: 'Lisinopril', generic: 'Lisinopril', strength: '10 mg', form: 'tablet', ndc: '0006-0910-31' },
  { name: 'Amoxicillin', generic: 'Amoxicillin', strength: '500 mg', form: 'capsule', ndc: '0115-1490-12' },
  { name: 'Metformin', generic: 'Metformin', strength: '500 mg', form: 'tablet', ndc: '0378-0181-05' },
  { name: 'Atorvastatin', generic: 'Atorvastatin', strength: '20 mg', form: 'tablet', ndc: '0071-1091-40' },
  { name: 'Omeprazole', generic: 'Omeprazole', strength: '20 mg', form: 'capsule', ndc: '0187-0154-60' },
  { name: 'Sertraline', generic: 'Sertraline', strength: '50 mg', form: 'tablet', ndc: '0068-0573-60' },
  { name: 'Ibuprofen', generic: 'Ibuprofen', strength: '200 mg', form: 'tablet', ndc: '0041-1340-10' },
  { name: 'Albuterol', generic: 'Albuterol', strength: '90 mcg', form: 'inhaled', ndc: '0187-0197-32' }
];

// Mock data for prescriptions
const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    medication: mockMedications[0],
    dosage: {
      amount: 10,
      unit: 'mg',
      frequency: 'daily',
      route: 'oral',
      instructions: 'Take one tablet once daily in the morning'
    },
    quantity: 30,
    refills: 3,
    status: 'dispensed',
    dateIssued: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    dateDispensed: new Date(Date.now() - 29 * 24 * 3600000).toISOString(),
    indications: 'Hypertension',
    pharmacyId: 'pharmacy-1',
    pharmacyName: 'Main Pharmacy',
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 29 * 24 * 3600000).toISOString()
  },
  {
    id: 'rx-2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    medication: mockMedications[1],
    dosage: {
      amount: 500,
      unit: 'mg',
      frequency: 'three-times-daily',
      route: 'oral',
      instructions: 'Take one capsule three times daily for 10 days'
    },
    quantity: 30,
    refills: 0,
    status: 'dispensed',
    dateIssued: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    dateDispensed: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    indications: 'Bacterial infection',
    pharmacyId: 'pharmacy-1',
    pharmacyName: 'Main Pharmacy',
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
  },
  {
    id: 'rx-3',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    medication: mockMedications[2],
    dosage: {
      amount: 500,
      unit: 'mg',
      frequency: 'twice-daily',
      route: 'oral',
      instructions: 'Take one tablet with meals twice daily'
    },
    quantity: 60,
    refills: 5,
    status: 'dispensed',
    dateIssued: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    dateDispensed: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    indications: 'Type 2 Diabetes',
    pharmacyId: 'pharmacy-2',
    pharmacyName: 'Downtown Pharmacy',
    createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString()
  },
  {
    id: 'rx-4',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    doctorId: 'doc-3',
    doctorName: 'Dr. Emily Brown',
    medication: mockMedications[3],
    dosage: {
      amount: 20,
      unit: 'mg',
      frequency: 'daily',
      route: 'oral',
      instructions: 'Take one tablet once daily in the evening'
    },
    quantity: 30,
    refills: 11,
    status: 'pending',
    dateIssued: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    indications: 'High cholesterol',
    createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
  },
  {
    id: 'rx-5',
    patientId: 'patient-5',
    patientName: 'David Lee',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    medication: mockMedications[4],
    dosage: {
      amount: 20,
      unit: 'mg',
      frequency: 'daily',
      route: 'oral',
      instructions: 'Take one capsule once daily in the morning, 30 minutes before food'
    },
    quantity: 30,
    refills: 3,
    status: 'dispensed',
    dateIssued: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
    dateDispensed: new Date(Date.now() - 59 * 24 * 3600000).toISOString(),
    indications: 'GERD',
    pharmacyId: 'pharmacy-1',
    pharmacyName: 'Main Pharmacy',
    createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 59 * 24 * 3600000).toISOString()
  },
  {
    id: 'rx-6',
    patientId: 'patient-6',
    patientName: 'Lisa Anderson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    medication: mockMedications[5],
    dosage: {
      amount: 50,
      unit: 'mg',
      frequency: 'daily',
      route: 'oral',
      instructions: 'Take one tablet once daily'
    },
    quantity: 30,
    refills: 11,
    status: 'dispensed',
    dateIssued: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
    dateDispensed: new Date(Date.now() - 89 * 24 * 3600000).toISOString(),
    indications: 'Depression/Anxiety',
    pharmacyId: 'pharmacy-2',
    pharmacyName: 'Downtown Pharmacy',
    createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 89 * 24 * 3600000).toISOString()
  }
];

export async function getPrescriptions(options?: {
  token?: string;
  patientId?: string;
  doctorId?: string;
  status?: PrescriptionStatus;
  pharmacyId?: string;
}): Promise<PrescriptionsResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    let filtered = [...mockPrescriptions];

    if (options?.patientId) {
      filtered = filtered.filter(p => p.patientId === options.patientId);
    }

    if (options?.doctorId) {
      filtered = filtered.filter(p => p.doctorId === options.doctorId);
    }

    if (options?.status) {
      filtered = filtered.filter(p => p.status === options.status);
    }

    if (options?.pharmacyId) {
      filtered = filtered.filter(p => p.pharmacyId === options.pharmacyId);
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime())
    };
  } catch (error) {
    return {
      count: mockPrescriptions.length,
      results: mockPrescriptions
    };
  }
}

export async function getPrescription(id: string, token?: string): Promise<Prescription> {
  const prescription = mockPrescriptions.find(p => p.id === id);
  if (!prescription) {
    throw new ApiError(`Prescription ${id} not found`, 404, {});
  }
  return prescription;
}

export async function createPrescription(
  payload: PrescriptionCreatePayload,
  token?: string
): Promise<Prescription> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/prescriptions/`, {
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
        `Failed to create prescription: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, create a mock prescription
    if (error instanceof ApiError && error.status === 404) {
      const newPrescription: Prescription = {
        id: `rx-${Date.now()}`,
        patientId: payload.patientId,
        patientName: 'New Patient',
        doctorId: payload.doctorId,
        doctorName: 'Selected Doctor',
        medication: payload.medication,
        dosage: payload.dosage,
        quantity: payload.quantity,
        refills: payload.refills || 0,
        status: 'pending',
        dateIssued: new Date().toISOString(),
        indications: payload.indications,
        notes: payload.notes,
        pharmacyId: payload.pharmacyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockPrescriptions.push(newPrescription);
      return newPrescription;
    }
    throw error;
  }
}

export async function updatePrescription(
  id: string,
  payload: Partial<PrescriptionCreatePayload>,
  token?: string
): Promise<Prescription> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/prescriptions/${id}/`, {
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
        `Failed to update prescription: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, update mock prescription
    const index = mockPrescriptions.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPrescriptions[index] = {
        ...mockPrescriptions[index],
        ...payload,
        updatedAt: new Date().toISOString()
      } as Prescription;
      return mockPrescriptions[index];
    }
    throw error;
  }
}

export async function deletePrescription(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/prescriptions/${id}/`, {
      method: 'DELETE',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to delete prescription: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }
  } catch (error) {
    // For demo purposes, remove from mock data
    const index = mockPrescriptions.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPrescriptions.splice(index, 1);
    }
    throw error;
  }
}

export function getMockMedications(): Medication[] {
  return mockMedications;
}

export function getFrequencies(): Frequency[] {
  return ['once', 'daily', 'twice-daily', 'three-times-daily', 'four-times-daily', 'weekly', 'monthly'];
}

export function getRoutes(): Route[] {
  return ['oral', 'injection', 'topical', 'inhaled', 'nasal', 'rectal', 'transdermal'];
}

export function getStatusBadgeColor(status: PrescriptionStatus): string {
  const colors: Record<PrescriptionStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'dispensed': 'bg-green-100 text-green-800',
    'refunded': 'bg-blue-100 text-blue-800',
    'voided': 'bg-gray-100 text-gray-800',
    'expired': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
