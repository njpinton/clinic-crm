'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to patients page
    if (!isLoading && user) {
      router.push('/patients');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-2xl mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Clinic CRM
          </h1>
          <p className="text-xl text-gray-600">
            HIPAA-Compliant Patient Management System
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold mb-2">Patient Management</h3>
            <p className="text-gray-600">
              Comprehensive patient records with search, filter, and CRUD operations
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">HIPAA Compliant</h3>
            <p className="text-gray-600">
              Built-in audit logging, role-based access control, and data security
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Modern Tech Stack</h3>
            <p className="text-gray-600">
              Next.js 14, Django, PostgreSQL, and TypeScript for reliability
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In to Access Patients
          </Link>

          <div className="mt-8 text-sm text-gray-600">
            <p>Secure, HIPAA-compliant access to patient records</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-16 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Frontend running</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Backend API connected</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Supabase database ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
