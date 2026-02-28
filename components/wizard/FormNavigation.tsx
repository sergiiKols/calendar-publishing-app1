/**
 * Компонент: FormNavigation
 * Кнопки навигации для wizard формы (Назад/Далее/Отмена/Запустить)
 */

'use client';

import { Loader } from 'lucide-react';
import { WizardStep } from './types';

interface FormNavigationProps {
  currentStep: WizardStep;
  canGoNext: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  validationMessage?: string;
}

export default function FormNavigation({
  currentStep,
  canGoNext,
  isSubmitting,
  onBack,
  onNext,
  onCancel,
  onSubmit,
  validationMessage
}: FormNavigationProps) {
  const isLastStep = currentStep === 4;
  const isFirstStep = currentStep === 1;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      {/* Левая часть - кнопка Назад */}
      <div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
        )}
      </div>

      {/* Правая часть - кнопки Отмена и Далее/Запустить */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canGoNext}
            className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin" size={18} />
                Запуск анализа...
              </>
            ) : (
              <>
                🚀 Запустить анализ
              </>
            )}
          </button>
        ) : (
          <div className="relative group">
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее →
            </button>
            {!canGoNext && validationMessage && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {validationMessage}
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
