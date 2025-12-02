'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchPatientsAutocomplete } from '@/lib/api/patients';
import { Patient } from '@/types/patient';

interface PatientSearchProps {
  token: string;
  onPatientSelected: (patient: Patient) => void;
  onCreateNewClick: () => void;
  disabled?: boolean;
}

export const PatientSearch = ({
  token,
  onPatientSelected,
  onCreateNewClick,
  disabled = false
}: PatientSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedIndex(-1);

      const response = await searchPatientsAutocomplete(searchQuery, token);
      const patientResults = response.results || [];

      setResults(patientResults);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search patients');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search (300ms)
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectPatient(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    onPatientSelected(patient);
    setQuery(`${patient.first_name} ${patient.last_name}`);
    setShowResults(false);
    setResults([]);
    setSelectedIndex(-1);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[role="option"]');
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setShowResults(true)}
            placeholder="Search patient by name, MRN, phone, email, or DOB..."
            disabled={disabled}
            aria-label="Search for patient"
            aria-expanded={showResults}
            aria-controls="patient-search-results"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Results dropdown */}
          {showResults && (
            <div
              id="patient-search-results"
              role="listbox"
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto"
            >
              {isLoading && (
                <div className="p-3 text-center text-gray-500">
                  Searching...
                </div>
              )}

              {error && (
                <div className="p-3 text-center text-red-500 text-sm">
                  {error}
                </div>
              )}

              {!isLoading && results.length === 0 && query.trim() && !error && (
                <div className="p-3 text-center text-gray-500">
                  No patients found. Create a new one using the button below.
                </div>
              )}

              {results.map((patient, index) => (
                <button
                  key={patient.id}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleSelectPatient(patient)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-blue-50 transition-colors ${
                    selectedIndex === index ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          MRN: <span className="font-mono">{patient.medical_record_number}</span>
                        </div>
                        {patient.date_of_birth && (
                          <div>
                            DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                        {patient.phone && <div>Phone: {patient.phone}</div>}
                        {patient.email && <div>Email: {patient.email}</div>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Create new patient button in results */}
              {query.trim() && !error && (
                <div className="border-t p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResults(false);
                      onCreateNewClick();
                    }}
                    className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 font-medium transition-colors rounded-md text-sm"
                  >
                    + Create new patient
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create new patient button (always visible) */}
        <button
          type="button"
          onClick={onCreateNewClick}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + New Patient
        </button>
      </div>
    </div>
  );
};
