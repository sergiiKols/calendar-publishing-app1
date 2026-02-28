/**
 * Компонент: StepSettings
 * Шаг 2: Настройки поиска (язык и локация)
 */

'use client';

import { Globe, MapPin } from 'lucide-react';

interface StepSettingsProps {
  language: string;
  location: string;
  languageOptions: Array<{ value: string; label: string }>;
  locationOptions: Array<{ value: string; label: string; language?: string }>;
  onLanguageChange: (language: string) => void;
  onLocationChange: (locationCode: string, locationName: string) => void;
}

export default function StepSettings({
  language,
  location,
  languageOptions,
  locationOptions,
  onLanguageChange,
  onLocationChange
}: StepSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Настройки поиска
        </h3>
        <p className="text-sm text-gray-600">
          Выберите язык и локацию для анализа ключевых слов
        </p>
      </div>

      {/* Выбор языка */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Globe size={16} />
          Язык поиска
        </label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          <option value="">Выберите язык...</option>
          {languageOptions.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        {language && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            ✓ Выбран язык: <strong>{languageOptions.find(l => l.value === language)?.label}</strong>
          </p>
        )}
      </div>

      {/* Выбор локации */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <MapPin size={16} />
          Локация (страна)
        </label>
        <select
          value={location}
          onChange={(e) => {
            const selectedOption = locationOptions.find(l => l.value === e.target.value);
            if (selectedOption) {
              onLocationChange(selectedOption.value, selectedOption.label);
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          <option value="">Выберите локацию...</option>
          {locationOptions.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
        {location && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            ✓ Выбрана локация: <strong>{locationOptions.find(l => l.value === location)?.label}</strong>
          </p>
        )}
      </div>

      {/* Предпросмотр */}
      {language && location && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Предпросмотр настроек:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>🌍 Язык: <strong>{languageOptions.find(l => l.code === language)?.name}</strong></p>
            <p>📍 Локация: <strong>{locationOptions.find(l => l.code === location)?.name}</strong></p>
          </div>
        </div>
      )}

      {/* Подсказка */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          💡 <strong>Совет:</strong> Выбирайте язык и локацию, соответствующие вашей целевой аудитории. Это влияет на релевантность данных о поисковых запросах.
        </p>
      </div>
    </div>
  );
}
