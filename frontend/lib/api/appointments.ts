import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentType = 'consultation' | 'follow-up' | 'check-up' | 'lab-work' | 'procedure' | 'emergency';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  dateTime: string; // ISO string
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  duration: number; // minutes
  location?: string;
  reminderEnabled: boolean;
}

export interface AppointmentCreatePayload {
  patientId: string;
  doctorId: string;
  dateTime: string;
  type: AppointmentType;
  duration?: number;
  notes?: string;
  location?: string;
  reminderEnabled?: boolean;
}

export interface AppointmentsResponse {
  count: number;
  results: Appointment[];
}

// Mock data for appointments
const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    doctorId: 'doctor-1',
    doctorName: 'Dr. Sarah Johnson',
    dateTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    type: 'consultation',
    status: 'scheduled',
    notes: 'Initial consultation for back pain',
    duration: 30,
    location: 'Room 101',
    reminderEnabled: true
  },
  {
    id: '2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    doctorId: 'doctor-2',
    doctorName: 'Dr. Michael Chen',
    dateTime: new Date(Date.now() + 4 * 3600000).toISOString(),
    type: 'follow-up',
    status: 'confirmed',
    notes: 'Follow-up after surgery',
    duration: 20,
    location: 'Room 205',
    reminderEnabled: true
  },
  {
    id: '3',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    doctorId: 'doctor-1',
    doctorName: 'Dr. Sarah Johnson',
    dateTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    type: 'check-up',
    status: 'scheduled',
    notes: 'Annual physical exam',
    duration: 45,
    location: 'Room 101',
    reminderEnabled: true
  },
  {
    id: '4',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    doctorId: 'doctor-2',
    doctorName: 'Dr. Michael Chen',
    dateTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    type: 'lab-work',
    status: 'scheduled',
    notes: 'Blood tests and lab work',
    duration: 30,
    location: 'Lab Area',
    reminderEnabled: true
  },
  {
    id: '5',
    patientId: 'patient-5',
    patientName: 'David Lee',
    doctorId: 'doctor-1',
    doctorName: 'Dr. Sarah Johnson',
    dateTime: new Date(Date.now() + 72 * 3600000).toISOString(),
    type: 'consultation',
    status: 'scheduled',
    notes: 'Consultation for joint pain',
    duration: 30,
    location: 'Room 101',
    reminderEnabled: false
  },
  {
    id: '6',
    patientId: 'patient-6',
    patientName: 'Lisa Anderson',
    doctorId: 'doctor-3',
    doctorName: 'Dr. Emily Brown',
    dateTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    type: 'check-up',
    status: 'completed',
    notes: 'Regular check-up',
    duration: 30,
    location: 'Room 302',
    reminderEnabled: true
  }
];

export async function getAppointments(options?: {
  token?: string;
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  patientId?: string;
}): Promise<AppointmentsResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    // Filter mock data based on options
    let filtered = [...mockAppointments];

    if (options?.startDate) {
      const start = options.startDate.getTime();
      filtered = filtered.filter(a => new Date(a.dateTime).getTime() >= start);
    }

    if (options?.endDate) {
      const end = options.endDate.getTime();
      filtered = filtered.filter(a => new Date(a.dateTime).getTime() <= end);
    }

    if (options?.doctorId) {
      filtered = filtered.filter(a => a.doctorId === options.doctorId);
    }

    if (options?.patientId) {
      filtered = filtered.filter(a => a.patientId === options.patientId);
    }

    return {
      count: filtered.length,
      results: filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    };
  } catch (error) {
    // Return mock data if API fails
    return {
      count: mockAppointments.length,
      results: mockAppointments
    };
  }
}

export async function getAppointment(id: string, token?: string): Promise<Appointment> {
  const appointment = mockAppointments.find(a => a.id === id);
  if (!appointment) {
    throw new ApiError(`Appointment ${id} not found`, 404, {});
  }
  return appointment;
}

export async function createAppointment(
  payload: AppointmentCreatePayload,
  token?: string
): Promise<Appointment> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
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
        `Failed to create appointment: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, create a mock appointment
    if (error instanceof ApiError && error.status === 404) {
      const newAppointment: Appointment = {
        id: `appt-${Date.now()}`,
        patientId: payload.patientId,
        patientName: 'New Patient',
        doctorId: payload.doctorId,
        doctorName: 'Selected Doctor',
        dateTime: payload.dateTime,
        type: payload.type,
        status: 'scheduled',
        notes: payload.notes,
        duration: payload.duration || 30,
        location: payload.location,
        reminderEnabled: payload.reminderEnabled ?? true
      };
      mockAppointments.push(newAppointment);
      return newAppointment;
    }
    throw error;
  }
}

export async function updateAppointment(
  id: string,
  payload: Partial<AppointmentCreatePayload>,
  token?: string
): Promise<Appointment> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${id}/`, {
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
        `Failed to update appointment: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    // For demo purposes, update mock appointment
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAppointments[index] = {
        ...mockAppointments[index],
        ...payload
      } as Appointment;
      return mockAppointments[index];
    }
    throw error;
  }
}

export async function deleteAppointment(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${id}/`, {
      method: 'DELETE',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to delete appointment: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }
  } catch (error) {
    // For demo purposes, remove from mock data
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAppointments.splice(index, 1);
    }
    throw error;
  }
}

export async function getUpcomingAppointments(
  days: number = 30,
  token?: string
): Promise<Appointment[]> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const response = await getAppointments({ token, startDate, endDate });
  return response.results.filter(a => a.status !== 'cancelled');
}

export async function checkSchedulingConflicts(
  doctorId: string,
  dateTime: string,
  duration: number = 30,
  token?: string
): Promise<boolean> {
  const appointmentTime = new Date(dateTime);
  const appointmentEndTime = new Date(appointmentTime.getTime() + duration * 60000);

  const doctorAppointments = mockAppointments.filter(
    a => a.doctorId === doctorId && a.status !== 'cancelled'
  );

  for (const appt of doctorAppointments) {
    const existingStart = new Date(appt.dateTime);
    const existingEnd = new Date(existingStart.getTime() + appt.duration * 60000);

    // Check if time slots overlap
    if (appointmentTime < existingEnd && appointmentEndTime > existingStart) {
      return true; // Conflict found
    }
  }

  return false; // No conflicts
}
