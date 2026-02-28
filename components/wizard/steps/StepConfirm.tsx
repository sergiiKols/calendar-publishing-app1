/**
 * Компонент: StepConfirm
 * Шаг 4: Подтверждение и запуск
 */

'use client';

import { Check, Folder, Globe, MapPin, FileText, DollarSign } from 'lucide-react';
import { WizardFormData } from '../types';

interface StepConfirmProps {
  formData: WizardFormData;
  projectName: string;
  languageName: string;
  locationName: string;
  onEdit: (step: number) => void;
}

export default function StepConfirm({
  formData,
  projectName,
  languageName,
  locationName,
  onEdit
}: StepConfirmProps) {
  const keywordsList = formData.keywords
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  const keywordsCount = keywordsList.length;
  const estimatedCost = (keywordsCount * 0.02).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Подтверждение запуска
        </h3>
        <p className="text-sm text-gray-600">
          Проверьте параметры перед запуском анализа
        </p>
      </div>

      {/* Сводная таблица */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 space-y-4">
        {/* Проект */}
        <div className="flex items-start justify-between pb-4 border-b border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Folder size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Проект</p>
              <p className="font-semibold text-gray-900">{projectName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Изменить
          </button>
        </div>

        {/* Язык */}
        <div className="flex items-start justify-between pb-4 border-b border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Язык поиска</p>
              <p className="font-semibold text-gray-900">{languageName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Изменить
          </button>
        </div>

        {/* Локация */}
        <div className="flex items-start justify-between pb-4 border-b border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Локация</p>
              <p className="font-semibold text-gray-900">{locationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Изменить
          </button>
        </div>

        {/* Ключевые слова */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ключевые слова</p>
              <p className="font-semibold text-gray-900">{keywordsCount} слов</p>
              {keywordsCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Первые: {keywordsList.slice(0, 3).join(', ')}
                  {keywordsCount > 3 && '...'}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Изменить
          </button>
        </div>
      </div>

      {/* Стоимость */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Примерная стоимость</p>
            <p className="text-2xl font-bold text-gray-900">${estimatedCost}</p>
            <p className="text-xs text-gray-600 mt-1">
              ~$0.02 за ключевое слово × {keywordsCount} слов
            </p>
          </div>
        </div>
      </div>

      {/* Что будет проанализировано */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Check size={18} className="text-green-600" />
          Что будет проанализировано:
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Объем поиска</strong> - количество запросов в месяц</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>CPC (Cost Per Click)</strong> - стоимость клика в рекламе</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Конкуренция</strong> - уровень сложности продвижения</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Топ-10 результатов</strong> - сайты в выдаче</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Похожие запросы</strong> - идеи для расширения</span>
          </li>
        </ul>
      </div>

      {/* Важная информация */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          ⏱️ <strong>Время обработки:</strong> Анализ займет примерно {Math.ceil(keywordsCount / 10)} минут.
          Вы сможете отслеживать прогресс в таблице ключевых слов.
        </p>
      </div>
    </div>
  );
}
