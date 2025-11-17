/**
 * Patient validation schemas using Zod.
 * These schemas validate patient data before submission to the API.
 */

import { z } from 'zod';

/**
 * Gender options matching Django model choices
 */
export const genderEnum = z.enum(['M', 'F', 'O', 'U']);

/**
 * US State code validation (2-letter uppercase)
 */
const stateRegex = /^[A-Z]{2}$/;

/**
 * Phone number validation (international format)
 * Matches Django regex: ^\+?1?\d{9,15}$
 */
const phoneRegex = /^\+?1?\d{9,15}$/;

/**
 * ZIP code validation (US format: 12345 or 12345-6789)
 */
const zipCodeRegex = /^\d{5}(-\d{4})?$/;

/**
 * Base patient schema with all fields
 */
export const patientSchema = z.object({
  // Required fields
  medical_record_number: z
    .string()
    .min(1, 'Medical record number is required')
    .max(50, 'Medical record number must be 50 characters or less')
    .trim(),

  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim(),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim(),

  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date format')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      return parsed < today;
    }, 'Date of birth must be in the past'),

  // Optional fields
  middle_name: z
    .string()
    .max(100, 'Middle name must be 100 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),

  gender: genderEnum.optional().or(z.literal('')),

  phone: z
    .string()
    .regex(phoneRegex, 'Phone number must be in format: +999999999 (9-15 digits)')
    .max(17, 'Phone number must be 17 characters or less')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),

  // Address fields
  address_line1: z
    .string()
    .max(255, 'Address line 1 must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  address_line2: z
    .string()
    .max(255, 'Address line 2 must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'City must be 100 characters or less')
    .optional()
    .or(z.literal('')),

  state: z
    .string()
    .length(2, 'State must be 2 characters (e.g., CA, NY)')
    .regex(stateRegex, 'State must be 2 uppercase letters')
    .optional()
    .or(z.literal('')),

  zip_code: z
    .string()
    .regex(zipCodeRegex, 'ZIP code must be in format: 12345 or 12345-6789')
    .optional()
    .or(z.literal('')),

  // Emergency contact fields
  emergency_contact_name: z
    .string()
    .max(200, 'Emergency contact name must be 200 characters or less')
    .optional()
    .or(z.literal('')),

  emergency_contact_relationship: z
    .string()
    .max(100, 'Emergency contact relationship must be 100 characters or less')
    .optional()
    .or(z.literal('')),

  emergency_contact_phone: z
    .string()
    .regex(phoneRegex, 'Emergency contact phone must be in format: +999999999 (9-15 digits)')
    .max(17, 'Emergency contact phone must be 17 characters or less')
    .optional()
    .or(z.literal('')),

  // Insurance information (JSON field)
  insurance_info: z
    .record(z.any())
    .optional(),
});

/**
 * Schema for creating a new patient
 * Same as base schema
 */
export const createPatientSchema = patientSchema;

/**
 * Schema for updating a patient
 * All fields are optional for partial updates
 */
export const updatePatientSchema = patientSchema.partial();

/**
 * TypeScript type inferred from the schema
 */
export type PatientFormValues = z.infer<typeof patientSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

/**
 * Helper function to validate patient data
 */
export function validatePatient(data: unknown): PatientFormValues {
  return patientSchema.parse(data);
}

/**
 * Helper function to safely validate patient data
 * Returns { success: true, data } or { success: false, errors }
 */
export function safeValidatePatient(data: unknown) {
  const result = patientSchema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return {
    success: false as const,
    errors: result.error.flatten().fieldErrors,
  };
}
