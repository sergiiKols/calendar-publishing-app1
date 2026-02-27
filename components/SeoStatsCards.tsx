/**
 * Компонент: SeoStatsCards
 * Карточки со статистикой по ключевым словам
 */

'use client';

import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SeoStatsCardsProps {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

export default function SeoStatsCards({ total, completed, processing, failed }: SeoStatsCardsProps) {
  const pending = total - completed - processing - failed;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<TrendingUp className="text-blue-600" size={24} />}
        label="Всего ключевых слов"
        value={total}
        bgColor="bg-blue-50"
        textColor="text-blue-600"
      />
      <StatCard
        icon={<CheckCircle className="text-green-600" size={24} />}
        label="Завершено"
        value={completed}
        bgColor="bg-green-50"
        textColor="text-green-600"
      />
      <StatCard
        icon={<Clock className="text-yellow-600" size={24} />}
        label="В обработке"
        value={processing + pending}
        bgColor="bg-yellow-50"
        textColor="text-yellow-600"
      />
      <StatCard
        icon={<AlertCircle className="text-red-600" size={24} />}
        label="Ошибки"
        value={failed}
        bgColor="bg-red-50"
        textColor="text-red-600"
      />
    </div>
  );
}

function StatCard({ icon, label, value, bgColor, textColor }: any) {
  return (
    <div className={`${bgColor} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}
