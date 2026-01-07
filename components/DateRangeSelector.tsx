import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPresetRanges, PresetRange } from '../dateUtils';

interface DateRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('esteMes');
  const presets = getPresetRanges();

  const handlePresetClick = (preset: PresetRange) => {
    setSelectedPreset(preset);
    onChange(presets[preset]);
    setIsOpen(false);
  };

  const handleCustomStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset('personalizado');
    onChange({ ...value, start: new Date(e.target.value) });
  };

  const handleCustomEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset('personalizado');
    onChange({ ...value, end: new Date(e.target.value) });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <span className="material-symbols-outlined text-lg">calendar_today</span>
        <span>{presets[selectedPreset].label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {format(value.start, 'dd/MM/yy', { locale: es })} - {format(value.end, 'dd/MM/yy', { locale: es })}
        </span>
        <span className="material-symbols-outlined text-slate-500">expand_more</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Rápidos
              </p>
              {(Object.keys(presets) as PresetRange[]).filter(p => p !== 'personalizado').map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedPreset === preset
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {presets[preset].label}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Personalizado
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Desde</label>
                  <input
                    type="date"
                    value={value.start.toISOString().split('T')[0]}
                    onChange={handleCustomStartChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={value.end.toISOString().split('T')[0]}
                    onChange={handleCustomEndChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeSelector;
