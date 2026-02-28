/**
 * Компонент: StepIndicator
 * Прогресс-бар для wizard формы
 */

'use client';

import { Check } from 'lucide-react';
import { WIZARD_STEPS, WizardStep } from './types';

interface StepIndicatorProps {
  currentStep: WizardStep;
  completedSteps: number[];
}

export default function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((label, index) => {
          const stepNumber = (index + 1) as WizardStep;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Кружок с номером/галочкой */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                    ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-110' : ''}
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${!isCurrent && !isCompleted ? 'bg-gray-300 text-gray-600' : ''}
                  `}
                >
                  {isCompleted ? <Check size={20} strokeWidth={3} /> : stepNumber}
                </div>
                
                {/* Подпись */}
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Линия к следующему шагу */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-colors ${
                    isPast ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Процент выполнения */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Шаг {currentStep} из {WIZARD_STEPS.length}
        </p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
