/**
 * Компонент: ClusterVisualization
 * Визуализация семантических кластеров
 */

'use client';

import { useState } from 'react';
import { Folder, ChevronDown, ChevronUp, Download, Trash2, Info } from 'lucide-react';

interface Cluster {
  id: number;
  name: string;
  keywords_count: number;
  total_search_volume: number;
  keywords: ClusterKeyword[];
}

interface ClusterKeyword {
  id: number;
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  intent?: string;
}

interface ClusterVisualizationProps {
  clusters: Cluster[];
  onExport?: (clusterId: number) => void;
  onDelete?: (clusterId: number) => void;
}

export default function ClusterVisualization({
  clusters,
  onExport,
  onDelete,
}: ClusterVisualizationProps) {
  const [expandedClusters, setExpandedClusters] = useState<number[]>([]);

  const toggleCluster = (clusterId: number) => {
    setExpandedClusters(prev =>
      prev.includes(clusterId)
        ? prev.filter(id => id !== clusterId)
        : [...prev, clusterId]
    );
  };

  const totalKeywords = clusters.reduce((sum, c) => sum + c.keywords_count, 0);
  const totalSV = clusters.reduce((sum, c) => sum + c.total_search_volume, 0);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder size={24} className="text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Семантические кластеры</h2>
            <p className="text-sm text-gray-600">
              {clusters.length} кластеров • {totalKeywords} ключей • SV: {formatNumber(totalSV)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedClusters(clusters.map(c => c.id))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Развернуть все
          </button>
          <button
            onClick={() => setExpandedClusters([])}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Свернуть все
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600">Кластеров</p>
          <p className="text-2xl font-bold text-purple-900">{clusters.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Ключей</p>
          <p className="text-2xl font-bold text-blue-900">{totalKeywords}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Общий объем поиска</p>
          <p className="text-2xl font-bold text-green-900">{formatNumber(totalSV)}</p>
        </div>
      </div>

      {/* Clusters List */}
      <div className="space-y-4">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Cluster Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCluster(cluster.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {expandedClusters.includes(cluster.id) ? (
                      <ChevronUp size={20} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cluster.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>{cluster.keywords_count} ключей</span>
                      <span>•</span>
                      <span>SV: {formatNumber(cluster.total_search_volume)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onExport?.(cluster.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Экспорт CSV"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => onDelete?.(cluster.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить кластер"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cluster Keywords */}
            {expandedClusters.includes(cluster.id) && (
              <div className="p-4">
                <div className="space-y-2">
                  {cluster.keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{keyword.keyword}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {keyword.intent && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {keyword.intent}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">SV</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatNumber(keyword.search_volume)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">CPC</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${keyword.cpc.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Comp</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(keyword.competition * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {clusters.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Info size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 text-lg">Нет кластеров</p>
            <p className="text-gray-400 text-sm mt-1">
              Выполните кластеризацию для группировки ключевых слов
            </p>
          </div>
        )}
      </div>
    </div>
  );
}