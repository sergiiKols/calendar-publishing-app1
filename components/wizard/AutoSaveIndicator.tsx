/**
 * Компонент: AutoSaveIndicator
 * Индикатор автосохранения
 */

'use client';

import { Loader, Check } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
}

export default function AutoSaveIndicator({ lastSaved, isSaving }: AutoSaveIndicatorProps) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="animate-spin" size={14} />
        <span>Сохранение...</span>
      </div>
    );
  }

  if (lastSaved) {
    const secondsAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    
    let timeText = '';
    if (secondsAgo < 10) {
      timeText = 'только что';
    } else if (secondsAgo < 60) {
      timeText = `${secondsAgo} сек. назад`;
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60);
      timeText = `${minutesAgo} мин. назад`;
    }

    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check size={14} />
        <span>Сохранено {timeText}</span>
      </div>
    );
  }

  return null;
}
