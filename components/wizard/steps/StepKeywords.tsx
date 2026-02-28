/**
 * Компонент: StepKeywords
 * Шаг 3: Ввод ключевых слов
 */

'use client';

import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface StepKeywordsProps {
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
}

export default function StepKeywords({ keywords, onKeywordsChange }: StepKeywordsProps) {
  const [keywordCount, setKeywordCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    const lines = keywords
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    setKeywordCount(lines.length);
    
    // Примерная оценка стоимости: ~$0.02 за ключевое слово
    setEstimatedCost(lines.length * 0.02);
  }, [keywords]);

  const isValid = keywordCount > 0 && keywordCount <= 100;
  const showWarning = keywordCount > 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ключевые слова
        </h3>
        <p className="text-sm text-gray-600">
          Введите ключевые слова для анализа (по одному на строку)
        </p>
      </div>

      {/* Textarea для ввода */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FileText size={16} />
          Список ключевых слов
        </label>
        <textarea
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          placeholder="купить смартфон&#10;смартфон цена&#10;лучшие смартфоны 2024&#10;..."
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
        />
        
        {/* Счетчик */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${
              keywordCount === 0 ? 'text-gray-500' :
              isValid ? 'text-green-600' :
              'text-red-600'
            }`}>
              Ключевых слов: {keywordCount}
            </span>
            {keywordCount > 0 && (
              <span className="text-sm text-gray-600">
                Примерная стоимость: <strong>${estimatedCost.toFixed(2)}</strong>
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            Макс: 100 слов
          </span>
        </div>
      </div>

      {/* Предупреждение */}
      {showWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Превышен лимит</h4>
            <p className="text-sm text-red-800">
              Максимум 100 ключевых слов за один запрос. Удалите {keywordCount - 100} слов(а).
            </p>
          </div>
        </div>
      )}

      {/* Прогресс-бар */}
      {keywordCount > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Заполнено</span>
            <span>{keywordCount}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                keywordCount <= 100 ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min((keywordCount / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Подсказки */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-blue-900 text-sm">💡 Советы:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Каждое ключевое слово на новой строке</li>
          <li>Используйте релевантные запросы для вашей ниши</li>
          <li>Включайте как короткие, так и длинные запросы</li>
          <li>Для большого количества слов разделите на несколько запросов</li>
        </ul>
      </div>

      {/* Примеры */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Примеры ключевых слов:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-1">Короткие запросы:</p>
            <ul className="space-y-0.5 text-xs">
              <li>• купить телефон</li>
              <li>• смартфон цена</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Длинные запросы:</p>
            <ul className="space-y-0.5 text-xs">
              <li>• где купить смартфон в москве</li>
              <li>• лучший смартфон до 30000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
