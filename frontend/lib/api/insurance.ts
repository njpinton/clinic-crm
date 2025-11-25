import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type InsurancePlan = 'HMO' | 'PPO' | 'POS' | 'HDHP' | 'Medicaid' | 'Medicare' | 'VA' | 'Self-Pay';
export type InsuranceStatus = 'active' | 'inactive' | 'expired' | 'pending' | 'cancelled';

export interface InsurancePolicy {
  id: string;
  patientId: string;
  patientName: string;
  provider: string;
  planType: InsurancePlan;
  memberId: string;
  groupNumber?: string;
  copay?: number;
  deductible?: number;
  outOfPocketMax?: number;
  status: InsuranceStatus;
  effectiveDate: string; // ISO string
  terminationDate?: string;
  primaryPhysician?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceCreatePayload {
  patientId: string;
  provider: string;
  planType: InsurancePlan;
  memberId: string;
  groupNumber?: string;
  copay?: number;
  deductible?: number;
  outOfPocketMax?: number;
  status?: InsuranceStatus;
  effectiveDate: string;
  terminationDate?: string;
  primaryPhysician?: string;
  notes?: string;
}

export interface InsurancesResponse {
  count: number;
  results: InsurancePolicy[];
}

// Mock data for insurance policies
const mockInsurances: InsurancePolicy[] = [
  {
    id: 'ins-1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    provider: 'Blue Cross Blue Shield',
    planType: 'PPO',
    memberId: 'BCB123456789',
    groupNumber: 'GRP001',
    copay: 20,
    deductible: 500,
    outOfPocketMax: 5000,
    status: 'active',
    effectiveDate: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
    primaryPhysician: 'Dr. Sarah Johnson',
    createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  {
    id: 'ins-2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    provider: 'UnitedHealth Group',
    planType: 'HMO',
    memberId: 'UHC987654321',
    groupNumber: 'GRP002',
    copay: 25,
    deductible: 750,
    outOfPocketMax: 6000,
    status: 'active',
    effectiveDate: new Date(Date.now() - 180 * 24 * 3600000).toISOString(),
    primaryPhysician: 'Dr. Michael Chen',
    createdAt: new Date(Date.now() - 180 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString()
  },
  {
    id: 'ins-3',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    provider: 'Aetna',
    planType: 'PPO',
    memberId: 'AET456123789',
    copay: 30,
    deductible: 1000,
    outOfPocketMax: 7500,
    status: 'active',
    effectiveDate: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString()
  },
  {
    id: 'ins-4',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    provider: 'Medicare',
    planType: 'Medicare',
    memberId: 'MED789456123',
    status: 'active',
    effectiveDate: new Date(Date.now() - 730 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 730 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString()
  },
  {
    id: 'ins-5',
    patientId: 'patient-5',
    patientName: 'David Lee',
    provider: 'Cigna',
    planType: 'HDHP',
    memberId: 'CIG321654987',
    groupNumber: 'GRP003',
    copay: 15,
    deductible: 2500,
    outOfPocketMax: 8000,
    status: 'active',
    effectiveDate: new Date(Date.now() - 270 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 270 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 270 * 24 * 3600000).toISOString()
  },
  {
    id: 'ins-6',
    patientId: 'patient-6',
    patientName: 'Lisa Anderson',
    provider: 'Humana',
    planType: 'Medicaid',
    memberId: 'HUM654321987',
    status: 'expired',
    effectiveDate: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
    terminationDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  }
];

export async function getInsurances(options?: {
  token?: string;
  patientId?: string;
  status?: InsuranceStatus;
  provider?: string;
}): Promise<InsurancesResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    let filtered = [...mockInsurances];

    if (options?.patientId) {
      filtered = filtered.filter(i => i.patientId === options.patientId);
    }

    if (options?.status) {
      filtered = filtered.filter(i => i.status === options.status);
    }

    if (options?.provider) {
      filtered = filtered.filter(i => i.provider.toLowerCase().includes(options.provider.toLowerCase()));
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
    };
  } catch (error) {
    return {
      count: mockInsurances.length,
      results: mockInsurances
    };
  }
}

export async function getInsurance(id: string, token?: string): Promise<InsurancePolicy> {
  const policy = mockInsurances.find(i => i.id === id);
  if (!policy) {
    throw new ApiError(`Insurance policy ${id} not found`, 404, {});
  }
  return policy;
}

export async function createInsurance(
  payload: InsuranceCreatePayload,
  token?: string
): Promise<InsurancePolicy> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/insurance/`, {
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
        `Failed to create insurance policy: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const newPolicy: InsurancePolicy = {
        id: `ins-${Date.now()}`,
        patientId: payload.patientId,
        patientName: 'New Patient',
        provider: payload.provider,
        planType: payload.planType,
        memberId: payload.memberId,
        groupNumber: payload.groupNumber,
        copay: payload.copay,
        deductible: payload.deductible,
        outOfPocketMax: payload.outOfPocketMax,
        status: payload.status || 'active',
        effectiveDate: payload.effectiveDate,
        terminationDate: payload.terminationDate,
        primaryPhysician: payload.primaryPhysician,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockInsurances.push(newPolicy);
      return newPolicy;
    }
    throw error;
  }
}

export async function updateInsurance(
  id: string,
  payload: Partial<InsuranceCreatePayload>,
  token?: string
): Promise<InsurancePolicy> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/insurance/${id}/`, {
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
        `Failed to update insurance policy: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    const index = mockInsurances.findIndex(i => i.id === id);
    if (index !== -1) {
      mockInsurances[index] = {
        ...mockInsurances[index],
        ...payload,
        updatedAt: new Date().toISOString()
      } as InsurancePolicy;
      return mockInsurances[index];
    }
    throw error;
  }
}

export async function deleteInsurance(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/insurance/${id}/`, {
      method: 'DELETE',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to delete insurance policy: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }
  } catch (error) {
    const index = mockInsurances.findIndex(i => i.id === id);
    if (index !== -1) {
      mockInsurances.splice(index, 1);
    }
    throw error;
  }
}

export function getPlanTypes(): InsurancePlan[] {
  return ['HMO', 'PPO', 'POS', 'HDHP', 'Medicaid', 'Medicare', 'VA', 'Self-Pay'];
}

export function getStatuses(): InsuranceStatus[] {
  return ['active', 'inactive', 'expired', 'pending', 'cancelled'];
}

export function getStatusBadgeColor(status: InsuranceStatus): string {
  const colors: Record<InsuranceStatus, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'expired': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
