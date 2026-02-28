/**
 * Компонент: BudgetWidget
 * Виджет управления бюджетом и отображения статистики
 */

'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Info, X } from 'lucide-react';

interface BudgetLimits {
  maxCostPerRequest: number;
  maxDailyCost: number;
  maxMonthlyCost: number;
  maxKeywordsPerBatch: number;
  alertThreshold: number;
}

interface UsageStats {
  todayCost: number;
  monthCost: number;
  totalRequests: number;
}

interface BudgetWidgetProps {
  limits?: BudgetLimits;
  usage?: UsageStats;
  currentOperationCost?: number;
  onCostWarningConfirm?: () => void;
}

const DEFAULT_LIMITS: BudgetLimits = {
  maxCostPerRequest: 5.00,
  maxDailyCost: 20.00,
  maxMonthlyCost: 200.00,
  maxKeywordsPerBatch: 1000,
  alertThreshold: 80,
};

const DEFAULT_USAGE: UsageStats = {
  todayCost: 0,
  monthCost: 0,
  totalRequests: 0,
};

export default function BudgetWidget({
  limits = DEFAULT_LIMITS,
  usage = DEFAULT_USAGE,
  currentOperationCost = 0,
  onCostWarningConfirm,
}: BudgetWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCostWarning, setShowCostWarning] = useState(false);

  const dailyPercent = (usage.todayCost / limits.maxDailyCost) * 100;
  const monthlyPercent = (usage.monthCost / limits.maxMonthlyCost) * 100;

  const handleCostCheck = (cost: number) => {
    if (cost > limits.maxCostPerRequest) {
      setShowCostWarning(true);
      return false;
    }
    return true;
  };

  const handleConfirmCostWarning = () => {
    setShowCostWarning(false);
    if (onCostWarningConfirm) {
      onCostWarningConfirm();
    }
  };

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;

  return (
    <>
      {/* Main Widget */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={20} />
            <h3 className="font-semibold">Бюджет</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <Info size={18} />
          </button>
        </div>

        {/* Daily Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Сегодня: {formatCost(usage.todayCost)} / {formatCost(limits.maxDailyCost)}</span>
            <span className={dailyPercent >= 90 ? 'text-red-300' : dailyPercent >= 70 ? 'text-yellow-300' : 'text-blue-100'}>
              {dailyPercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                dailyPercent >= 90 ? 'bg-red-400' : dailyPercent >= 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(dailyPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Месяц: {formatCost(usage.monthCost)} / {formatCost(limits.maxMonthlyCost)}</span>
            <span className={monthlyPercent >= 90 ? 'text-red-300' : monthlyPercent >= 70 ? 'text-yellow-300' : 'text-blue-100'}>
              {monthlyPercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                monthlyPercent >= 90 ? 'bg-red-400' : monthlyPercent >= 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Current Operation Cost */}
        {currentOperationCost > 0 && (
          <div className="bg-blue-800/50 rounded-lg p-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-blue-100">Операция:</span>
              <span className="font-semibold">{formatCost(currentOperationCost)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cost Warning Dialog */}
      {showCostWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-yellow-600" size={32} />
                <h3 className="text-xl font-bold text-gray-900">Предупреждение о стоимости</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-1">Эта операция стоит:</p>
                  <p className="text-2xl font-bold text-yellow-700">{formatCost(currentOperationCost)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Дневной лимит</p>
                    <p className="font-semibold text-gray-900">{formatCost(limits.maxDailyCost - usage.todayCost)} осталось</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Месячный лимит</p>
                    <p className="font-semibold text-gray-900">{formatCost(limits.maxMonthlyCost - usage.monthCost)} осталось</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCostWarning(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmCostWarning}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Детали бюджета</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">История сегодня:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Расширение семантики</span>
                      <span className="font-mono">$0.03</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Метрики (236 ключей)</span>
                      <span className="font-mono">$0.012</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SERP (45 ключей)</span>
                      <span className="font-mono">$0.027</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Лимиты:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Макс. за операцию</span>
                      <span className="font-mono">${limits.maxCostPerRequest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дневной лимит</span>
                      <span className="font-mono">${limits.maxDailyCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Месячный лимит</span>
                      <span className="font-mono">${limits.maxMonthlyCost}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Баланс:</h4>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Доступно</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${Math.max(0, limits.maxMonthlyCost - usage.monthCost).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}