/**
 * Компонент: SemanticClusterForm
 * Форма для сбора семантического ядра из seed-ключей
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Info, Loader, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationOptions, getLanguageOptions } from '@/lib/dataforseo/config';

interface SemanticClusterFormProps {
  onClose: () => void;
  onSuccess: (clusterId: number) => void;
}

interface Project {
  id: number;
  name: string;
}

export default function SemanticClusterForm({ onClose, onSuccess }: SemanticClusterFormProps) {
  const [seeds, setSeeds] = useState('');
  const [language, setLanguage] = useState('en');
  const [locationCode, setLocationCode] = useState('2840'); // USA по умолчанию
  const [locationName, setLocationName] = useState('United States');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [targetSize, setTargetSize] = useState(100);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  // Фильтры
  const [useFilters, setUseFilters] = useState(false);
  const [minSearchVolume, setMinSearchVolume] = useState(10);
  const [maxKeywordDifficulty, setMaxKeywordDifficulty] = useState(50);

  const locations = getLocationOptions();
  const languages = getLanguageOptions();

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
    if (location?.language) {
      setLanguage(location.language);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const seedList = seeds
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (seedList.length === 0) {
      toast.error('Введите хотя бы 1 seed-ключевое слово');
      return;
    }

    if (seedList.length > 5) {
      toast.error('Максимум 5 seed-ключевых слов');
      return;
    }

    setIsSubmitting(true);
    setProgress('Инициализация...');

    try {
      const requestBody: any = {
        seeds: seedList,
        language,
        location_code: locationCode,
        location_name: locationName,
        project_id: projectId,
        target_size: targetSize,
      };

      if (competitorDomain) {
        requestBody.competitor_domain = competitorDomain;
      }

      if (useFilters) {
        requestBody.filters = {
          min_search_volume: minSearchVolume,
          max_keyword_difficulty: maxKeywordDifficulty,
        };
      }

      setProgress('Сбор ключевых слов из Labs API...');

      const response = await fetch('/api/seo/semantic-cluster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setProgress('Завершено!');
        toast.success(`Собрано ${data.summary.total_keywords} ключевых слов в ${data.summary.cluster_count} кластеров!`);
        onSuccess(data.cluster_id);
        setTimeout(() => onClose(), 1000);
      } else {
        toast.error(data.error || 'Ошибка при сборе семантического ядра');
        setProgress('');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('Ошибка при отправке запроса');
      setProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const seedCount = seeds.split('\n').filter(s => s.trim().length > 0).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <Sparkles size={28} />
            <div>
              <h2 className="text-2xl font-bold">Сбор семантического ядра</h2>
              <p className="text-purple-100 text-sm mt-1">
                Автоматический сбор 100+ ключевых слов из seed-фраз
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seed Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seed-ключевые слова <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-500 font-normal">
                ({seedCount}/5)
              </span>
            </label>
            <textarea
              value={seeds}
              onChange={(e) => setSeeds(e.target.value)}
              placeholder="Введите 1-5 базовых ключевых слов&#10;Например:&#10;python автоматизация&#10;seo оптимизация&#10;контент маркетинг"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              required
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-gray-500">
              Из каждого seed-слова будет сгенерировано ~20-50 связанных ключевых слов
            </p>
          </div>

          {/* Region and Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Регион <span className="text-red-500">*</span>
              </label>
              <select
                value={locationCode}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Язык <span className="text-red-500">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Целевой размер кластера
            </label>
            <input
              type="number"
              value={targetSize}
              onChange={(e) => setTargetSize(parseInt(e.target.value))}
              min="20"
              max="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-gray-500">
              Рекомендуется: 100 ключевых слов. Можно до 1000, но будет дороже
            </p>
          </div>

          {/* Competitor Domain (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Домен конкурента (опционально)
            </label>
            <input
              type="text"
              value={competitorDomain}
              onChange={(e) => setCompetitorDomain(e.target.value)}
              placeholder="example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-gray-500">
              Добавит ключевые слова, по которым ранжируется конкурент
            </p>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проект (опционально)
            </label>
            <select
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Без проекта</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Toggle */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useFilters}
                onChange={(e) => setUseFilters(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">
                Применить фильтры качества
              </span>
            </label>

            {useFilters && (
              <div className="mt-4 pl-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Минимальный объем поиска
                  </label>
                  <input
                    type="number"
                    value={minSearchVolume}
                    onChange={(e) => setMinSearchVolume(parseInt(e.target.value))}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимальная сложность (KD)
                  </label>
                  <input
                    type="number"
                    value={maxKeywordDifficulty}
                    onChange={(e) => setMaxKeywordDifficulty(parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-purple-900">
                <p className="font-semibold mb-2">Что будет собрано:</p>
                <ul className="space-y-1">
                  <li>• Labs API: связанные ключи с метриками (SV, CPC, KD)</li>
                  <li>• SERP анализ: определение интента (informational/transactional)</li>
                  <li>• NLP кластеризация: группировка по семантическому сходству</li>
                  <li>• Экспорт в CSV с полными данными</li>
                </ul>
                <p className="text-xs text-purple-700 mt-3">
                  ⏱️ Обработка занимает 2-5 минут в зависимости от размера
                </p>
                <p className="text-xs text-purple-700">
                  💰 Стоимость: ~$0.10-0.50 за полный семкластер
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isSubmitting && progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader className="animate-spin text-blue-600" size={20} />
                <span className="text-sm font-medium text-blue-900">{progress}</span>
              </div>
            </div>
          )}

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
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting || seedCount === 0 || seedCount > 5}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Сбор...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Собрать семядро {seedCount > 0 ? `(${seedCount} seeds)` : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
