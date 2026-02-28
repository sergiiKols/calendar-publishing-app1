/**
 * DataForSEO API Configuration
 * Конфигурация для работы с DataForSEO API
 */

// DataForSEO Location Codes
// Полный список: https://docs.dataforseo.com/v3/appendix/locations/
export const DATAFORSEO_LOCATIONS = {
  // Весь мир
  WORLDWIDE: {
    code: '2840', // По умолчанию используем USA как "мировой"
    name: 'Worldwide',
    language: 'en',
  },
  
  // Основные регионы
  RUSSIA: {
    code: '2643',
    name: 'Russia',
    language: 'ru',
  },
  USA: {
    code: '2840',
    name: 'United States',
    language: 'en',
  },
  CANADA: {
    code: '2124',
    name: 'Canada',
    language: 'en',
  },
  UK: {
    code: '2826',
    name: 'United Kingdom',
    language: 'en',
  },
  AUSTRALIA: {
    code: '2036',
    name: 'Australia',
    language: 'en',
  },
  SRI_LANKA: {
    code: '2144',
    name: 'Sri Lanka',
    language: 'en',
  },
} as const;

// Языки для поиска
export const DATAFORSEO_LANGUAGES = {
  en: 'English',
  ru: 'Russian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ar: 'Arabic',
} as const;

// Типы endpoints DataForSEO
export enum DataForSeoEndpointType {
  KEYWORDS_DATA = 'keywords_data',
  SERP_ANALYSIS = 'serp_analysis',
  KEYWORD_SUGGESTIONS = 'keyword_suggestions',
}

// API URLs
export const DATAFORSEO_API_BASE_URL = 'https://api.dataforseo.com/v3';

export const DATAFORSEO_ENDPOINTS = {
  // ===== LABS API (для семантического ядра) =====
  // Генерация идей из seed-ключей
  LABS_KEYWORDS_FOR_KEYWORDS: '/dataforseo_labs/google/keywords_for_keywords/live',
  
  // Ключи по домену конкурента
  LABS_KEYWORDS_FOR_SITE: '/dataforseo_labs/google/keywords_for_site/live',
  
  // Связанные ключевые слова
  LABS_RELATED_KEYWORDS: '/dataforseo_labs/google/related_keywords/live',
  
  // Категории для предварительной группировки
  LABS_KEYWORDS_FOR_CATEGORIES: '/dataforseo_labs/google/categories_for_domain/live',
  
  // ===== Keywords Data API (метрики) =====
  // Using Google Ads endpoints (these are available in pay-as-you-go plan)
  KEYWORDS_FOR_KEYWORDS: '/keywords_data/google_ads/search_volume/live',
  SEARCH_VOLUME: '/keywords_data/google_ads/search_volume/live',
  KEYWORD_SUGGESTIONS: '/keywords_data/google_ads/keywords_for_keywords/live',
  
  // ===== SERP API (анализ интента) =====
  SERP_ORGANIC: '/serp/google/organic/live',
  SERP_ORGANIC_ADVANCED: '/serp/google/organic/live/advanced',
  
  // ===== AI API (AI-powered анализ) =====
  AI_KEYWORD_DATA: '/ai_optimization/ai_keyword_data/keywords_search_volume/live',
} as const;

// Batch настройки
export const BATCH_CONFIG = {
  MIN_KEYWORDS: 1,
  MAX_KEYWORDS: 30, // максимум ключевых слов за один запрос
  DEFAULT_BATCH_SIZE: 10,
  
  // Labs API может возвращать больше
  LABS_MAX_RESULTS: 1000, // максимум результатов из Labs API
  LABS_DEFAULT_LIMIT: 100, // по умолчанию для семкластера
} as const;

// Настройки для сбора семантического ядра
export const SEMANTIC_CLUSTER_CONFIG = {
  // Seed -> Expansion
  MIN_SEED_KEYWORDS: 1,
  MAX_SEED_KEYWORDS: 5,
  TARGET_CLUSTER_SIZE: 100, // целевой размер кластера
  
  // Фильтры качества
  MIN_SEARCH_VOLUME: 10,
  MAX_KEYWORD_DIFFICULTY: 50,
  
  // Кластеризация
  CLUSTERING_SIMILARITY_THRESHOLD: 0.7, // cosine similarity для группировки
  MIN_CLUSTER_SIZE: 3, // минимум слов в кластере
  
  // Intent анализ
  SERP_TOP_RESULTS: 10, // анализируем топ-10
  PAA_MIN_QUESTIONS: 1, // минимум PAA вопросов для считания informational
} as const;

// Intent типы для кластеризации
export enum KeywordIntent {
  INFORMATIONAL = 'informational', // how to, what is, guide
  TRANSACTIONAL = 'transactional', // buy, price, order
  NAVIGATIONAL = 'navigational', // brand, login, official
  COMMERCIAL = 'commercial', // best, review, comparison
  LOCAL = 'local', // near me, in [city]
}

// Статусы задач
export enum SeoTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Статусы ключевых слов
export enum SeoKeywordStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial', // частично выполнено (не все endpoints)
}

// Интерфейсы для TypeScript
export interface DataForSeoCredentials {
  login: string;
  password: string;
}

export interface KeywordSubmission {
  keyword: string;
  language: string;
  location_code: string;
  location_name: string;
}

export interface DataForSeoRequestParams {
  keywords: string[];
  language_code: string;
  location_code: number;
  include_serp_info?: boolean;
  include_seed_keyword?: boolean;
  include_serp_only?: boolean;
}

// Helper функция для получения credentials из env
export function getDataForSeoCredentials(): DataForSeoCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env'
    );
  }

  return { login, password };
}

// Helper для получения базового URL
export function getDataForSeoBaseUrl(): string {
  return process.env.DATAFORSEO_API_URL || DATAFORSEO_API_BASE_URL;
}

// Список локаций для UI селектора
export function getLocationOptions() {
  return Object.entries(DATAFORSEO_LOCATIONS).map(([key, value]) => ({
    value: value.code,
    label: value.name,
    language: value.language,
  }));
}

// Список языков для UI селектора
export function getLanguageOptions() {
  return Object.entries(DATAFORSEO_LANGUAGES).map(([code, name]) => ({
    value: code,
    label: name,
  }));
}
