'use client';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Application configuration</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow text-center mt-8">
          <p className="text-gray-600">Settings will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
