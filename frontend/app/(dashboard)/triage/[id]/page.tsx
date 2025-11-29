'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointment, Appointment } from '@/lib/api/appointments';
import { createTriageAssessment, TriageCreatePayload } from '@/lib/api/triage';

export default function TriagePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vitals State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [temp, setTemp] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;
      try {
        setIsLoading(true);
        const appt = await getAppointment(params.id, accessToken);
        setAppointment(appt);
      } catch (err) {
        console.error(err);
        setError('Failed to load appointment details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [accessToken, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !appointment) return;

    try {
      setIsSubmitting(true);
      
      const payload: TriageCreatePayload = {
        appointment: appointment.id,
        chief_complaint: chiefComplaint,
        temperature: temp ? parseFloat(temp) : undefined,
        blood_pressure_systolic: bpSystolic ? parseInt(bpSystolic) : undefined,
        blood_pressure_diastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined,
        heart_rate: hr ? parseInt(hr) : undefined,
        respiratory_rate: rr ? parseInt(rr) : undefined,
        oxygen_saturation: spo2 ? parseInt(spo2) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        notes: notes
      };

      await createTriageAssessment(payload, accessToken);
      
      // Redirect back to dashboard or queue
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to save triage assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!appointment) return <div className="p-8 text-center">Appointment not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Triage</h1>
        <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-lg font-medium text-blue-900">{appointment.patientName}</p>
          <p className="text-sm text-blue-700">Appointment with {appointment.doctorName} at {new Date(appointment.dateTime).toLocaleTimeString()}</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow border border-gray-200">
        
        {/* Chief Complaint */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Chief Complaint <span className="text-red-500">*</span></label>
          <textarea
            required
            rows={2}
            value={chiefComplaint}
            onChange={e => setChiefComplaint(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Fever and cough for 3 days"
          />
        </div>

        {/* Vitals Grid */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={e => setTemp(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">BP (Sys)</label>
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={e => setBpSystolic(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">BP (Dia)</label>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={e => setBpDiastolic(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="80"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Heart Rate (BPM)</label>
              <input
                type="number"
                value={hr}
                onChange={e => setHr(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Resp. Rate</label>
              <input
                type="number"
                value={rr}
                onChange={e => setRr(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">O2 Saturation (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={e => setSpo2(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
          </div>
        </div>

        {/* Nurse Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nurse Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="General observations..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Triage'}
          </button>
        </div>
      </form>
    </div>
  );
}
