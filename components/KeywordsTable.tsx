/**
 * Компонент: KeywordsTable
 * Таблица с ключевыми словами и их статусами
 */

'use client';

import { useState } from 'react';
import { Eye, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface KeywordsTableProps {
  keywords: Keyword[];
  onRefresh: () => void;
  onViewResults: (keywordId: number) => void;
}

export default function KeywordsTable({ keywords, onRefresh, onViewResults }: KeywordsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (keywordId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это ключевое слово и все связанные данные?')) {
      return;
    }

    setDeletingId(keywordId);

    try {
      const response = await fetch(`/api/seo/delete/${keywordId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Ключевое слово удалено');
        onRefresh();
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

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ключевое слово
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Регион / Язык
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Проект
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Прогресс
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата создания
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keywords.map((keyword) => (
            <tr key={keyword.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {keyword.keyword}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{keyword.location_name}</div>
                <div className="text-xs text-gray-500 uppercase">{keyword.language}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {keyword.project_name || (
                    <span className="text-gray-400 italic">Нет проекта</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(keyword.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(keyword.completed_tasks / keyword.tasks_count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {keyword.completed_tasks}/{keyword.tasks_count}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(keyword.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onViewResults(keyword.id)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Просмотреть результаты"
                    disabled={keyword.status === 'pending'}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(keyword.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Удалить"
                    disabled={deletingId === keyword.id}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
