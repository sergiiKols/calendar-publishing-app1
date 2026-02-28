/**
 * Компонент: RequestHistory
 * История предыдущих запросов
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { RequestHistory as RequestHistoryType, MAX_HISTORY_ITEMS } from './types';
import toast from 'react-hot-toast';

interface RequestHistoryProps {
  onLoadFromHistory: (item: RequestHistoryType) => void;
}

const STORAGE_KEY = 'seo_request_history';

export default function RequestHistory({ onLoadFromHistory }: RequestHistoryProps) {
  const [history, setHistory] = useState<RequestHistoryType[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const clearHistory = () => {
    if (confirm('Очистить всю историю запросов?')) {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      toast.success('История очищена');
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Clock size={16} />
          Последние запросы
        </h4>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
        >
          <Trash2 size={12} />
          Очистить
        </button>
      </div>

      <div className="space-y-2">
        {history.slice(0, MAX_HISTORY_ITEMS).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onLoadFromHistory(item)}
            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {item.projectName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {item.language} • {item.locationName} • {item.keywordsCount} слов
                </div>
                {item.keywordsPreview.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {item.keywordsPreview.join(', ')}
                    {item.keywordsCount > 3 && '...'}
                  </div>
                )}
              </div>
              <span className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-blue-600 text-white rounded text-xs transition-opacity ml-2 whitespace-nowrap">
                Использовать
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Функция для сохранения в историю (экспортируем для использования в форме)
export function saveToHistory(
  projectId: string,
  projectName: string,
  language: string,
  locationCode: string,
  locationName: string,
  keywords: string
) {
  try {
    const keywordsList = keywords.split('\n').filter(k => k.trim());
    
    const newItem: RequestHistoryType = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      projectId,
      projectName,
      language,
      locationCode,
      locationName,
      keywordsCount: keywordsList.length,
      keywordsPreview: keywordsList.slice(0, 3).map(k => k.trim())
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = [newItem, ...existing].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}
