'use client';

/**
 * Clinical Context Panel
 *
 * Displays recent clinical notes, triage assessments, and vitals
 * to provide context before booking the appointment.
 */

import { useState, useEffect, memo } from 'react';

interface ClinicalNote {
  id: string;
  note_type: string;
  content: string;
  created_at: string;
}

interface TriageAssessment {
  id: string;
  chief_complaint: string;
  severity: string;
  assessment_date: string;
}

interface ClinicalContextPanelProps {
  patientId?: string;
  token: string;
}

function ClinicalContextPanel({
  patientId,
  token,
}: ClinicalContextPanelProps) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !token) {
      setLoading(false);
      return;
    }

    const fetchClinicalContext = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch clinical notes
        const response = await fetch(
          `/api/patients/${patientId}/clinical-notes/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch clinical context');
        }

        const data = await response.json();
        setNotes((Array.isArray(data.results) ? data.results : data) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clinical context');
      } finally {
        setLoading(false);
      }
    };

    fetchClinicalContext();
  }, [patientId, token]);

  if (!patientId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Clinical history will be available once a patient is selected.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Clinical History
        </h3>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {notes.length === 0 && !error && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-sm">
          No previous clinical notes found for this patient.
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recent Notes</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notes.slice(0, 5).map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {note.note_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Before Your Appointment
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Please arrive 10 minutes early</li>
          <li>• Bring your insurance card and ID</li>
          <li>• List any current medications</li>
          <li>• Note any recent symptoms or concerns</li>
        </ul>
      </div>
    </div>
  );
}

export default memo(ClinicalContextPanel);
