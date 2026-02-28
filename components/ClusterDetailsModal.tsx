/**
 * Компонент: ClusterDetailsModal
 * Детальный просмотр результатов семантического кластера
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Download, TrendingUp, DollarSign, Target, Layers, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClusterDetailsModalProps {
  clusterId: number;
  onClose: () => void;
}

interface ClusterData {
  cluster: {
    id: number;
    name: string;
    total_keywords: number;
    total_search_volume: number;
    cluster_count: number;
    status: string;
    language: string;
    location_name: string;
    seeds: string[];
  };
  groups: {
    id: number;
    cluster_name: string;
    dominant_intent: string;
    total_search_volume: number;
    avg_keyword_difficulty: number;
    keywords_count: number;
    keywords: {
      keyword: string;
      search_volume: number;
      cpc: number;
      competition: number;
      keyword_difficulty: number;
      intent: string;
      source: string;
    }[];
  }[];
}

export default function ClusterDetailsModal({ clusterId, onClose }: ClusterDetailsModalProps) {
  const [data, setData] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [filterIntent, setFilterIntent] = useState<string>('');

  useEffect(() => {
    fetchClusterDetails();
  }, [clusterId]);

  const fetchClusterDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seo/semantic-cluster/${clusterId}`);
      const result = await response.json();
      
      if (result.success && result.cluster) {
        setData(result.cluster);
        if (result.cluster.groups && result.cluster.groups.length > 0) {
          setActiveGroupId(result.cluster.groups[0].id);
        }
      } else {
        toast.error('Ошибка загрузки данных кластера');
      }
    } catch (error) {
      console.error('Failed to fetch cluster details:', error);
      toast.error('Ошибка при загрузке');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/seo/semantic-cluster/${clusterId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cluster_${clusterId}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV экспортирован');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Ошибка экспорта');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных кластера...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { cluster, groups } = data;
  const activeGroup = groups.find(g => g.id === activeGroupId);
  
  // Фильтрация ключевых слов по интенту
  const filteredKeywords = activeGroup?.keywords.filter(kw => 
    !filterIntent || kw.intent === filterIntent
  ) || [];

  const intentCounts = activeGroup?.keywords.reduce((acc, kw) => {
    acc[kw.intent] = (acc[kw.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{cluster.name}</h2>
            <p className="text-purple-100 text-sm mt-1">
              {cluster.location_name} • {cluster.language.toUpperCase()} • {cluster.total_keywords} ключевых слов
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Экспорт CSV
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="text-purple-600" size={20} />
              <span className="text-sm text-gray-600">Кластеров</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{cluster.cluster_count}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Search className="text-blue-600" size={20} />
              <span className="text-sm text-gray-600">Всего слов</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{cluster.total_keywords}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-sm text-gray-600">Общий SV</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {cluster.total_search_volume.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-orange-600" size={20} />
              <span className="text-sm text-gray-600">Seed слов</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{cluster.seeds.length}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Groups List */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-gray-900">Группы кластеров</h3>
              <p className="text-xs text-gray-500 mt-1">{groups.length} групп найдено</p>
            </div>
            <div className="p-2 space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    activeGroupId === group.id
                      ? 'bg-purple-100 border-2 border-purple-600'
                      : 'bg-white border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm mb-1 truncate">
                    {group.cluster_name}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{group.keywords_count} слов</span>
                    <span className="font-semibold">{group.total_search_volume.toLocaleString()} SV</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      group.dominant_intent === 'informational' ? 'bg-blue-100 text-blue-800' :
                      group.dominant_intent === 'transactional' ? 'bg-green-100 text-green-800' :
                      group.dominant_intent === 'commercial' ? 'bg-yellow-100 text-yellow-800' :
                      group.dominant_intent === 'navigational' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {group.dominant_intent || 'unknown'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Panel - Keywords Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeGroup && (
              <>
                {/* Group Header */}
                <div className="p-6 border-b bg-white">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{activeGroup.cluster_name}</h3>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Search size={16} />
                      <span>{activeGroup.keywords_count} ключевых слов</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} />
                      <span>{activeGroup.total_search_volume.toLocaleString()} SV</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={16} />
                      <span>KD: {activeGroup.avg_keyword_difficulty}</span>
                    </div>
                  </div>

                  {/* Intent Filter */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Фильтр по интенту:</span>
                    <button
                      onClick={() => setFilterIntent('')}
                      className={`px-3 py-1 rounded text-xs ${
                        !filterIntent ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Все ({activeGroup.keywords_count})
                    </button>
                    {Object.entries(intentCounts).map(([intent, count]) => (
                      <button
                        key={intent}
                        onClick={() => setFilterIntent(intent)}
                        className={`px-3 py-1 rounded text-xs ${
                          filterIntent === intent 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {intent} ({count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ключевое слово
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SV
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CPC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Конкур.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          KD
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Интент
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Источник
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredKeywords.map((kw, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {kw.keyword}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {kw.search_volume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            ${kw.cpc.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ width: `${(kw.competition * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              kw.keyword_difficulty >= 70 ? 'bg-red-100 text-red-800' :
                              kw.keyword_difficulty >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {kw.keyword_difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              kw.intent === 'informational' ? 'bg-blue-100 text-blue-800' :
                              kw.intent === 'transactional' ? 'bg-green-100 text-green-800' :
                              kw.intent === 'commercial' ? 'bg-yellow-100 text-yellow-800' :
                              kw.intent === 'navigational' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {kw.intent}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {kw.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
