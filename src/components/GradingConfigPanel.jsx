import React from 'react';
import { Card, Input, Select } from './UI';

export default function GradingConfigPanel({ config, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const handleCreateThresholdChange = (key, value) => {
    onChange({
      ...config,
      divisionThresholds: {
        ...config.divisionThresholds,
        [key]: parseInt(value) || 0
      }
    });
  };

  return (
    <Card className="p-4 mt-4 border border-indigo-100 bg-indigo-50/20">
      <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
        <span>🎓</span> Result Configuration Panel
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grading Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gradingMode"
                checked={config.mode === 'pass_fail'}
                onChange={() => handleChange('mode', 'pass_fail')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Pass/Fail Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gradingMode"
                checked={config.mode === 'division'}
                onChange={() => handleChange('mode', 'division')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Division System</span>
            </label>
          </div>
        </div>

        {config.mode === 'pass_fail' ? (
          <div className="max-w-xs">
             <Input
              label="Pass Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={config.passPercentage}
              onChange={(e) => handleChange('passPercentage', parseInt(e.target.value) || 0)}
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Candidates scoring below this percentage will be marked as "Fail".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="3rd Division Min (%)"
                type="number"
                min="0"
                max="100"
                value={config.divisionThresholds?.third || 60}
                onChange={(e) => handleCreateThresholdChange('third', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Below this = Fail</p>
            </div>
            <div>
              <Input
                label="2nd Division Min (%)"
                type="number"
                min="0"
                max="100"
                value={config.divisionThresholds?.second || 75}
                onChange={(e) => handleCreateThresholdChange('second', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.divisionThresholds?.third || 60}% to {config.divisionThresholds?.second - 1 || 74}% = 3rd Div
              </p>
            </div>
            <div>
              <Input
                label="1st Division Min (%)"
                type="number"
                min="0"
                max="100"
                value={config.divisionThresholds?.first || 80}
                onChange={(e) => handleCreateThresholdChange('first', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.divisionThresholds?.second || 75}% to {config.divisionThresholds?.first - 1 || 79}% = 2nd Div
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}