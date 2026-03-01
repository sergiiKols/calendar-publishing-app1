/**
 * Компонент: KeywordsTable
 * Таблица с ключевыми словами и их статусами
 */

'use client';

import { useState } from 'react';
import { Eye, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Loader, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface Keyword {
  id: number;
  keyword: string;
  language: string;
  location_name: string;
  status: string;
  project_name?: string;
  source_keyword_id?: number;
  source_keyword_name?: string;
  search_volume?: number | string;
  cpc?: number | string;
  competition?: number | string;
  search_intent?: string;
  tasks_count: number;
  completed_tasks: number;
  created_at: string;
}

interface KeywordsTableProps {
  keywords: Keyword[];
  onDelete?: (keywordId: number) => void;
  onRefresh?: () => void;
}

export default function KeywordsTable({ keywords, onDelete, onRefresh }: KeywordsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (keywordId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это ключевое слово и все связанные данные?')) {
      return;
    }

    setDeletingId(keywordId);

    try {
      // Если передан внешний обработчик, используем его
      if (onDelete) {
        await onDelete(keywordId);
        setDeletingId(null);
        return;
      }

      // Иначе выполняем удаление напрямую
      const response = await fetch(`/api/seo/delete/${keywordId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Ключевое слово удалено');
        // Обновляем список после удаления
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(data.error || 'Ошибка при удалении');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const icons = {
      completed: <CheckCircle size={14} />,
      processing: <Loader size={14} className="animate-spin" />,
      pending: <Clock size={14} />,
      failed: <AlertCircle size={14} />,
      partial: <RefreshCw size={14} />,
    };

    const labels = {
      completed: 'Завершено',
      processing: 'Обработка',
      pending: 'Ожидание',
      failed: 'Ошибка',
      partial: 'Частично',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons] || icons.pending}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg mb-2">Нет ключевых слов</p>
        <p className="text-gray-400 text-sm">
          Нажмите "Добавить ключевые слова" чтобы начать анализ
        </p>
      </div>
    );
  }

  const formatNumber = (num?: number | string) => {
    if (num === null || num === undefined) return '—';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '—';
    return new Intl.NumberFormat('ru-RU').format(numValue);
  };

  const formatCurrency = (amount?: number | string) => {
    if (amount === null || amount === undefined) return '—';
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numValue)) return '—';
    return `$${numValue.toFixed(2)}`;
  };

  const formatPercent = (value?: number | string) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return `${Math.round(numValue * 100)}%`;
  };

  const getIntentBadge = (intent?: string) => {
    if (!intent) return null;
    
    const styles: Record<string, string> = {
      'Informational': 'bg-blue-100 text-blue-800',
      'Commercial': 'bg-purple-100 text-purple-800',
      'Transactional': 'bg-green-100 text-green-800',
      'Navigational': 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[intent] || 'bg-gray-100 text-gray-800'}`}>
        {intent}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ключевое слово
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Частота
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Интент
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CPC
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Конкуренция
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keywords.map((keyword) => {
            const isSource = !keyword.source_keyword_id; // Если нет source_keyword_id - это источник
            
            return (
              <tr 
                key={keyword.id} 
                className={`transition-colors ${
                  isSource 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {isSource && (
                      <Target size={16} className="text-blue-600 flex-shrink-0" title="Ключевое слово-источник" />
                    )}
                    <div>
                      <div className={`text-sm ${isSource ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {keyword.keyword}
                      </div>
                      {keyword.source_keyword_name && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          от: {keyword.source_keyword_name}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatNumber(keyword.search_volume)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getIntentBadge(keyword.search_intent)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(keyword.cpc)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      {(() => {
                        const compValue = typeof keyword.competition === 'string' 
                          ? parseFloat(keyword.competition) 
                          : (keyword.competition || 0);
                        return (
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${compValue * 100}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                    <span className="text-xs text-gray-600">
                      {formatPercent(keyword.competition)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(keyword.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Удалить"
                    disabled={deletingId === keyword.id}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
