/**
 * Doctor types and interfaces
 */
import { TimestampFields, SoftDeleteFields } from './common';

// Specialization
export interface Specialization extends TimestampFields {
  id: string;
  name: string;
  description: string;
  medical_code: string;
}

// Doctor credential types
export type CredentialType =
  | 'medical_license'
  | 'board_certification'
  | 'dea_registration'
  | 'npi'
  | 'cds'
  | 'other';

// Doctor credential
export interface DoctorCredential extends TimestampFields {
  id: string;
  doctor: string;
  credential_type: CredentialType;
  credential_name: string;
  issuing_organization: string;
  credential_number: string;
  issue_date: string;
  expiry_date: string | null;
  is_verified: boolean;
  verification_date: string | null;
  document: string | null;
  notes: string;
  is_expired: boolean;
  is_expiring_soon: boolean;
}

// Day of week choices
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Doctor availability schedule
export interface DoctorAvailability extends TimestampFields {
  id: string;
  doctor: string;
  day_of_week: DayOfWeek;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// User details (nested in doctor)
export interface UserDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

// Doctor list item (minimal fields)
export interface DoctorListItem {
  id: string;
  full_name: string;
  user_email: string;
  license_number: string;
  primary_specialization: string | null;
  is_accepting_patients: boolean;
  consultation_fee: string;
}

// Complete doctor details
export interface Doctor extends SoftDeleteFields {
  id: string;
  user: string;
  user_details: UserDetails;
  full_name: string;
  license_number: string;
  npi_number: string;
  dea_number: string;
  specializations: Specialization[];
  board_certified: boolean;
  years_of_experience: number;
  consultation_fee: string;
  is_accepting_patients: boolean;
  bio: string;
  education: string;
  languages: string;
  credentials: DoctorCredential[];
  availability_schedules: DoctorAvailability[];
  is_deleted: boolean;
}

// Doctor creation payload
export interface DoctorCreatePayload {
  user: string;
  license_number: string;
  npi_number?: string;
  dea_number?: string;
  specialization_ids?: string[];
  board_certified?: boolean;
  years_of_experience?: number;
  consultation_fee?: string;
  is_accepting_patients?: boolean;
  bio?: string;
  education?: string;
  languages?: string;
}

// Doctor update payload
export interface DoctorUpdatePayload extends Partial<Omit<DoctorCreatePayload, 'user' | 'license_number'>> {}
