'use client';

import { useState, useEffect } from 'react';

// Force rebuild: 2026-03-01 - Added region selection and color picker

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: { name: string; description: string; color: string; search_location_code: number }) => void;
  project?: {
    id: number;
    name: string;
    description: string;
    color: string;
    search_location_code?: number;
  } | null;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const SEARCH_LOCATIONS = [
  { code: 2840, name: 'США (USA)', flag: '🇺🇸', description: 'Англоязычная аудитория, большой объем данных' },
  { code: 2144, name: 'Шри-Ланка (Sri Lanka)', flag: '🇱🇰', description: 'Локальная аудитория, высокая частотность' },
  { code: 2826, name: 'Великобритания (UK)', flag: '🇬🇧', description: 'Англоязычная аудитория, Европа' },
  { code: 2643, name: 'Россия (Russia)', flag: '🇷🇺', description: 'Русскоязычная аудитория' },
  { code: 2124, name: 'Канада (Canada)', flag: '🇨🇦', description: 'Англоязычная и франкоязычная аудитория' },
  { code: 2036, name: 'Австралия (Australia)', flag: '🇦🇺', description: 'Англоязычная аудитория, Океания' },
];

export default function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [searchLocationCode, setSearchLocationCode] = useState(2840); // Default: USA

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || '#3B82F6');
      setSearchLocationCode(project.search_location_code || 2840);
    } else {
      setName('');
      setDescription('');
      setColor('#3B82F6');
      setSearchLocationCode(2840);
    }
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, color, search_location_code: searchLocationCode });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {project ? 'Редактировать проект' : 'Новый проект'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Название проекта */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название проекта *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Блог компании"
                required
              />
            </div>

            {/* Описание */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Краткое описание проекта"
                rows={3}
              />
            </div>

            {/* Регион поиска для SEO */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌍 Регион поиска для SEO *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Регион определяет, откуда будут браться данные для анализа ключевых слов
              </p>
              <select
                value={searchLocationCode}
                onChange={(e) => setSearchLocationCode(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {SEARCH_LOCATIONS.map((location) => (
                  <option key={location.code} value={location.code}>
                    {location.flag} {location.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {SEARCH_LOCATIONS.find(l => l.code === searchLocationCode)?.description}
              </p>
            </div>

            {/* Выбор цвета */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цвет проекта
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      color === presetColor
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {project ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
