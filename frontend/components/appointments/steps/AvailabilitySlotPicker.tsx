'use client';

/**
 * Availability Slot Picker Step
 *
 * Displays a calendar to select a date and available time slots for the selected date.
 * Fetches available slots from the backend API.
 */

import { useState, useEffect, memo } from 'react';

interface AvailabilitySlotPickerProps {
  doctorId: string;
  selectedDate: string;
  appointmentDatetime: string;
  durationMinutes: number;
  onDateSelect: (date: string) => void;
  onSlotSelect: (appointmentDatetime: string, duration: number) => void;
  token: string;
}

interface TimeSlot {
  time: string;
  datetime: string;
}

function AvailabilitySlotPicker({
  doctorId,
  selectedDate,
  appointmentDatetime,
  durationMinutes,
  onDateSelect,
  onSlotSelect,
  token,
}: AvailabilitySlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!localSelectedDate || !doctorId) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/appointments/availability/?doctor_id=${doctorId}&date=${localSelectedDate}&duration_minutes=${durationMinutes}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to fetch available slots');
        }

        const data = await response.json();
        const slotsList = (data.slots || []).map((datetime: string) => {
          const date = new Date(datetime);
          return {
            time: date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            datetime,
          };
        });

        setSlots(slotsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load available slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [localSelectedDate, doctorId, durationMinutes, token]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalSelectedDate(newDate);
    onDateSelect(newDate);
  };

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get max date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Date and Time
        </h2>
        <p className="text-gray-600">
          Choose a date and available time slot for your appointment.
        </p>
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appointment Date
        </label>
        <input
          type="date"
          value={localSelectedDate}
          onChange={handleDateChange}
          min={minDate}
          max={maxDateStr}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Time Slots */}
      {localSelectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Times
          </label>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && slots.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              No available slots for this date. Please select another date.
            </div>
          )}

          {!loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.datetime}
                  onClick={() => onSlotSelect(slot.datetime, durationMinutes)}
                  className={`py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    appointmentDatetime === slot.datetime
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {localSelectedDate && appointmentDatetime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Selected:</span>{' '}
            {new Date(appointmentDatetime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(AvailabilitySlotPicker);
