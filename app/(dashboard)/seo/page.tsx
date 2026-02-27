/**
 * Page: /seo
 * Страница для работы с ключевыми словами и DataForSEO
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import KeywordSubmitForm from '@/components/KeywordSubmitForm';
import KeywordsTable from '@/components/KeywordsTable';
import KeywordResultsModal from '@/components/KeywordResultsModal';
import SeoStatsCards from '@/components/SeoStatsCards';

interface Keyword {
  id: number;
  keyword: string;
  language: string;
  location_name: string;
  status: string;
  project_name?: string;
  tasks_count: number;
  completed_tasks: number;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
}

export default function SeoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  
  // Filters
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router, filterProject, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchKeywords(), fetchProjects()]);
    setLoading(false);
  };

  const fetchKeywords = async () => {
    try {
      let url = '/api/seo/keywords?limit=100';
      if (filterProject) url += `&project_id=${filterProject}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setKeywords(data.keywords || []);
        calculateStats(data.keywords || []);
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    }
  };

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

  const calculateStats = (keywordList: Keyword[]) => {
    const completed = keywordList.filter(k => k.status === 'completed').length;
    const processing = keywordList.filter(k => k.status === 'processing').length;
    const failed = keywordList.filter(k => k.status === 'failed').length;

    setStats({
      total: keywordList.length,
      completed,
      processing,
      failed,
    });
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleViewResults = (keywordId: number) => {
    setSelectedKeywordId(keywordId);
  };

  const handleCloseResults = () => {
    setSelectedKeywordId(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Keywords Analysis</h1>
              <p className="mt-1 text-sm text-gray-600">
                Анализ ключевых слов через DataForSEO API
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                Фильтры
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={18} />
                Обновить
              </button>
              <button
                onClick={() => setShowSubmitForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Добавить ключевые слова
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Проект
                  </label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Все проекты</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Все статусы</option>
                    <option value="pending">Ожидание</option>
                    <option value="processing">Обработка</option>
                    <option value="completed">Завершено</option>
                    <option value="failed">Ошибка</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterProject('');
                      setFilterStatus('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <SeoStatsCards
          total={stats.total}
          completed={stats.completed}
          processing={stats.processing}
          failed={stats.failed}
        />

        {/* Keywords Table */}
        <KeywordsTable
          keywords={keywords}
          onRefresh={handleRefresh}
          onViewResults={handleViewResults}
        />

        {/* Info Section */}
        {keywords.length === 0 && !loading && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Начните анализ ключевых слов
            </h3>
            <p className="text-blue-800 mb-4">
              Используйте DataForSEO API для получения данных о:
            </p>
            <ul className="list-disc list-inside text-blue-800 space-y-1 mb-4">
              <li>Объеме поиска и трендах</li>
              <li>Стоимости клика (CPC) и конкуренции</li>
              <li>Топ-10 позиций в поисковой выдаче</li>
              <li>Предложениях похожих ключевых слов</li>
            </ul>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить первые ключевые слова
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSubmitForm && (
        <KeywordSubmitForm
          onClose={() => setShowSubmitForm(false)}
          onSuccess={handleRefresh}
        />
      )}

      {selectedKeywordId && (
        <KeywordResultsModal
          keywordId={selectedKeywordId}
          onClose={handleCloseResults}
        />
      )}
    </div>
  );
}
