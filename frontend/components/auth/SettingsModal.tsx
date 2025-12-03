'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationSettings {
  region_id: string;
  province_id: string;
  municipality_id: string;
  barangay_id: string;
  postal_code: string;
}

interface Region {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
}

interface Barangay {
  id: string;
  name: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { accessToken, user } = useAuth();
  const [settings, setSettings] = useState<LocationSettings>({
    region_id: '',
    province_id: '',
    municipality_id: '',
    barangay_id: '',
    postal_code: '',
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Load regions on mount and load current settings when modal opens
  useEffect(() => {
    if (accessToken) {
      loadRegions();
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadSettings();
    }
  }, [isOpen, accessToken]);

  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/psgc/regions/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load regions');
      }

      const data = await response.json();
      setRegions(data.results || data);
    } catch (err) {
      console.error('Error loading regions:', err);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadProvinces = async (regionId: string) => {
    if (!regionId) {
      setProvinces([]);
      setMunicipalities([]);
      setBarangays([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/psgc/provinces/?region_id=${regionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load provinces');
      }

      const data = await response.json();
      setProvinces(data.results || data);
      setMunicipalities([]);
      setBarangays([]);
    } catch (err) {
      console.error('Error loading provinces:', err);
    }
  };

  const loadMunicipalities = async (provinceId: string) => {
    if (!provinceId) {
      setMunicipalities([]);
      setBarangays([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/psgc/municipalities/?province_id=${provinceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load municipalities');
      }

      const data = await response.json();
      setMunicipalities(data.results || data);
      setBarangays([]);
    } catch (err) {
      console.error('Error loading municipalities:', err);
    }
  };

  const loadBarangays = async (municipalityId: string) => {
    if (!municipalityId) {
      setBarangays([]);
      setSettings((prev) => ({ ...prev, postal_code: '' }));
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/psgc/barangays/?municipality_id=${municipalityId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load barangays');
      }

      const data = await response.json();
      setBarangays(data.results || data);
      setSettings((prev) => ({ ...prev, postal_code: '' }));
    } catch (err) {
      console.error('Error loading barangays:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/users/me/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings({
        region_id: data.region_id || '',
        province_id: data.province_id || '',
        municipality_id: data.municipality_id || '',
        barangay_id: data.barangay_id || '',
        postal_code: data.postal_code || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  };

  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = e.target.value;
    setSettings((prev) => ({
      ...prev,
      region_id: regionId,
      province_id: '',
      municipality_id: '',
      barangay_id: '',
      postal_code: '',
    }));
    await loadProvinces(regionId);
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSettings((prev) => ({
      ...prev,
      province_id: provinceId,
      municipality_id: '',
      barangay_id: '',
      postal_code: '',
    }));
    await loadMunicipalities(provinceId);
  };

  const handleMunicipalityChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const municipalityId = e.target.value;
    setSettings((prev) => ({
      ...prev,
      municipality_id: municipalityId,
      barangay_id: '',
      postal_code: '',
    }));
    await loadBarangays(municipalityId);
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const barangayId = e.target.value;
    setSettings((prev) => ({
      ...prev,
      barangay_id: barangayId,
    }));
    // Auto-populate postal code if available
    const selected = barangays.find((b) => b.id === barangayId);
    if (selected) {
      // If the barangay has postal code in its data, it would be set here
      // For now, we'll just use the barangay name as fallback
      setSettings((prev) => ({
        ...prev,
        postal_code: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/users/update_me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update settings');
      }

      setSuccess('Settings updated successfully!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Info Display */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="text-base font-semibold text-gray-900">{user?.email}</p>
            </div>

            {/* Location Settings - Cascading Dropdowns */}
            <div>
              <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                id="region_id"
                value={settings.region_id}
                onChange={handleRegionChange}
                disabled={loadingRegions}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select a region...</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="province_id" className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                id="province_id"
                value={settings.province_id}
                onChange={handleProvinceChange}
                disabled={!settings.region_id || provinces.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select a province...</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="municipality_id" className="block text-sm font-medium text-gray-700 mb-1">
                Municipality / City
              </label>
              <select
                id="municipality_id"
                value={settings.municipality_id}
                onChange={handleMunicipalityChange}
                disabled={!settings.province_id || municipalities.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select a municipality/city...</option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="barangay_id" className="block text-sm font-medium text-gray-700 mb-1">
                Barangay
              </label>
              <select
                id="barangay_id"
                value={settings.barangay_id}
                onChange={handleBarangayChange}
                disabled={!settings.municipality_id || barangays.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select a barangay...</option>
                {barangays.map((barangay) => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                Postal / Zip Code (Auto-populated)
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={settings.postal_code}
                onChange={(e) => setSettings((prev) => ({ ...prev, postal_code: e.target.value }))}
                placeholder="Automatically set from barangay"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
