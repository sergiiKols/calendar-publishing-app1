/**
 * Компонент: FilteringPanel
 * Панель фильтрации ключевых слов перед SERP
 */

'use client';

import { useState } from 'react';
import { Filter, Sliders, TrendingUp, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';

interface Keyword {
  id: number;
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  intent?: string;
}

interface FilteringPanelProps {
  keywords: Keyword[];
  onFilterChange?: (filters: FilteringFilters) => void;
  onApplyFilters?: () => void;
  onExport?: () => void;
  onRunSERP?: (selectedCount: number) => void;
}

export interface FilteringFilters {
  minSearchVolume: number;
  maxCompetition: number;
  minCPC: number;
  onlyCommercial: boolean;
  excludeBranded: boolean;
  onlyQuestions: boolean;
}

const DEFAULT_FILTERS: FilteringFilters = {
  minSearchVolume: 100,
  maxCompetition: 0.5,
  minCPC: 0,
  onlyCommercial: false,
  excludeBranded: false,
  onlyQuestions: false,
};

export default function FilteringPanel({
  keywords,
  onFilterChange,
  onApplyFilters,
  onExport,
  onRunSERP,
}: FilteringPanelProps) {
  const [filters, setFilters] = useState<FilteringFilters>(DEFAULT_FILTERS);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const filteredKeywords = keywords.filter((keyword) => {
    if (keyword.search_volume < filters.minSearchVolume) return false;
    if (keyword.competition > filters.maxCompetition) return false;
    if (keyword.cpc < filters.minCPC) return false;
    if (filters.onlyCommercial && keyword.cpc < 0.5) return false;
    if (filters.excludeBranded && isBranded(keyword.keyword)) return false;
    if (filters.onlyQuestions && !isQuestion(keyword.keyword)) return false;
    return true;
  });

  const isBranded = (keyword: string) => {
    const brandedTerms = ['бренд', 'brand', 'официальный', 'official', 'магазин', 'store'];
    return brandedTerms.some(term => keyword.toLowerCase().includes(term));
  };

  const isQuestion = (keyword: string) => {
    const questionWords = ['как', 'что', 'где', 'когда', 'почему', 'кто', 'сколько'];
    return questionWords.some(word => keyword.toLowerCase().startsWith(word));
  };

  const handleToggleKeyword = (id: number) => {
    setSelectedKeywords(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeywords(filteredKeywords.map(k => k.id));
  };

  const handleClearSelection = () => {
    setSelectedKeywords([]);
  };

  const handleFilterChange = (newFilters: Partial<FilteringFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleApply = () => {
    onApplyFilters?.();
  };

  const handleExport = () => {
    onExport?.();
  };

  const handleRunSERP = () => {
    onRunSERP?.(selectedKeywords.length);
  };

  const stats = {
    total: keywords.length,
    filtered: filteredKeywords.length,
    selected: selectedKeywords.length,
  };

  const estimatedSERPCost = (selectedKeywords.length * 0.0006).toFixed(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Фильтрация ключей</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Sliders size={18} />
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Всего ключей</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">После фильтрации</p>
          <p className="text-2xl font-bold text-green-900">{stats.filtered}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600">Выбрано для SERP</p>
          <p className="text-2xl font-bold text-purple-900">{stats.selected}</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Search Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Минимальный объем поиска: {filters.minSearchVolume}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="100"
              value={filters.minSearchVolume}
              onChange={(e) => handleFilterChange({ minSearchVolume: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>50k</span>
              <span>100k</span>
            </div>
          </div>

          {/* Competition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максимальная конкуренция: {filters.maxCompetition}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filters.maxCompetition}
              onChange={(e) => handleFilterChange({ maxCompetition: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (LOW)</span>
              <span>0.5</span>
              <span>1 (HIGH)</span>
            </div>
          </div>

          {/* CPC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Минимальный CPC: ${filters.minCPC.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.10"
              value={filters.minCPC}
              onChange={(e) => handleFilterChange({ minCPC: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$5</span>
              <span>$10</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.onlyCommercial}
                onChange={(e) => handleFilterChange({ onlyCommercial: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Только коммерческие</span>
                <p className="text-xs text-gray-500">CPC > $0.50</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.excludeBranded}
                onChange={(e) => handleFilterChange({ excludeBranded: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Исключить брендовые</span>
                <p className="text-xs text-gray-500">Бренды, магазины</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.onlyQuestions}
                onChange={(e) => handleFilterChange({ onlyQuestions: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Только вопросы</span>
                <p className="text-xs text-gray-500">Начинаются с вопросов</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            Выбрать все
          </button>
          <button
            onClick={handleClearSelection}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            Сбросить
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <CheckCircle size={16} />
            Экспорт CSV
          </button>
          <button
            onClick={handleRunSERP}
            disabled={selectedKeywords.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target size={16} />
            Запустить SERP ({selectedKeywords.length}, ${estimatedSERPCost})
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.length === filteredKeywords.length && filteredKeywords.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ключевое слово
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    SV
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    CPC
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Target size={14} />
                    Comp
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKeywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedKeywords.includes(keyword.id)}
                      onChange={() => handleToggleKeyword(keyword.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {keyword.keyword}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {keyword.search_volume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    ${keyword.cpc.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      keyword.competition < 0.3 ? 'bg-green-100 text-green-800' :
                      keyword.competition < 0.7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(keyword.competition * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
              {filteredKeywords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Нет ключей, соответствующих фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}