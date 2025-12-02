'use client';

/**
 * Clinical Notes Page - Read-only view with real data
 * Display SOAP notes and patient progress tracking
 */

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClinicalNotes, ClinicalNotesList, getNoteTypeColor } from '@/lib/api/clinical-notes';

export default function ClinicalNotesPage() {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState<ClinicalNotesList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch clinical notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getClinicalNotes({ token: accessToken || undefined });
        setNotes(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load clinical notes';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      loadNotes();
    }
  }, [accessToken]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch =
        searchTerm === '' ||
        note.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.chief_complaint && note.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === '' || note.note_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [notes, searchTerm, typeFilter]);

  const noteTypes = useMemo(() => {
    return [...new Set(notes.map(n => n.note_type_display))].sort();
  }, [notes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Notes</h1>
            <p className="text-gray-600 mt-1">View SOAP notes and patient progress</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by patient or note title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Note Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {noteTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading clinical notes...</div>
          </div>
        ) : (
          <>
            {/* Notes List */}
            <div className="space-y-4">
              {filteredNotes.length === 0 ? (
                <div className="bg-white p-6 text-center rounded-lg border border-gray-200">
                  <p className="text-gray-500">No clinical notes found</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{note.note_type_display}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {note.patient_name} • {note.doctor_name}
                        </p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getNoteTypeColor(note.note_type)}`}>
                        {note.note_type_display.toUpperCase()}
                      </span>
                    </div>
                    {note.chief_complaint && (
                      <div className="text-gray-700 mb-4 text-sm leading-relaxed">
                        <strong>Chief Complaint:</strong> {note.chief_complaint}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Date: {formatDate(note.note_date)}</span>
                      <span className="text-xs text-gray-500">Created: {formatDate(note.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Notes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{notes.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Note Types</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{noteTypes.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Unique Patients</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{[...new Set(notes.map(n => n.patient_name))].length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
