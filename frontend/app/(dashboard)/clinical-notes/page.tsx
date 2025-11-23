'use client';

export default function ClinicalNotesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Notes</h1>
            <p className="text-gray-600 mt-1">SOAP notes and patient progress tracking</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">+ New Note</button>
        </div>
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Clinical notes will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
