/**
 * Appointment types and interfaces
 */
import { TimestampFields, SoftDeleteFields } from './common';

// Appointment status
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

// Appointment type
export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'annual_checkup'
  | 'urgent_care'
  | 'telemedicine'
  | 'procedure'
  | 'lab_work'
  | 'imaging'
  | 'vaccination'
  | 'other';

// Reminder type
export type ReminderType = 'email' | 'sms' | 'both';

// Reminder status
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

// Appointment reminder
export interface AppointmentReminder extends TimestampFields {
  id: string;
  appointment: string;
  reminder_type: ReminderType;
  scheduled_send_time: string;
  sent_at: string | null;
  status: ReminderStatus;
  recipient_email: string;
  recipient_phone: string;
  delivery_status_message: string;
  external_id: string;
}

// Appointment list item (minimal fields)
export interface AppointmentListItem extends TimestampFields {
  id: string;
  patient: string;
  patient_name: string;
  doctor: string;
  doctor_name: string;
  appointment_datetime: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  appointment_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  reason: string;
  is_upcoming: boolean;
  is_today: boolean;
}

// Complete appointment details
export interface Appointment extends SoftDeleteFields {
  id: string;
  // Patient information
  patient: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  // Doctor information
  doctor: string;
  doctor_name: string;
  doctor_email: string;
  doctor_specializations: string[];
  // Appointment details
  appointment_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  appointment_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  reason: string;
  notes: string;
  // Check-in/out
  checked_in_at: string | null;
  checked_out_at: string | null;
  // Cancellation
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancelled_by_name: string | null;
  cancellation_reason: string;
  // Rescheduling
  rescheduled_from: string | null;
  rescheduled_from_id: string | null;
  // Reminders
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  reminders: AppointmentReminder[];
  // Computed properties
  is_upcoming: boolean;
  is_today: boolean;
  is_past: boolean;
  // Metadata
  deleted_at: string | null;
}

// Appointment creation payload
export interface AppointmentCreatePayload {
  patient: string;
  doctor: string;
  appointment_datetime: string;
  duration_minutes?: number;
  appointment_type: AppointmentType;
  reason: string;
  notes?: string;
}

// Appointment update payload
export interface AppointmentUpdatePayload {
  appointment_datetime?: string;
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}

// Appointment cancel payload
export interface AppointmentCancelPayload {
  cancellation_reason: string;
}

// Appointment reschedule payload
export interface AppointmentReschedulePayload {
  new_datetime: string;
}
