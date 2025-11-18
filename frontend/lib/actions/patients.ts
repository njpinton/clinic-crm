'use server';

/**
 * Server Actions for patient management.
 * Used for mutations (create, update, delete).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import type { PatientFormData } from '@/types/patient';

const API_URL = process.env.API_URL || 'http://localhost:8000';

/**
 * Create a new patient.
 */
export async function createPatientAction(formData: FormData) {
    try {
        const data: PatientFormData = {
            medical_record_number: formData.get('medical_record_number') as string,
            first_name: formData.get('first_name') as string,
            middle_name: formData.get('middle_name') as string || undefined,
            last_name: formData.get('last_name') as string,
            date_of_birth: formData.get('date_of_birth') as string,
            gender: (formData.get('gender') as 'M' | 'F' | 'O' | 'U') || undefined,
            phone: (formData.get('phone') as string) || '',
            email: formData.get('email') as string || undefined,
            address_line1: formData.get('address_line1') as string || undefined,
            address_line2: formData.get('address_line2') as string || undefined,
            city: formData.get('city') as string || undefined,
            state: formData.get('state') as string || undefined,
            zip_code: formData.get('zip_code') as string || undefined,
            emergency_contact_name: formData.get('emergency_contact_name') as string || undefined,
            emergency_contact_relationship: formData.get('emergency_contact_relationship') as string || undefined,
            emergency_contact_phone: formData.get('emergency_contact_phone') as string || undefined,
        };

        // TODO: Get auth token from session
        const response = await fetch(`${API_URL}/api/patients/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                errors: error,
            };
        }

        const patient = await response.json();

        // Revalidate the patients list
        revalidatePath('/patients');

        // Redirect to patient detail page
        redirect(`/patients/${patient.id}`);
    } catch (error) {
        Sentry.captureException(error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create patient',
        };
    }
}

/**
 * Update a patient.
 */
export async function updatePatientAction(id: string, formData: FormData) {
    try {
        const data: Partial<PatientFormData> = {};

        // Only include fields that were provided
        const fields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth',
            'gender', 'phone', 'email', 'address_line1', 'address_line2',
            'city', 'state', 'zip_code', 'emergency_contact_name',
            'emergency_contact_relationship', 'emergency_contact_phone'
        ];

        fields.forEach(field => {
            const value = formData.get(field);
            if (value) {
                data[field as keyof PatientFormData] = value as any;
            }
        });

        const response = await fetch(`${API_URL}/api/patients/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                errors: error,
            };
        }

        // Revalidate the patient pages
        revalidatePath('/patients');
        revalidatePath(`/patients/${id}`);

        return {
            success: true,
        };
    } catch (error) {
        Sentry.captureException(error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update patient',
        };
    }
}

/**
 * Delete a patient (soft delete).
 */
export async function deletePatientAction(id: string) {
    try {
        const response = await fetch(`${API_URL}/api/patients/${id}/`, {
            method: 'DELETE',
            headers: {
                // 'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return {
                success: false,
                error: 'Failed to delete patient',
            };
        }

        // Revalidate and redirect
        revalidatePath('/patients');
        redirect('/patients');
    } catch (error) {
        Sentry.captureException(error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete patient',
        };
    }
}
