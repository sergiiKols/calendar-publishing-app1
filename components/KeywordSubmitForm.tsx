/**
 * Компонент: KeywordSubmitForm
 * Форма для отправки ключевых слов на анализ в DataForSEO
 */

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationOptions, getLanguageOptions } from '@/lib/dataforseo/config';

interface KeywordSubmitFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Project {
  id: number;
  name: string;
}

export default function KeywordSubmitForm({ onClose, onSuccess }: KeywordSubmitFormProps) {
  const [keywords, setKeywords] = useState('');
  const [language, setLanguage] = useState('en');
  const [locationCode, setLocationCode] = useState('2840'); // USA по умолчанию
  const [locationName, setLocationName] = useState('United States');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locations = getLocationOptions();
  const languages = getLanguageOptions();

  // Загружаем список проектов
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const location = locations.find(loc => loc.value === code);
    setLocationCode(code);
    setLocationName(location?.label || '');
    // Автоматически меняем язык в зависимости от региона
    if (location?.language) {
      setLanguage(location.language);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Парсим ключевые слова (по одному на строку)
    const keywordList = keywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordList.length === 0) {
      toast.error('Введите хотя бы одно ключевое слово');
      return;
    }

    if (keywordList.length > 30) {
      toast.error('Максимум 30 ключевых слов за раз');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywordList,
          language,
          location_code: locationCode,
          location_name: locationName,
          project_id: projectId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${keywordList.length} ключевых слов отправлено на анализ!`);
        setKeywords('');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Ошибка при отправке');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  const keywordCount = keywords.split('\n').filter(k => k.trim().length > 0).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Отправить ключевые слова на анализ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Keywords Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ключевые слова <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-500 font-normal">
                ({keywordCount}/30)
              </span>
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Введите ключевые слова, каждое с новой строки&#10;Например:&#10;купить ноутбук&#10;ноутбук цена&#10;лучший ноутбук 2024"
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Введите от 1 до 30 ключевых слов, каждое с новой строки
            </p>
          </div>

          {/* Region and Language Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Регион <span className="text-red-500">*</span>
              </label>
              <select
                value={locationCode}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Язык <span className="text-red-500">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проект (опционально)
            </label>
            <select
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Без проекта</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Привяжите анализ к конкретному проекту для удобной организации
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Что будет проанализировано:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Keywords Data:</strong> объем поиска, CPC, конкуренция</li>
              <li>• <strong>SERP Analysis:</strong> топ-10 позиций в поисковой выдаче</li>
              <li>• <strong>Suggestions:</strong> похожие и связанные ключевые слова</li>
            </ul>
            <p className="text-xs text-blue-700 mt-3">
              Анализ выполняется в фоновом режиме и может занять несколько минут
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || keywordCount === 0 || keywordCount > 30}
            >
              {isSubmitting ? 'Отправка...' : `Отправить ${keywordCount > 0 ? `(${keywordCount})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
