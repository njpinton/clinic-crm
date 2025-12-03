'use client';

/**
 * Doctor Selector Step
 *
 * Displays available doctors and allows the user to select one.
 * Doctors can be filtered by appointment type and specialty.
 */

import { useState, useEffect, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Doctor {
  id: string;
  user: {
    first_name: string;
    last_name: string;
  };
  specialization?: string;
  bio?: string;
  image_url?: string;
}

interface DoctorSelectorProps {
  selectedDoctorId: string;
  appointmentType: string;
  onSelect: (doctorId: string) => void;
}

function DoctorSelector({
  selectedDoctorId,
  appointmentType,
  onSelect,
}: DoctorSelectorProps) {
  const { accessToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/doctors/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }

        const data = await response.json();
        setDoctors(Array.isArray(data.results) ? data.results : data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchDoctors();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          No doctors available at the moment.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select a Doctor
        </h2>
        <p className="text-gray-600">
          Choose a doctor for your {appointmentType} appointment.
        </p>
      </div>

      <div className="space-y-3">
        {doctors.map((doctor) => (
          <button
            key={doctor.id}
            onClick={() => onSelect(doctor.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedDoctorId === doctor.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {doctor.user.first_name.charAt(0)}
                {doctor.user.last_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Dr. {doctor.user.first_name} {doctor.user.last_name}
                </h3>
                {doctor.specialization && (
                  <p className="text-sm text-gray-600">{doctor.specialization}</p>
                )}
                {doctor.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {doctor.bio}
                  </p>
                )}
              </div>
              {selectedDoctorId === doctor.id && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(DoctorSelector);
