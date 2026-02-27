/**
 * Компонент: KeywordResultsModal
 * Модальное окно с результатами анализа ключевого слова
 */

'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Target, Search, ExternalLink } from 'lucide-react';

interface KeywordResultsModalProps {
  keywordId: number;
  onClose: () => void;
}

interface KeywordResults {
  keyword: any;
  results: {
    keywords_data?: any;
    serp_analysis?: any;
    keyword_suggestions?: any;
  };
}

export default function KeywordResultsModal({ keywordId, onClose }: KeywordResultsModalProps) {
  const [results, setResults] = useState<KeywordResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'serp' | 'suggestions'>('overview');

  useEffect(() => {
    fetchResults();
  }, [keywordId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seo/results/${keywordId}`);
      const data = await response.json();
      if (data.success) {
        setResults(data);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const { keyword, results: data } = results;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{keyword.keyword}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {keyword.location_name} • {keyword.language.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('serp')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'serp'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SERP Анализ
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Предложения
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab data={data.keywords_data} />
          )}
          {activeTab === 'serp' && (
            <SerpTab data={data.serp_analysis} />
          )}
          {activeTab === 'suggestions' && (
            <SuggestionsTab data={data.keyword_suggestions} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data?: any }) {
  if (!data) {
    return <div className="text-center text-gray-500 py-8">Нет данных</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp className="text-blue-600" size={24} />}
          label="Объем поиска"
          value={data.search_volume?.toLocaleString() || '0'}
          subtext="запросов/месяц"
        />
        <MetricCard
          icon={<DollarSign className="text-green-600" size={24} />}
          label="CPC"
          value={`$${data.cpc?.toFixed(2) || '0.00'}`}
          subtext="cost per click"
        />
        <MetricCard
          icon={<Target className="text-orange-600" size={24} />}
          label="Конкуренция"
          value={data.competition_level || 'N/A'}
          subtext={`${(data.competition * 100)?.toFixed(0) || 0}%`}
        />
      </div>

      {/* Bid Range */}
      {data.low_top_of_page_bid && data.high_top_of_page_bid && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Диапазон ставок (Top of Page)</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Минимум</p>
              <p className="text-2xl font-bold text-gray-900">${data.low_top_of_page_bid.toFixed(2)}</p>
            </div>
            <div className="flex-1 mx-8">
              <div className="h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Максимум</p>
              <p className="text-2xl font-bold text-gray-900">${data.high_top_of_page_bid.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {data.monthly_searches && data.monthly_searches.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-4">Тренд поиска (последние 12 месяцев)</h4>
          <div className="grid grid-cols-6 gap-2">
            {data.monthly_searches.slice(-12).map((month: any, idx: number) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {month.month}/{month.year % 100}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {month.search_volume?.toLocaleString() || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// SERP Tab Component
function SerpTab({ data }: { data?: any }) {
  if (!data || !data.top_positions || data.top_positions.length === 0) {
    return <div className="text-center text-gray-500 py-8">Нет данных SERP</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Всего результатов:</strong> {data.total_results?.toLocaleString() || 0}
        </p>
      </div>

      {data.top_positions.map((item: any, idx: number) => (
        <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {item.position}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-blue-600 hover:underline mb-1">
                {item.title}
              </h4>
              <p className="text-sm text-green-700 mb-2 flex items-center gap-1">
                {item.domain}
                <ExternalLink size={12} />
              </p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-blue-600 break-all"
                >
                  {item.url}
                </a>
              )}
              {item.description && (
                <p className="text-sm text-gray-700 mt-2">{item.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Suggestions Tab Component
function SuggestionsTab({ data }: { data?: any }) {
  if (!data || !data.suggestions || data.suggestions.length === 0) {
    return <div className="text-center text-gray-500 py-8">Нет предложений</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Ключевое слово
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Объем поиска
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              CPC
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Конкуренция
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.suggestions.map((suggestion: any, idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {suggestion.keyword}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {suggestion.search_volume?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                ${suggestion.cpc?.toFixed(2) || '0.00'}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  suggestion.competition_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                  suggestion.competition_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {suggestion.competition_level || 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, label, value, subtext }: any) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  );
}
