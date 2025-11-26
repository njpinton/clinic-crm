'use client';

import { useEffect, useMemo } from 'react';
import { VitalSigns } from '@/lib/api/clinical-notes';

interface VitalSignsFormProps {
  values: VitalSigns;
  onChange: (field: keyof VitalSigns, value: number | undefined) => void;
  disabled?: boolean;
}

export function VitalSignsForm({ values, onChange, disabled = false }: VitalSignsFormProps) {
  // Calculate BMI whenever height or weight changes
  const bmi = useMemo(() => {
    if (values.weight && values.height) {
      // Convert to metric: weight in kg, height in cm
      const weightKg = values.weight * 0.453592; // lbs to kg
      const heightM = values.height * 0.0254; // inches to meters
      return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    }
    return undefined;
  }, [values.weight, values.height]);

  // Calculate blood pressure category
  const bpCategory = useMemo(() => {
    const systolic = values.blood_pressure_systolic;
    const diastolic = values.blood_pressure_diastolic;

    if (!systolic || !diastolic) return null;

    if (systolic < 120 && diastolic < 80) return 'Normal';
    if (systolic < 130 && diastolic < 80) return 'Elevated';
    if (systolic < 140 || diastolic < 90) return 'Stage 1 Hypertension';
    if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
    if (systolic > 180 || diastolic > 120) return 'Hypertensive Crisis';

    return null;
  }, [values.blood_pressure_systolic, values.blood_pressure_diastolic]);

  const handleNumberInput = (field: keyof VitalSigns, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onChange(field, numValue);
  };

  return (
    <div className="space-y-6">
      {/* Temperature */}
      <div>
        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature (°F)
        </label>
        <input
          id="temperature"
          type="number"
          step="0.1"
          min="95"
          max="105"
          value={values.temperature ?? ''}
          onChange={(e) => handleNumberInput('temperature', e.target.value)}
          disabled={disabled}
          placeholder="98.6"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">Normal: 98.6°F</p>
      </div>

      {/* Blood Pressure */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bp-systolic" className="block text-sm font-medium text-gray-700 mb-1">
            Blood Pressure Systolic (mmHg)
          </label>
          <input
            id="bp-systolic"
            type="number"
            min="50"
            max="250"
            value={values.blood_pressure_systolic ?? ''}
            onChange={(e) => handleNumberInput('blood_pressure_systolic', e.target.value)}
            disabled={disabled}
            placeholder="120"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
        <div>
          <label htmlFor="bp-diastolic" className="block text-sm font-medium text-gray-700 mb-1">
            Blood Pressure Diastolic (mmHg)
          </label>
          <input
            id="bp-diastolic"
            type="number"
            min="30"
            max="150"
            value={values.blood_pressure_diastolic ?? ''}
            onChange={(e) => handleNumberInput('blood_pressure_diastolic', e.target.value)}
            disabled={disabled}
            placeholder="80"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* BP Category */}
      {bpCategory && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          bpCategory === 'Normal' ? 'bg-green-50 text-green-800 border border-green-200' :
          bpCategory === 'Elevated' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          bpCategory.includes('Stage 2') ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-orange-50 text-orange-800 border border-orange-200'
        }`}>
          Blood Pressure: {bpCategory}
        </div>
      )}

      {/* Heart Rate */}
      <div>
        <label htmlFor="heart-rate" className="block text-sm font-medium text-gray-700 mb-1">
          Heart Rate (BPM)
        </label>
        <input
          id="heart-rate"
          type="number"
          min="30"
          max="200"
          value={values.heart_rate ?? ''}
          onChange={(e) => handleNumberInput('heart_rate', e.target.value)}
          disabled={disabled}
          placeholder="72"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">Normal: 60-100 BPM (resting)</p>
      </div>

      {/* Respiratory Rate */}
      <div>
        <label htmlFor="respiratory-rate" className="block text-sm font-medium text-gray-700 mb-1">
          Respiratory Rate (breaths/min)
        </label>
        <input
          id="respiratory-rate"
          type="number"
          min="8"
          max="60"
          value={values.respiratory_rate ?? ''}
          onChange={(e) => handleNumberInput('respiratory_rate', e.target.value)}
          disabled={disabled}
          placeholder="16"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">Normal: 12-20 breaths/min</p>
      </div>

      {/* Oxygen Saturation */}
      <div>
        <label htmlFor="oxygen-saturation" className="block text-sm font-medium text-gray-700 mb-1">
          Oxygen Saturation (%)
        </label>
        <input
          id="oxygen-saturation"
          type="number"
          min="70"
          max="100"
          step="0.1"
          value={values.oxygen_saturation ?? ''}
          onChange={(e) => handleNumberInput('oxygen_saturation', e.target.value)}
          disabled={disabled}
          placeholder="98"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">Normal: 95-100%</p>
      </div>

      {/* Weight and Height for BMI */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (lbs)
          </label>
          <input
            id="weight"
            type="number"
            min="50"
            max="500"
            step="0.1"
            value={values.weight ?? ''}
            onChange={(e) => handleNumberInput('weight', e.target.value)}
            disabled={disabled}
            placeholder="170"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
            Height (inches)
          </label>
          <input
            id="height"
            type="number"
            min="24"
            max="96"
            step="0.1"
            value={values.height ?? ''}
            onChange={(e) => handleNumberInput('height', e.target.value)}
            disabled={disabled}
            placeholder="70"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* BMI Display */}
      {bmi !== undefined && (
        <div className={`px-4 py-3 rounded-lg border ${
          bmi < 18.5 ? 'bg-blue-50 border-blue-200 text-blue-800' :
          bmi < 25 ? 'bg-green-50 border-green-200 text-green-800' :
          bmi < 30 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">BMI</span>
            <span className="text-lg font-bold">{bmi}</span>
          </div>
          <p className="text-xs mt-1">
            {bmi < 18.5 ? 'Underweight' :
            bmi < 25 ? 'Normal weight' :
            bmi < 30 ? 'Overweight' :
            'Obese'}
          </p>
        </div>
      )}
    </div>
  );
}
