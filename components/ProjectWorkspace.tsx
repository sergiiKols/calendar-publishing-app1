/**
 * Компонент: ProjectWorkspace
 * Рабочая зона для работы с выбранным проектом
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, Sparkles, Filter } from 'lucide-react';
import QuickKeywordForm from './QuickKeywordForm';
import KeywordSubmitForm from './KeywordSubmitForm';
import SemanticClusterForm from './SemanticClusterForm';
import KeywordsTable from './KeywordsTable';
import KeywordResultsModal from './KeywordResultsModal';
import ClusterDetailsModal from './ClusterDetailsModal';
import SeoStatsCards from './SeoStatsCards';
import ClusterVisualization from './ClusterVisualization';
import FilteringPanel from './FilteringPanel';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Keyword {
  id: number;
  keyword: string;
  language: string;
  location_code: string;
  location_name: string;
  status: string;
  project_id: number;
  created_at: string;
}

interface Cluster {
  id: number;
  name: string;
  total_keywords: number;
  total_search_volume: number;
  cluster_count: number;
  status: string;
  project_id: number;
  created_at: string;
}

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

export default function ProjectWorkspace({ project, onBack }: ProjectWorkspaceProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showWizardForm, setShowWizardForm] = useState(false);
  const [showClusterForm, setShowClusterForm] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    language: ''
  });

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKeywords(),
        fetchClusters()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const response = await fetch(`/api/seo/keywords?project_id=${project.id}`);
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await fetch(`/api/seo/semantic-cluster?project_id=${project.id}`);
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Данные обновлены');
  };

  const handleDeleteKeyword = async (keywordId: number) => {
    try {
      const response = await fetch(`/api/seo/delete/${keywordId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Ключевое слово удалено');
        fetchKeywords();
      } else {
        toast.error('Ошибка при удалении');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const handleViewResults = (keywordId: number) => {
    setSelectedKeywordId(keywordId);
  };

  const handleCloseResults = () => {
    setSelectedKeywordId(null);
  };

  const handleClusterSuccess = () => {
    setShowClusterForm(false);
    fetchClusters();
    toast.success('Семантический кластер создан!');
  };

  // Фильтрация
  const filteredKeywords = keywords.filter((kw) => {
    if (filters.status && kw.status !== filters.status) return false;
    if (filters.location && kw.location_name !== filters.location) return false;
    if (filters.language && kw.language !== filters.language) return false;
    return true;
  });

  // Статистика
  const stats = {
    total: keywords.length,
    completed: keywords.filter(k => k.status === 'completed').length,
    processing: keywords.filter(k => k.status === 'processing').length,
    failed: keywords.filter(k => k.status === 'failed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных проекта...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад к списку проектов"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter size={18} />
              Фильтры
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowQuickForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Добавить слова
            </button>
            <button
              onClick={() => setShowWizardForm(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Wizard
            </button>
            <button
              onClick={() => setShowClusterForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Sparkles size={18} />
              Семядро
            </button>
          </div>
        </div>

        {/* Stats */}
        <SeoStatsCards
          total={stats.total}
          completed={stats.completed}
          processing={stats.processing}
          failed={stats.failed}
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <FilteringPanel
          filters={filters}
          onFiltersChange={setFilters}
          keywords={keywords}
        />
      )}

      {/* Keywords Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Ключевые слова ({filteredKeywords.length})
          </h2>
        </div>
        <KeywordsTable
          keywords={filteredKeywords}
          onDelete={handleDeleteKeyword}
          onViewResults={handleViewResults}
        />
      </div>

      {/* Clusters */}
      {clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Семантические кластеры ({clusters.length})
          </h2>
          <ClusterVisualization
            clusters={clusters}
            onViewDetails={(id) => setSelectedClusterId(id)}
            onExport={(id) => console.log('Export cluster:', id)}
            onDelete={(id) => console.log('Delete cluster:', id)}
          />
        </div>
      )}

      {/* Empty State */}
      {keywords.length === 0 && clusters.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Начните работу с проектом
          </h3>
          <p className="text-gray-600 mb-6">
            Добавьте ключевые слова или соберите семантическое ядро
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowQuickForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить ключевые слова
            </button>
            <button
              onClick={() => setShowClusterForm(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Собрать семядро
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showQuickForm && (
        <QuickKeywordForm
          onClose={() => setShowQuickForm(false)}
          onSuccess={handleRefresh}
          preselectedProjectId={project.id}
        />
      )}

      {showWizardForm && (
        <KeywordSubmitForm
          onClose={() => setShowWizardForm(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showClusterForm && (
        <SemanticClusterForm
          onClose={() => setShowClusterForm(false)}
          onSuccess={handleClusterSuccess}
        />
      )}

      {selectedKeywordId && (
        <KeywordResultsModal
          keywordId={selectedKeywordId}
          onClose={handleCloseResults}
        />
      )}

      {selectedClusterId && (
        <ClusterDetailsModal
          clusterId={selectedClusterId}
          onClose={() => setSelectedClusterId(null)}
        />
      )}
    </div>
  );
}
