/**
 * Компонент: SEO Wizard
 * Пошаговый мастер для сбора семантического ядра
 */

'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Loader, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import BudgetWidget from './BudgetWidget';
import { estimateClusterCost, formatCost } from '@/lib/dataforseo/cost-estimator';

type WizardStep = 'seeds' | 'expansion' | 'metrics' | 'filtering' | 'serp' | 'clustering';

interface WizardStepProps {
  currentStep: WizardStep;
  totalSteps: number;
  step: WizardStep;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
  onClick: () => void;
}

const WizardStepItem: React.FC<WizardStepProps> = ({
  currentStep,
  totalSteps,
  step,
  label,
  description,
  completed,
  active,
  onClick,
}) => {
  const progress = (totalSteps - 1) * 100;
  const stepProgress = (step === 'seeds' ? 0 : step === 'expansion' ? 20 : step === 'metrics' ? 40 : step === 'filtering' ? 60 : step === 'serp' ? 80 : 100);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        active ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <CheckCircle size={16} /> : <span className="font-semibold">{stepProgress / 20 + 1}</span>}
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold ${active ? 'text-blue-700' : completed ? 'text-green-700' : 'text-gray-700'}`}>
          {label}
        </h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

interface SEOWizardProps {
  children: React.ReactNode;
  currentStep: WizardStep;
  totalSteps?: number;
  onStepChange?: (step: WizardStep) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  canProceed?: boolean;
  isProcessing?: boolean;
  usage?: { todayCost: number; monthCost: number };
}

export default function SEOWizard({
  children,
  currentStep,
  totalSteps = 6,
  onStepChange,
  onBack,
  onNext,
  onSave,
  canProceed = true,
  isProcessing = false,
  usage = { todayCost: 0, monthCost: 0 },
}: SEOWizardProps) {
  const [showSaveToast, setShowSaveToast] = useState(false);

  const steps: { id: WizardStep; label: string; description: string }[] = [
    { id: 'seeds', label: 'Базовые слова', description: 'Введите 3-5 seed-ключей' },
    { id: 'expansion', label: 'Расширение', description: 'Поиск связанных ключей' },
    { id: 'metrics', label: 'Метрики', description: 'Получение SV, CPC, конкуренции' },
    { id: 'filtering', label: 'Фильтрация', description: 'Отбор ключей по параметрам' },
    { id: 'serp', label: 'SERP', description: 'Анализ выдачи (опционально)' },
    { id: 'clustering', label: 'Кластеризация', description: 'Группировка по семантике' },
  ];

  const completedSteps = steps.filter(s => s.id !== currentStep && s.id !== 'clustering').length;

  const handleSave = () => {
    onSave?.();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SEO Wizard</h1>
              <p className="text-sm text-gray-600">Сбор семантического ядра</p>
            </div>
            <BudgetWidget usage={{ todayCost: usage.todayCost, monthCost: usage.monthCost }} />
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Прогресс: Шаг {steps.findIndex(s => s.id === currentStep) + 1}/{totalSteps}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Steps */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Шаги процесса</h3>
            {steps.map((step) => (
              <WizardStepItem
                key={step.id}
                currentStep={currentStep}
                totalSteps={totalSteps}
                step={step.id}
                label={step.label}
                description={step.description}
                completed={steps.findIndex(s => s.id === currentStep) > steps.findIndex(s => s.id === step.id)}
                active={currentStep === step.id}
                onClick={() => onStepChange?.(step.id)}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {children}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={onBack}
                disabled={currentStep === 'seeds' || isProcessing}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Назад
              </button>

              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} />
                Сохранить
              </button>

              <button
                onClick={onNext}
                disabled={!canProceed || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Обработка...
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up">
          <CheckCircle size={20} />
          <span>Данные сохранены</span>
        </div>
      )}
    </div>
  );
}