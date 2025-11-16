/**
 * Patient type definitions for the Clinic CRM.
 */

export interface Patient {
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    age: number;
    gender?: 'M' | 'F' | 'O' | 'U';
    phone?: string;
    email?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    insurance_info?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface PatientFormData {
    medical_record_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    date_of_birth: string;
    gender?: 'M' | 'F' | 'O' | 'U';
    phone?: string;
    email?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    insurance_info?: Record<string, any>;
}

export interface PatientsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Patient[];
}
