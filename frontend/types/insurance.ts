/**
 * Insurance types and interfaces
 */
import { TimestampFields, SoftDeleteFields } from './common';

// Insurance plan type
export type InsurancePlanType =
  | 'HMO'
  | 'PPO'
  | 'EPO'
  | 'POS'
  | 'medicare'
  | 'medicaid'
  | 'other';

// Insurance priority
export type InsurancePriority = 'primary' | 'secondary' | 'tertiary';

// Insurance claim status
export type InsuranceClaimStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'partially_approved'
  | 'denied'
  | 'paid'
  | 'appealed';

// Insurance provider
export interface InsuranceProvider extends TimestampFields {
  id: string;
  company_name: string;
  payer_id: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  website: string;
  is_active: boolean;
}

// Insurance plan
export interface InsurancePlan extends TimestampFields {
  id: string;
  provider: string;
  provider_name: string;
  plan_name: string;
  plan_number: string;
  plan_type: InsurancePlanType;
  plan_type_display: string;
  group_number: string;
  coverage_details: string;
  copay_amount: string;
  deductible_amount: string;
  out_of_pocket_max: string;
  is_active: boolean;
}

// Patient insurance
export interface PatientInsurance extends SoftDeleteFields {
  id: string;
  patient: string;
  patient_name: string;
  insurance_plan: string;
  insurance_plan_name: string;
  provider_name: string;
  member_id: string;
  group_number: string;
  policy_holder_name: string;
  policy_holder_relationship: string;
  policy_holder_dob: string;
  priority: InsurancePriority;
  effective_date: string;
  termination_date: string | null;
  is_active: boolean;
  is_coverage_active: boolean;
  needs_verification: boolean;
  last_verified_date: string | null;
  verification_status: string;
  notes: string;
  deleted_at: string | null;
}

// Insurance claim
export interface InsuranceClaim extends TimestampFields {
  id: string;
  patient_insurance: string;
  patient_name: string;
  provider_name: string;
  appointment: string | null;
  claim_number: string;
  service_date: string;
  diagnosis_codes: string;
  procedure_codes: string;
  billed_amount: string;
  allowed_amount: string;
  paid_amount: string;
  patient_responsibility: string;
  status: InsuranceClaimStatus;
  status_display: string;
  submission_date: string | null;
  processing_date: string | null;
  payment_date: string | null;
  denial_reason: string;
  appeal_filed: boolean;
  appeal_date: string | null;
  notes: string;
  status_updated_at: string;
}

// Patient insurance creation payload
export interface PatientInsuranceCreatePayload {
  patient: string;
  insurance_plan: string;
  member_id: string;
  group_number?: string;
  policy_holder_name: string;
  policy_holder_relationship: string;
  policy_holder_dob: string;
  priority: InsurancePriority;
  effective_date: string;
  termination_date?: string;
  notes?: string;
}

// Insurance claim creation payload
export interface InsuranceClaimCreatePayload {
  patient_insurance: string;
  appointment?: string;
  claim_number: string;
  service_date: string;
  diagnosis_codes: string;
  procedure_codes: string;
  billed_amount: string;
  notes?: string;
}
