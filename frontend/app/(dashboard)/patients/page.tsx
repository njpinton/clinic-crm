'use client';

/**
 * Patients list page - Client Component with authentication and multiple views.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPatients } from '@/lib/api/patients';
import { PatientList } from '@/components/patients/PatientList';
import PatientTable from '@/components/patients/PatientTable';
import PatientSimpleListView from '@/components/patients/PatientSimpleListView';
import ViewToggle, { type ViewType } from '@/components/common/ViewToggle';
import type { Patient } from '@/types/patient';

export default function PatientsPage() {
    const { user, accessToken, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>(() => {
        // Try to get saved view preference from localStorage
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('patientViewPreference') as ViewType) || 'grid';
        }
        return 'grid';
    });

    const handleViewChange = useCallback((view: ViewType) => {
        setCurrentView(view);
        if (typeof window !== 'undefined') {
            localStorage.setItem('patientViewPreference', view);
        }
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch patients when authenticated
    useEffect(() => {
        async function loadPatients() {
            console.log('loadPatients called. User:', user?.email, 'Role:', user?.role);
            if (!accessToken) {
                console.log('No access token available');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                console.log('Fetching patients with token:', accessToken.substring(0, 10) + '...');
                const data = await fetchPatients({ token: accessToken });
                console.log('Patients loaded:', data);
                
                if (data && Array.isArray(data.results)) {
                    setPatients(data.results);
                } else {
                    console.warn('Unexpected API response format:', data);
                    setPatients([]);
                }
            } catch (err) {
                console.error('Error in loadPatients:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to load patients';
                setError(errorMessage);

                // If unauthorized, redirect to login
                if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
                    logout();
                }
            } finally {
                setIsLoading(false);
            }
        }

        if (user && accessToken) {
            loadPatients();
        }
    }, [user, accessToken, logout]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-blue-600 text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="mt-2 text-gray-600">
                        Manage patient records and information
                    </p>
                    {user && (
                        <p className="mt-1 text-sm text-gray-500">
                            Welcome, {user.first_name || user.firstName} {user.last_name || user.lastName} ({user.role})
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/patients/new"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Patient
                    </Link>
                    <button
                        onClick={logout}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* View Toggle */}
            {!isLoading && !error && patients.length > 0 && (
                <div className="mb-6">
                    <ViewToggle currentView={currentView} onViewChange={handleViewChange} />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    <p className="font-medium">Error loading patients:</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="text-gray-600">Loading patients...</div>
                </div>
            ) : !error && (
                /* Patient Views - Conditional rendering based on currentView */
                <>
                    {currentView === 'grid' && <PatientList patients={patients} />}
                    {currentView === 'table' && <PatientTable patients={patients} />}
                    {currentView === 'list' && <PatientSimpleListView patients={patients} />}
                </>
            )}
        </div>
    );
}
