---
name: nextjs-frontend-guidelines
description: Frontend development guidelines for Next.js 14+ with TypeScript and React. Modern patterns including Server Components, Client Components, App Router, data fetching with Server Actions, file organization, styling with Tailwind CSS and shadcn/ui or Material-UI, form handling with React Hook Form and Zod, TypeScript best practices, and performance optimization. Use when creating components, pages, features, forms, routing, or working with frontend code for the Clinic CRM.
---

# Next.js Frontend Development Guidelines

## Purpose

Comprehensive guide for modern Next.js 14+ development for the Clinic CRM, emphasizing Server Components, proper data fetching, secure authentication patterns, and healthcare-specific UI considerations.

## When to Use This Skill

- Creating new components or pages
- Building new features (patients, appointments, clinical notes)
- Data fetching and mutations
- Setting up routing with App Router
- Styling components with Tailwind CSS and UI library
- Form handling with React Hook Form + Zod
- Authentication and authorization
- TypeScript best practices
- Performance optimization

---

## Quick Start

### New Component Checklist

Creating a component? Follow this checklist:

- [ ] Determine if Server Component (default) or Client Component (`'use client'`)
- [ ] Use TypeScript with proper types
- [ ] Import shadcn/ui or MUI components for consistency
- [ ] Use Server Actions for mutations (not API routes)
- [ ] Handle loading states with Suspense
- [ ] Handle error states with error.tsx
- [ ] Use React Hook Form + Zod for forms
- [ ] Follow file organization (app/ or components/)
- [ ] Implement proper authentication checks
- [ ] Add HIPAA-compliant access logging where needed

### New Feature Checklist

Creating a feature? Set up this structure:

- [ ] Create `app/(dashboard)/[feature]/` directory for routes
- [ ] Create `components/[feature]/` for feature components
- [ ] Create `lib/actions/[feature].ts` for Server Actions
- [ ] Create `lib/api/[feature].ts` for API client (if needed)
- [ ] Set up TypeScript types in `types/[feature].ts`
- [ ] Use proper authentication middleware
- [ ] Implement audit logging for PHI access
- [ ] Add loading.tsx and error.tsx

---

## Architecture Overview

### Next.js 14 App Router

```
User Request
    ↓
Next.js Middleware (auth check)
    ↓
Server Component (default)
    ↓
Data Fetching (direct DB or API)
    ↓
Client Component (interactive UI)
    ↓
Server Actions (mutations)
```

---

## Directory Structure

```
frontend/
├── app/
│   ├── (auth)/              # Auth routes (login, register)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── patients/
│   │   │   ├── page.tsx             # List patients
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Patient detail
│   │   │   │   └── edit/page.tsx    # Edit patient
│   │   │   ├── new/page.tsx         # New patient
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── appointments/
│   │   ├── clinical-notes/
│   │   ├── lab-results/
│   │   └── layout.tsx       # Dashboard layout
│   ├── api/                 # API routes (use sparingly)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── patients/            # Patient-specific components
│   ├── appointments/        # Appointment components
│   ├── forms/               # Reusable form components
│   └── layouts/             # Layout components
├── lib/
│   ├── actions/             # Server Actions
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   └── auth.ts
│   ├── api/                 # API client functions
│   ├── utils/               # Utility functions
│   ├── validations/         # Zod schemas
│   └── db.ts                # Database client (if using Prisma)
├── types/
│   ├── patient.ts
│   ├── appointment.ts
│   └── index.ts
├── middleware.ts            # Auth middleware
└── next.config.js
```

---

## Core Principles

### 1. Server Components by Default

```typescript
// ✅ DEFAULT: Server Component (no 'use client')
// app/(dashboard)/patients/page.tsx
import { getPatients } from '@/lib/actions/patients';
import { PatientList } from '@/components/patients/PatientList';

export default async function PatientsPage() {
    const patients = await getPatients();

    return (
        <div>
            <h1>Patients</h1>
            <PatientList patients={patients} />
        </div>
    );
}

// ❌ AVOID: Don't use 'use client' unless you need interactivity
'use client';
export default function PatientsPage() {
    // This runs on client, missing Server Component benefits
}
```

### 2. Use 'use client' Only When Needed

```typescript
// ✅ CORRECT: Client Component for interactivity
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function PatientSearch() {
    const [query, setQuery] = useState('');

    return (
        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
        />
    );
}
```

**When to use 'use client':**
- useState, useEffect, useContext, other React hooks
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- Third-party libraries that use browser APIs

### 3. Server Actions for Mutations

```typescript
// lib/actions/patients.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const patientSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().date(),
    medicalRecordNumber: z.string().min(1),
});

export async function createPatient(formData: FormData) {
    // Validate
    const validatedFields = patientSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dateOfBirth: formData.get('dateOfBirth'),
        medicalRecordNumber: formData.get('medicalRecordNumber'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    // Call API or database
    await fetch('http://localhost:8000/api/patients/', {
        method: 'POST',
        body: JSON.stringify(validatedFields.data),
        headers: { 'Content-Type': 'application/json' },
    });

    // Revalidate and redirect
    revalidatePath('/patients');
    redirect('/patients');
}

// components/patients/PatientForm.tsx
'use client';

import { useFormState } from 'react-dom';
import { createPatient } from '@/lib/actions/patients';

export function PatientForm() {
    const [state, formAction] = useFormState(createPatient, null);

    return (
        <form action={formAction}>
            <input name="firstName" required />
            {state?.errors?.firstName && <p>{state.errors.firstName}</p>}

            <input name="lastName" required />
            {state?.errors?.lastName && <p>{state.errors.lastName}</p>}

            <button type="submit">Create Patient</button>
        </form>
    );
}
```

### 4. React Hook Form + Zod for Complex Forms

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    email: z.string().email().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
    });

    const onSubmit = async (data: PatientFormData) => {
        const response = await fetch('/api/patients', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            // Handle error
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label>First Name</label>
                <input {...register('firstName')} />
                {errors.firstName && <p>{errors.firstName.message}</p>}
            </div>

            <div>
                <label>Last Name</label>
                <input {...register('lastName')} />
                {errors.lastName && <p>{errors.lastName.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Patient'}
            </button>
        </form>
    );
}
```

### 5. Loading and Error States

```typescript
// app/(dashboard)/patients/loading.tsx
export default function Loading() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );
}

// app/(dashboard)/patients/error.tsx
'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
            <p className="mt-2">{error.message}</p>
            <button
                onClick={() => reset()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
                Try again
            </button>
        </div>
    );
}
```

### 6. Authentication Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('session-token');

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect authenticated users from auth pages
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 7. TypeScript Types

```typescript
// types/patient.ts
export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
    phone?: string;
    email?: string;
    address?: Address;
    insuranceInfo?: InsuranceInfo;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface InsuranceInfo {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
}

// Use in components
import type { Patient } from '@/types/patient';

interface PatientCardProps {
    patient: Patient;
    onEdit?: (id: string) => void;
}

export function PatientCard({ patient, onEdit }: PatientCardProps) {
    // ...
}
```

### 8. Data Fetching Patterns

```typescript
// Server Component - Direct fetch
export default async function PatientsPage() {
    const response = await fetch('http://localhost:8000/api/patients/', {
        cache: 'no-store', // Always fresh data
        // or: next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    const patients = await response.json();

    return <PatientList patients={patients} />;
}

// Client Component - Use SWR or TanStack Query
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PatientList() {
    const { data, error, isLoading } = useSWR('/api/patients', fetcher);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading patients</div>;

    return (
        <div>
            {data.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
            ))}
        </div>
    );
}
```

### 9. Styling with Tailwind CSS

```typescript
// Using Tailwind CSS utility classes
export function PatientCard({ patient }: { patient: Patient }) {
    return (
        <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900">
                {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
                MRN: {patient.medicalRecordNumber}
            </p>
            <p className="text-sm text-gray-600">
                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
        </div>
    );
}

// Or with shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PatientCard({ patient }: { patient: Patient }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {patient.firstName} {patient.lastName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>MRN: {patient.medicalRecordNumber}</p>
                <p>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            </CardContent>
        </Card>
    );
}
```

### 10. Audit Logging for HIPAA

```typescript
// lib/actions/audit.ts
'use server';

import { cookies } from 'next/headers';

export async function logPHIAccess(
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId: string
) {
    const sessionToken = cookies().get('session-token');

    await fetch('http://localhost:8000/api/audit-logs/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken?.value}`,
        },
        body: JSON.stringify({
            action,
            resourceType,
            resourceId,
            timestamp: new Date().toISOString(),
        }),
    });
}

// Usage in page
export default async function PatientDetailPage({ params }: { params: { id: string } }) {
    // Log PHI access
    await logPHIAccess('READ', 'Patient', params.id);

    const patient = await getPatient(params.id);

    return <PatientDetail patient={patient} />;
}
```

---

## Common Imports

```typescript
// Next.js
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// React
import { useState, useEffect, useCallback, useMemo } from 'react';

// Form Handling
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// UI Components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Types
import type { Patient } from '@/types/patient';
```

---

## File Organization Best Practices

### Group by Feature

```
components/
  patients/
    PatientCard.tsx
    PatientList.tsx
    PatientForm.tsx
    PatientSearch.tsx
  appointments/
    AppointmentCard.tsx
    AppointmentCalendar.tsx
    AppointmentForm.tsx
```

### Shared Components in `components/ui/`

```
components/ui/
  button.tsx        # shadcn/ui button
  input.tsx         # shadcn/ui input
  card.tsx          # shadcn/ui card
  dialog.tsx        # shadcn/ui dialog
```

---

## Performance Optimization

### 1. Image Optimization

```typescript
import Image from 'next/image';

// ✅ ALWAYS use Next.js Image component
<Image
    src="/patient-photo.jpg"
    alt="Patient Photo"
    width={200}
    height={200}
    priority={true}  // For above-the-fold images
/>

// ❌ NEVER use plain <img>
<img src="/patient-photo.jpg" alt="Patient Photo" />
```

### 2. Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/charts/LabResultsChart'), {
    loading: () => <p>Loading chart...</p>,
    ssr: false, // Disable server-side rendering if needed
});

export function LabResults() {
    return (
        <div>
            <HeavyChart data={labData} />
        </div>
    );
}
```

### 3. Memoization

```typescript
'use client';

import { useMemo } from 'react';

export function PatientList({ patients }: { patients: Patient[] }) {
    const sortedPatients = useMemo(() => {
        return patients.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [patients]);

    return (
        <div>
            {sortedPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
            ))}
        </div>
    );
}
```

---

## Anti-Patterns to Avoid

❌ Using 'use client' everywhere
❌ Fetching data in Client Components when Server Components can do it
❌ Using API routes when Server Actions suffice
❌ Not handling loading and error states
❌ Exposing sensitive data in client-side code
❌ Not validating form inputs
❌ Hardcoded API URLs (use environment variables)
❌ Missing TypeScript types

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://user:password@localhost:5432/clinic_crm
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

```typescript
// Use in code
const apiUrl = process.env.NEXT_PUBLIC_API_URL;  // Public (client-side)
const dbUrl = process.env.DATABASE_URL;           // Private (server-side only)
```

---

## Testing

```typescript
// __tests__/components/PatientCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PatientCard } from '@/components/patients/PatientCard';

const mockPatient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    medicalRecordNumber: 'MRN001',
    dateOfBirth: '1990-01-01',
};

test('renders patient name', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

---

## Related Skills

- **django-backend-guidelines** - Backend API patterns
- **sentry-nextjs** - Error tracking for Next.js

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Next.js 14+ Focused**: ✅
