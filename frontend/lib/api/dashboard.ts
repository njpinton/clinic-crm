import { ApiError } from './patients';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingLabOrders: number;
  activeNotes: number;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface DashboardAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch dashboard stats: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Return mock data if API is not available
    return {
      totalPatients: 156,
      appointmentsToday: 12,
      pendingLabOrders: 8,
      activeNotes: 23
    };
  }
}

export async function getRecentActivities(): Promise<Activity[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/api/dashboard/activities/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch activities: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    // Return mock data if API is not available
    return [
      {
        id: '1',
        user: 'Dr. Sarah Johnson',
        action: 'created a new',
        resource: 'Clinical Note for John Doe',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: '2',
        user: 'Admin User',
        action: 'added a new',
        resource: 'Patient: Jane Smith',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: '3',
        user: 'Dr. Michael Chen',
        action: 'scheduled',
        resource: 'Appointment with Robert Williams',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: '4',
        user: 'Lab Technician',
        action: 'uploaded results for',
        resource: 'Lab Order #2024001',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString()
      },
      {
        id: '5',
        user: 'Dr. Sarah Johnson',
        action: 'refilled prescription for',
        resource: 'Maria Garcia',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString()
      }
    ];
  }
}

export async function getUpcomingAppointments(): Promise<DashboardAppointment[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/api/dashboard/appointments/upcoming/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch upcoming appointments: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    // Return mock data if API is not available
    return [
      {
        id: '1',
        patientName: 'John Doe',
        doctorName: 'Sarah Johnson',
        dateTime: new Date(Date.now() + 2 * 3600000).toISOString(),
        type: 'consultation',
        status: 'scheduled'
      },
      {
        id: '2',
        patientName: 'Jane Smith',
        doctorName: 'Michael Chen',
        dateTime: new Date(Date.now() + 4 * 3600000).toISOString(),
        type: 'follow-up',
        status: 'confirmed'
      },
      {
        id: '3',
        patientName: 'Robert Williams',
        doctorName: 'Sarah Johnson',
        dateTime: new Date(Date.now() + 24 * 3600000).toISOString(),
        type: 'check-up',
        status: 'scheduled'
      },
      {
        id: '4',
        patientName: 'Maria Garcia',
        doctorName: 'Michael Chen',
        dateTime: new Date(Date.now() + 48 * 3600000).toISOString(),
        type: 'lab-work',
        status: 'scheduled'
      },
      {
        id: '5',
        patientName: 'David Lee',
        doctorName: 'Sarah Johnson',
        dateTime: new Date(Date.now() + 72 * 3600000).toISOString(),
        type: 'consultation',
        status: 'scheduled'
      }
    ];
  }
}
