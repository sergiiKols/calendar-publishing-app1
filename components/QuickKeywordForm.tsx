/**
 * Компонент: QuickKeywordForm
 * Быстрая форма для добавления отдельных ключевых слов к существующему проекту
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationOptions, getLanguageOptions } from '@/lib/dataforseo/config';

interface QuickKeywordFormProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedProjectId?: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

export default function QuickKeywordForm({ 
  onClose, 
  onSuccess, 
  preselectedProjectId 
}: QuickKeywordFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    projectId: preselectedProjectId?.toString() || '',
    keywords: '',
    language: 'ru',
    location: '2643', // Russia
    locationName: 'Russia'
  });

  const languageOptions = getLanguageOptions();
  const locationOptions = getLocationOptions();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      const projectsList = data.projects || [];
      setProjects(projectsList);
      
      if (!formData.projectId && projectsList.length > 0) {
        setFormData(prev => ({ ...prev, projectId: projectsList[0].id.toString() }));
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Ошибка загрузки проектов');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error('Выберите проект');
      return;
    }

    const keywordList = formData.keywords.split('\n').filter(k => k.trim());
    if (keywordList.length === 0) {
      toast.error('Введите хотя бы одно ключевое слово');
      return;
    }

    if (keywordList.length > 100) {
      toast.error('Максимум 100 ключевых слов за раз');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywordList,
          language: formData.language,
          location_code: formData.location,
          location_name: formData.locationName,
          project_id: parseInt(formData.projectId)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${keywordList.length} ключевых слов добавлено!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Ошибка при добавлении');
      }
    } catch (error) {
      console.error('Error submitting keywords:', error);
      toast.error('Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (code: string) => {
    const location = locationOptions.find(l => l.value === code);
    setFormData({
      ...formData,
      location: code,
      locationName: location?.label || code
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Добавить ключевые слова
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Быстрое добавление к существующему проекту
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проект <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Выберите проект</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Язык <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {languageOptions.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Регион <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {locationOptions.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ключевые слова <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="Введите ключевые слова (каждое с новой строки)&#10;Например:&#10;купить ноутбук&#10;ноутбук цена&#10;игровой ноутбук"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.keywords.split('\n').filter(k => k.trim()).length} / 100 ключевых слов
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Подсказка:</strong> Добавленные ключевые слова будут автоматически 
              отправлены на анализ через DataForSEO API для получения метрик (объем поиска, CPC, конкуренция).
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Добавление...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Добавить ключевые слова
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
