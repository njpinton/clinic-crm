'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchClinicalNotesByPatient, ClinicalNotesList, getNoteTypeColor, getNoteTypeDisplay } from '@/lib/api/clinical-notes';

interface PatientClinicalNotesTabProps {
  patientId: string;
  token?: string;
}

export function PatientClinicalNotesTab({ patientId, token }: PatientClinicalNotesTabProps) {
  const [notes, setNotes] = useState<ClinicalNotesList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch clinical notes for the patient
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchClinicalNotesByPatient(patientId, {
          ordering: '-note_date',
          token
        });
        setNotes(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load clinical notes';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [patientId, token]);

  // Filter notes by search term
  const filteredNotes = useMemo(() => {
    return notes.filter(note =>
      note.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.note_type_display.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Clinical Notes</h3>
        <Link
          href={`/clinical-notes/new?patient=${patientId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          + New Note
        </Link>
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by chief complaint or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading clinical notes...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {notes.length === 0
              ? 'No clinical notes found. Create the first note to get started.'
              : 'No notes match your search.'}
          </p>
        </div>
      ) : (
        /* Notes List */
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <Link
              key={note.id}
              href={`/clinical-notes/${note.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${getNoteTypeColor(note.note_type)}`}>
                      {note.note_type_display}
                    </span>
                    {note.is_signed && (
                      <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Signed
                      </span>
                    )}
                  </div>

                  {note.chief_complaint && (
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {note.chief_complaint}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    By {note.doctor_name} • {formatDate(note.note_date)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(note.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && notes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
            <p className="text-xs text-gray-600">Total Notes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {notes.filter(n => n.is_signed).length}
            </p>
            <p className="text-xs text-gray-600">Signed</p>
          </div>
        </div>
      )}
    </div>
  );
}
