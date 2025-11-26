/**
 * Patient types and interfaces
 */
import { Gender, TimestampFields } from './common';

// Patient list item (minimal fields)
export interface PatientListItem {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
}

// Complete patient details
export interface Patient extends TimestampFields {
  id: string;
  medical_record_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  insurance_info: string;
  notes: string;
}

// Patient creation payload
export interface PatientCreatePayload {
  medical_record_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  insurance_info?: string;
  notes?: string;
}

// Patient update payload
export interface PatientUpdatePayload extends Partial<Omit<PatientCreatePayload, 'medical_record_number'>> {
  medical_record_number?: string;
}

// Legacy aliases for backward compatibility
export type PatientFormData = PatientCreatePayload;

// API Response type for patients list
export interface PatientsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}
