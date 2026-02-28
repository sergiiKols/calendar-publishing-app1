/**
 * Компонент: RestoreDraftDialog
 * Диалог для восстановления несохраненного черновика
 */

'use client';

import { Save } from 'lucide-react';
import { DraftData } from './types';

interface RestoreDraftDialogProps {
  draft: DraftData;
  onRestore: () => void;
  onDiscard: () => void;
}

export default function RestoreDraftDialog({
  draft,
  onRestore,
  onDiscard
}: RestoreDraftDialogProps) {
  const keywordsCount = draft.data.keywords
    ? draft.data.keywords.split('\n').filter(k => k.trim()).length
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Save className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Найден несохраненный черновик
            </h3>
            <p className="text-gray-600 mb-3">
              У вас есть незавершенная форма от{' '}
              {new Date(draft.timestamp).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              {draft.data.projectName && (
                <p>
                  Проект: <span className="font-medium">{draft.data.projectName}</span>
                </p>
              )}
              {draft.data.language && (
                <p>
                  Язык: <span className="font-medium">{draft.data.language}</span>
                </p>
              )}
              {keywordsCount > 0 && (
                <p>
                  Ключевых слов: <span className="font-medium">{keywordsCount}</span>
                </p>
              )}
              <p className="text-blue-600">
                Шаг: <span className="font-medium">{draft.step} из 4</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Начать заново
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Продолжить редактирование
          </button>
        </div>
      </div>
    </div>
  );
}
