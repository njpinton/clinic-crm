import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type AppointmentType = 'consultation' | 'follow_up' | 'procedure' | 'lab_work' | 'vaccination' | 'physical_exam' | 'emergency' | 'telemedicine';
export type Urgency = 'routine' | 'urgent' | 'emergency';

export interface Appointment {
  id: string;
  patient: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  doctor: string;
  doctor_name: string;
  doctor_email: string;
  doctor_specializations: string[];
  appointment_datetime: string; // ISO string
  end_datetime: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  appointment_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  urgency: Urgency;
  is_walk_in: boolean;
  reason: string;
  notes?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancelled_by_name?: string;
  cancellation_reason?: string;
  rescheduled_from?: string;
  rescheduled_from_id?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  is_upcoming: boolean;
  is_today: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DoctorSchedule {
  id: string;
  doctor: string;
  doctor_name: string;
  day_of_week: number;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreatePayload {
  patient: string;
  doctor: string;
  appointment_datetime: string;
  duration_minutes?: number;
  appointment_type: AppointmentType;
  urgency?: Urgency;
  is_walk_in?: boolean;
  reason: string;
  notes?: string;
}

export interface AvailableSlot {
  datetime: string;
  duration_minutes: number;
}

export interface AppointmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}

export interface AvailabilityResponse {
  doctor_id: string;
  date: string;
  duration_minutes: number;
  slots: string[]; // ISO datetimes
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicting_appointments?: Appointment[];
}

/**
 * Get all appointments with optional filtering
 */
export async function getAppointments(options?: {
  token?: string;
  status?: AppointmentStatus;
  doctor_id?: string;
  patient_id?: string;
}): Promise<AppointmentsResponse> {
  try {
    const token = options?.token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.doctor_id) params.append('doctor', options.doctor_id);
    if (options?.patient_id) params.append('patient', options.patient_id);

    const response = await fetch(`${API_BASE_URL}/api/appointments/?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch appointments: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to fetch appointments',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Get a single appointment by ID
 */
export async function getAppointment(id: string, token?: string): Promise<Appointment> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${id}/`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch appointment: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to fetch appointment',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  payload: AppointmentCreatePayload,
  token?: string
): Promise<Appointment> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

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
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to create appointment',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  id: string,
  payload: Partial<AppointmentCreatePayload>,
  token?: string
): Promise<Appointment> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${id}/`, {
      method: 'PATCH',
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to update appointment',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string, token?: string): Promise<void> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

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
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to delete appointment',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Get available appointment slots for a doctor on a specific date
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
  durationMinutes: number = 30,
  token?: string
): Promise<AvailableSlot[]> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const params = new URLSearchParams({
      doctor_id: doctorId,
      date,
      duration_minutes: String(durationMinutes)
    });

    const response = await fetch(`${API_BASE_URL}/api/appointments/availability/?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch available slots: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    const data = await response.json();
    return (data.slots || []).map((slot: string) => ({
      datetime: slot,
      duration_minutes: durationMinutes
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to fetch available slots',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Check if an appointment time conflicts with existing appointments
 */
export async function checkConflict(
  doctorId: string,
  appointmentDatetime: string,
  durationMinutes: number = 30,
  token?: string
): Promise<ConflictCheckResponse> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const params = new URLSearchParams({
      doctor_id: doctorId,
      datetime: appointmentDatetime,
      duration_minutes: String(durationMinutes)
    });

    const response = await fetch(`${API_BASE_URL}/api/appointments/check-conflict/?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to check conflict: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to check conflict',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(token?: string): Promise<Appointment[]> {
  try {
    const response = await getAppointments({
      token,
      status: 'scheduled'
    });

    return response.results.filter(a => a.is_upcoming);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to fetch upcoming appointments',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Get doctor schedules
 */
export async function getDoctorSchedules(
  doctorId?: string,
  token?: string
): Promise<DoctorSchedule[]> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const params = new URLSearchParams();
    if (doctorId) params.append('doctor', doctorId);

    const response = await fetch(`${API_BASE_URL}/api/schedules/?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch schedules: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to fetch schedules',
      500,
      { error: String(error) }
    );
  }
}

/**
 * Create doctor schedule
 */
export async function createDoctorSchedule(
  schedule: Omit<DoctorSchedule, 'id' | 'created_at' | 'updated_at' | 'doctor_name'>,
  token?: string
): Promise<DoctorSchedule> {
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    const response = await fetch(`${API_BASE_URL}/api/schedules/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      body: JSON.stringify(schedule),
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to create schedule: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Failed to create schedule',
      500,
      { error: String(error) }
    );
  }
}
