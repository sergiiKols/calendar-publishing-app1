/**
 * Типы для Wizard формы SEO
 */

export interface WizardFormData {
  projectId: string;
  projectName: string;
  language: string;
  location: string; // location code (например "2643")
  locationName: string; // location name (например "Russia")
  keywords: string;
}

export interface RequestHistory {
  id: string;
  timestamp: number;
  projectId: string;
  projectName: string;
  language: string;
  locationCode: string;
  locationName: string;
  keywordsCount: number;
  keywordsPreview: string[];
}

export interface DraftData {
  data: WizardFormData;
  timestamp: number;
  step: number;
}

export interface StepValidation {
  isValid: boolean;
  message?: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEPS = [
  'Проект',
  'Настройки',
  'Ключевые слова',
  'Подтверждение'
] as const;

export const MAX_HISTORY_ITEMS = 5;
export const AUTOSAVE_DELAY = 3000; // 3 секунды
export const DRAFT_EXPIRY_HOURS = 24;
