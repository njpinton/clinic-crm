/**
 * Prescription types and interfaces
 */
import { TimestampFields, SoftDeleteFields } from './common';

// Controlled substance schedule
export type ControlledSubstanceSchedule = 'I' | 'II' | 'III' | 'IV' | 'V';

// Prescription status
export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

// Prescription refill status
export type RefillStatus = 'pending' | 'approved' | 'denied' | 'filled';

// Medication
export interface Medication extends TimestampFields {
  id: string;
  ndc_code: string;
  brand_name: string;
  generic_name: string;
  drug_class: string;
  controlled_substance_schedule: ControlledSubstanceSchedule | null;
  is_controlled_substance: boolean;
  strength: string;
  dosage_form: string;
  typical_dosage: string;
  indications: string;
  contraindications: string;
  side_effects: string;
  interactions: string;
  manufacturer: string;
  unit_price: string;
  is_active: boolean;
  is_formulary: boolean;
}

// Prescription refill
export interface PrescriptionRefill extends TimestampFields {
  id: string;
  prescription: string;
  requested_date: string;
  requested_by_patient: boolean;
  status: RefillStatus;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  filled_date: string | null;
  pharmacy_name: string;
  quantity_filled: number;
  denial_reason: string;
  notes: string;
}

// Prescription list item (minimal fields)
export interface PrescriptionListItem extends TimestampFields {
  id: string;
  prescription_number: string;
  patient: string;
  patient_name: string;
  doctor: string;
  doctor_name: string;
  medication: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  prescribed_date: string;
  status: PrescriptionStatus;
  status_display: string;
  refills_remaining: number;
  is_active: boolean;
  can_refill: boolean;
}

// Complete prescription details
export interface Prescription extends SoftDeleteFields {
  id: string;
  prescription_number: string;
  // Patient & Doctor
  patient: string;
  patient_name: string;
  doctor: string;
  doctor_name: string;
  // Medication
  medication: string;
  medication_details: Medication;
  appointment: string | null;
  // Prescription details
  prescribed_date: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  indication: string;
  // Quantity and refills
  quantity: number;
  refills_allowed: number;
  refills_remaining: number;
  // Pharmacy
  pharmacy_name: string;
  pharmacy_phone: string;
  // Status and dates
  status: PrescriptionStatus;
  status_display: string;
  expiration_date: string | null;
  last_filled_date: string | null;
  // Controlled substance
  dea_number_used: string;
  // Electronic prescribing
  electronically_sent: boolean;
  sent_to_pharmacy_at: string | null;
  // Notes
  notes: string;
  // Computed properties
  is_active: boolean;
  is_expired: boolean;
  can_refill: boolean;
  // Refills
  refill_requests: PrescriptionRefill[];
  // Metadata
  deleted_at: string | null;
}

// Prescription creation payload
export interface PrescriptionCreatePayload {
  patient: string;
  doctor: string;
  medication: string;
  appointment?: string;
  prescription_number: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration?: string;
  quantity: number;
  refills_allowed?: number;
  instructions?: string;
  indication?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  expiration_date?: string;
}

// Prescription update payload
export interface PrescriptionUpdatePayload extends Partial<Omit<PrescriptionCreatePayload,
  'patient' | 'doctor' | 'medication' | 'prescription_number'>> {}

// Refill request payload
export interface RefillRequestPayload {
  pharmacy_name?: string;
  notes?: string;
}
