'use client';

/**
 * Global error boundary for the entire application.
 * Catches errors that occur anywhere in the app.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      contexts: {
        errorInfo: {
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg
            className="w-20 h-20 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. An error occurred while loading the application.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
