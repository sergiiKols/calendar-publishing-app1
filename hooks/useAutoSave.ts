/**
 * Hook: useAutoSave
 * Автоматическое сохранение данных формы
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { WizardFormData, AUTOSAVE_DELAY } from '@/components/wizard/types';

const DRAFT_STORAGE_KEY = 'seo_form_draft';

interface AutoSaveHookReturn {
  lastSaved: Date | null;
  isSaving: boolean;
  clearDraft: () => void;
}

export function useAutoSave(
  data: WizardFormData,
  currentStep: number,
  enabled: boolean = true
): AutoSaveHookReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    // Очищаем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    // Устанавливаем новый таймер
    timeoutRef.current = setTimeout(() => {
      try {
        const draft = {
          data,
          timestamp: Date.now(),
          step: currentStep
        };
        
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, currentStep, enabled]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  return { lastSaved, isSaving, clearDraft };
}

// Функция для загрузки черновика
export function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return null;

    const draft = JSON.parse(saved);
    const hoursSinceSave = (Date.now() - draft.timestamp) / (1000 * 60 * 60);

    // Если черновик старше 24 часов, удаляем его
    if (hoursSinceSave > 24) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}
