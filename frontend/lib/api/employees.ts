import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type EmployeeRole = 'doctor' | 'nurse' | 'admin' | 'receptionist' | 'technician' | 'billing' | 'manager';
export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  status: EmployeeStatus;
  startDate: string; // ISO string
  endDate?: string;
  salary?: number;
  licenseCertification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  status?: EmployeeStatus;
  startDate: string;
  endDate?: string;
  salary?: number;
  licenseCertification?: string;
}

export interface EmployeesResponse {
  count: number;
  results: Employee[];
}

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    phone: '(555) 123-4567',
    role: 'doctor',
    department: 'Cardiology',
    status: 'active',
    startDate: new Date(Date.now() - 5 * 365 * 24 * 3600000).toISOString(),
    licenseCertification: 'MD123456',
    createdAt: new Date(Date.now() - 5 * 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  {
    id: 'emp-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@clinic.com',
    phone: '(555) 234-5678',
    role: 'doctor',
    department: 'Orthopedics',
    status: 'active',
    startDate: new Date(Date.now() - 3 * 365 * 24 * 3600000).toISOString(),
    licenseCertification: 'MD789012',
    createdAt: new Date(Date.now() - 3 * 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  {
    id: 'emp-3',
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@clinic.com',
    phone: '(555) 345-6789',
    role: 'nurse',
    department: 'Emergency',
    status: 'active',
    startDate: new Date(Date.now() - 2 * 365 * 24 * 3600000).toISOString(),
    licenseCertification: 'RN345678',
    createdAt: new Date(Date.now() - 2 * 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
  },
  {
    id: 'emp-4',
    firstName: 'James',
    lastName: 'Davis',
    email: 'james.davis@clinic.com',
    phone: '(555) 456-7890',
    role: 'admin',
    department: 'Administration',
    status: 'active',
    startDate: new Date(Date.now() - 4 * 365 * 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 365 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString()
  }
];

export async function getEmployees(options?: {
  token?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  department?: string;
}): Promise<EmployeesResponse> {
  try {
    let filtered = [...mockEmployees];

    if (options?.role) {
      filtered = filtered.filter(e => e.role === options.role);
    }

    if (options?.status) {
      filtered = filtered.filter(e => e.status === options.status);
    }

    if (options?.department) {
      filtered = filtered.filter(e => e.department.toLowerCase().includes(options.department.toLowerCase()));
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    };
  } catch (error) {
    return { count: mockEmployees.length, results: mockEmployees };
  }
}

export async function getEmployee(id: string, token?: string): Promise<Employee> {
  const employee = mockEmployees.find(e => e.id === id);
  if (!employee) {
    throw new ApiError(`Employee ${id} not found`, 404, {});
  }
  return employee;
}

export async function createEmployee(
  payload: EmployeeCreatePayload,
  token?: string
): Promise<Employee> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    if (!response.ok) throw new ApiError(`Failed to create employee`, response.status, {});
    return response.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        department: payload.department,
        status: payload.status || 'active',
        startDate: payload.startDate,
        endDate: payload.endDate,
        salary: payload.salary,
        licenseCertification: payload.licenseCertification,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockEmployees.push(newEmployee);
      return newEmployee;
    }
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  payload: Partial<EmployeeCreatePayload>,
  token?: string
): Promise<Employee> {
  const index = mockEmployees.findIndex(e => e.id === id);
  if (index !== -1) {
    mockEmployees[index] = {
      ...mockEmployees[index],
      ...payload,
      updatedAt: new Date().toISOString()
    } as Employee;
    return mockEmployees[index];
  }
  throw new ApiError(`Employee not found`, 404, {});
}

export async function deleteEmployee(id: string, token?: string): Promise<void> {
  const index = mockEmployees.findIndex(e => e.id === id);
  if (index !== -1) {
    mockEmployees.splice(index, 1);
  }
}

export function getRoles(): EmployeeRole[] {
  return ['doctor', 'nurse', 'admin', 'receptionist', 'technician', 'billing', 'manager'];
}

export function getStatusBadgeColor(status: EmployeeStatus): string {
  const colors: Record<EmployeeStatus, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'on-leave': 'bg-yellow-100 text-yellow-800',
    'terminated': 'bg-red-100 text-red-800'
  };
  return colors[status];
}
