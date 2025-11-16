'use client';

/**
 * Error boundary for patients page.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                    Failed to Load Patients
                </h2>
                <p className="text-red-700 mb-6">
                    {error.message || 'An unexpected error occurred'}
                </p>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
