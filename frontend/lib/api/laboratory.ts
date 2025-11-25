import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type LabOrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
export type LabTestType = 'blood-work' | 'urinalysis' | 'imaging' | 'pathology' | 'microbiology' | 'chemistry' | 'hematology' | 'immunology';

export interface LabTest {
  name: string;
  code: string;
  description?: string;
}

export interface LabOrderDetails {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  orderDate: string; // ISO string
  dueDate?: string;
  completedDate?: string;
  status: LabOrderStatus;
  testType: LabTestType;
  tests: LabTest[];
  instructions?: string;
  priority: 'routine' | 'urgent' | 'stat';
  sampleType?: string;
  notes?: string;
  results?: {
    labTechnicianName?: string;
    completedAt?: string;
    attachmentUrl?: string;
    findings?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LabOrderCreatePayload {
  patientId: string;
  doctorId: string;
  testType: LabTestType;
  tests: LabTest[];
  priority?: 'routine' | 'urgent' | 'stat';
  sampleType?: string;
  instructions?: string;
  notes?: string;
  dueDate?: string;
}

export interface LabOrdersResponse {
  count: number;
  results: LabOrderDetails[];
}

const labTestTypes: Record<LabTestType, LabTest[]> = {
  'blood-work': [
    { name: 'Complete Blood Count (CBC)', code: 'CBC' },
    { name: 'Comprehensive Metabolic Panel (CMP)', code: 'CMP' },
    { name: 'Lipid Panel', code: 'LP' },
    { name: 'Thyroid Panel (TSH, T3, T4)', code: 'TP' },
    { name: 'Liver Function Tests', code: 'LFT' }
  ],
  'urinalysis': [
    { name: 'Urinalysis (UA)', code: 'UA' },
    { name: 'Urine Culture', code: 'UC' },
    { name: '24-Hour Urine Protein', code: '24UP' }
  ],
  'imaging': [
    { name: 'X-Ray (Chest)', code: 'XR-C' },
    { name: 'X-Ray (Abdomen)', code: 'XR-A' },
    { name: 'Ultrasound', code: 'US' },
    { name: 'CT Scan', code: 'CT' },
    { name: 'MRI', code: 'MRI' }
  ],
  'pathology': [
    { name: 'Tissue Biopsy', code: 'TB' },
    { name: 'Histopathology', code: 'HP' },
    { name: 'Cytology', code: 'CY' }
  ],
  'microbiology': [
    { name: 'Bacterial Culture', code: 'BC' },
    { name: 'Viral Culture', code: 'VC' },
    { name: 'Sensitivity Testing', code: 'ST' }
  ],
  'chemistry': [
    { name: 'Blood Glucose', code: 'BG' },
    { name: 'Electrolytes', code: 'ELEC' },
    { name: 'Kidney Function Tests (BUN, Creatinine)', code: 'KFT' }
  ],
  'hematology': [
    { name: 'Coagulation Studies (PT, PTT, INR)', code: 'COAG' },
    { name: 'Hemoglobin A1c', code: 'HbA1c' },
    { name: 'Blood Typing', code: 'BT' }
  ],
  'immunology': [
    { name: 'Allergy Testing', code: 'AT' },
    { name: 'Antibody Testing', code: 'ABT' },
    { name: 'Immunoglobulin Levels', code: 'IG' }
  ]
};

// Mock data for lab orders
const mockLabOrders: LabOrderDetails[] = [
  {
    id: 'lab-1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    orderDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    status: 'in-progress',
    testType: 'blood-work',
    tests: [
      { name: 'Complete Blood Count (CBC)', code: 'CBC' },
      { name: 'Comprehensive Metabolic Panel (CMP)', code: 'CMP' }
    ],
    priority: 'routine',
    sampleType: 'EDTA Blood',
    instructions: 'Fasting required. No food or drink for 12 hours before test.',
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
  },
  {
    id: 'lab-2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    orderDate: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    completedDate: new Date(Date.now() - 12 * 3600000).toISOString(),
    status: 'completed',
    testType: 'urinalysis',
    tests: [
      { name: 'Urinalysis (UA)', code: 'UA' }
    ],
    priority: 'urgent',
    sampleType: 'Urine Sample',
    notes: 'Patient reports dysuria',
    results: {
      labTechnicianName: 'Susan Miller',
      completedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      findings: 'Normal. No abnormalities detected.'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: 'lab-3',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    orderDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 24 * 3600000).toISOString(),
    status: 'pending',
    testType: 'imaging',
    tests: [
      { name: 'X-Ray (Chest)', code: 'XR-C' }
    ],
    priority: 'routine',
    sampleType: 'N/A',
    instructions: 'Remove all metal objects. Pregnant patients notify technician.',
    createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
  },
  {
    id: 'lab-4',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    doctorId: 'doc-3',
    doctorName: 'Dr. Emily Brown',
    orderDate: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
    completedDate: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
    status: 'completed',
    testType: 'blood-work',
    tests: [
      { name: 'Lipid Panel', code: 'LP' },
      { name: 'Thyroid Panel (TSH, T3, T4)', code: 'TP' }
    ],
    priority: 'routine',
    sampleType: 'Serum',
    results: {
      labTechnicianName: 'David Johnson',
      completedAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
      findings: 'Elevated cholesterol. Total: 245 mg/dL. Recommend dietary modifications.'
    },
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString()
  },
  {
    id: 'lab-5',
    patientId: 'patient-5',
    patientName: 'David Lee',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    orderDate: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 3600000).toISOString(),
    status: 'pending',
    testType: 'chemistry',
    tests: [
      { name: 'Blood Glucose', code: 'BG' },
      { name: 'Electrolytes', code: 'ELEC' }
    ],
    priority: 'routine',
    sampleType: 'Plasma',
    instructions: 'No specific preparation needed.',
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
  },
  {
    id: 'lab-6',
    patientId: 'patient-6',
    patientName: 'Lisa Anderson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    orderDate: new Date(Date.now() - 1 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 6 * 24 * 3600000).toISOString(),
    status: 'pending',
    testType: 'hematology',
    tests: [
      { name: 'Coagulation Studies (PT, PTT, INR)', code: 'COAG' }
    ],
    priority: 'stat',
    sampleType: 'Citrate Blood',
    instructions: 'Stat order - process immediately.',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

export async function getLabOrders(options?: {
  token?: string;
  patientId?: string;
  doctorId?: string;
  status?: LabOrderStatus;
  testType?: LabTestType;
}): Promise<LabOrdersResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    let filtered = [...mockLabOrders];

    if (options?.patientId) {
      filtered = filtered.filter(o => o.patientId === options.patientId);
    }

    if (options?.doctorId) {
      filtered = filtered.filter(o => o.doctorId === options.doctorId);
    }

    if (options?.status) {
      filtered = filtered.filter(o => o.status === options.status);
    }

    if (options?.testType) {
      filtered = filtered.filter(o => o.testType === options.testType);
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    };
  } catch (error) {
    return {
      count: mockLabOrders.length,
      results: mockLabOrders
    };
  }
}

export async function getLabOrder(id: string, token?: string): Promise<LabOrderDetails> {
  const order = mockLabOrders.find(o => o.id === id);
  if (!order) {
    throw new ApiError(`Lab order ${id} not found`, 404, {});
  }
  return order;
}

export async function createLabOrder(
  payload: LabOrderCreatePayload,
  token?: string
): Promise<LabOrderDetails> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/laboratory/`, {
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
        `Failed to create lab order: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, create a mock lab order
    if (error instanceof ApiError && error.status === 404) {
      const newOrder: LabOrderDetails = {
        id: `lab-${Date.now()}`,
        patientId: payload.patientId,
        patientName: 'New Patient',
        doctorId: payload.doctorId,
        doctorName: 'Selected Doctor',
        orderDate: new Date().toISOString(),
        dueDate: payload.dueDate,
        status: 'pending',
        testType: payload.testType,
        tests: payload.tests,
        priority: payload.priority || 'routine',
        sampleType: payload.sampleType,
        instructions: payload.instructions,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockLabOrders.push(newOrder);
      return newOrder;
    }
    throw error;
  }
}

export async function updateLabOrder(
  id: string,
  payload: Partial<LabOrderCreatePayload>,
  token?: string
): Promise<LabOrderDetails> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/laboratory/${id}/`, {
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
        `Failed to update lab order: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, update mock lab order
    const index = mockLabOrders.findIndex(o => o.id === id);
    if (index !== -1) {
      mockLabOrders[index] = {
        ...mockLabOrders[index],
        ...payload,
        updatedAt: new Date().toISOString()
      } as LabOrderDetails;
      return mockLabOrders[index];
    }
    throw error;
  }
}

export async function deleteLabOrder(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/laboratory/${id}/`, {
      method: 'DELETE',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to delete lab order: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }
  } catch (error) {
    // For demo purposes, remove from mock data
    const index = mockLabOrders.findIndex(o => o.id === id);
    if (index !== -1) {
      mockLabOrders.splice(index, 1);
    }
    throw error;
  }
}

export function getLabTestTypes(): LabTestType[] {
  return Object.keys(labTestTypes) as LabTestType[];
}

export function getTestsForType(testType: LabTestType): LabTest[] {
  return labTestTypes[testType] || [];
}

export function getStatusBadgeColor(status: LabOrderStatus): string {
  const colors: Record<LabOrderStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-gray-100 text-gray-800',
    'failed': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityBadgeColor(priority: string): string {
  const colors: Record<string, string> = {
    'routine': 'bg-blue-50 text-blue-700',
    'urgent': 'bg-orange-50 text-orange-700',
    'stat': 'bg-red-50 text-red-700'
  };
  return colors[priority] || 'bg-gray-50 text-gray-700';
}
