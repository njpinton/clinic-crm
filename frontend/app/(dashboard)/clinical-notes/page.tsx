'use client';

/**
 * Clinical Notes Page - Read-only view with real data
 * Display SOAP notes and patient progress tracking
 */

import { useEffect, useState, useMemo } from 'react';
import { getClinicalNotes, ClinicalNote, getNoteTypeColor } from '@/lib/api/clinical-notes';

export default function ClinicalNotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
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
        const response = await getClinicalNotes();
        setNotes(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load clinical notes';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch =
        searchTerm === '' ||
        note.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === '' || note.noteType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [notes, searchTerm, typeFilter]);

  const noteTypes = useMemo(() => {
    return [...new Set(notes.map(n => n.noteType))].sort();
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
                        <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {note.patientName} • {note.doctorName}
                        </p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getNoteTypeColor(note.noteType)}`}>
                        {note.noteType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-gray-700 mb-4 whitespace-pre-wrap text-sm leading-relaxed">
                      {note.content}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Visit: {formatDate(note.visitDate)}</span>
                      <span className="text-xs text-gray-500">Last updated: {formatDate(note.updatedAt)}</span>
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
                <p className="text-3xl font-bold text-green-600 mt-2">{[...new Set(notes.map(n => n.patientId))].length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
