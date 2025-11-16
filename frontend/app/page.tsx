import Link from 'next/link';

export default function HomePage() {
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
            href="/patients"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Patients
          </Link>

          <div className="mt-8 text-sm text-gray-500">
            <p>⚠️ Note: Backend API is not yet deployed.</p>
            <p>Patient data operations will be available once the backend is connected.</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Frontend deployed on Vercel</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Supabase database created</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">○</span>
              <span>Backend API pending deployment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
