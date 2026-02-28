/**
 * DataForSEO API Client
 * Клиент для работы с DataForSEO API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  getDataForSeoCredentials,
  getDataForSeoBaseUrl,
  DATAFORSEO_ENDPOINTS,
  DataForSeoRequestParams,
} from './config';
import type {
  KeywordsDataResponse,
  SerpAnalysisResponse,
  KeywordSuggestionsResponse,
  DataForSeoApiError,
} from './types';

export class DataForSeoClient {
  private client: AxiosInstance;
  private login: string;
  private password: string;

  constructor() {
    const credentials = getDataForSeoCredentials();
    this.login = credentials.login;
    this.password = credentials.password;

    // Создаем axios клиент с базовыми настройками
    this.client = axios.create({
      baseURL: getDataForSeoBaseUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.login,
        password: this.password,
      },
      timeout: 60000, // 60 секунд таймаут
    });

    // Добавляем interceptor для логирования
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('DataForSEO API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Получение данных по ключевым словам (Keywords Data API)
   * Возвращает: search volume, CPC, competition, и т.д.
   */
  async getKeywordsData(params: {
    keywords: string[];
    language_code: string;
    location_code: number;
  }): Promise<KeywordsDataResponse> {
    try {
      // Google Ads API uses simpler format (just array of keywords)
      const requestBody = [
        {
          keywords: params.keywords,
          location_code: params.location_code,
          language_code: params.language_code,
          search_partners: false,
          sort_by: 'relevance',
        },
      ];

      console.log('[DataForSEO Client] Request:', {
        endpoint: DATAFORSEO_ENDPOINTS.KEYWORDS_FOR_KEYWORDS,
        body: JSON.stringify(requestBody, null, 2),
      });

      const response = await this.client.post<KeywordsDataResponse>(
        DATAFORSEO_ENDPOINTS.KEYWORDS_FOR_KEYWORDS,
        requestBody
      );

      console.log('[DataForSEO Client] Response:', {
        status_code: response.data.status_code,
        status_message: response.data.status_message,
        cost: response.data.cost,
        tasks_count: response.data.tasks_count,
        result_sample: response.data.tasks?.[0]?.result?.[0] || 'No result',
      });

      if (response.data.status_code !== 20000) {
        throw new Error(`DataForSEO API Error: ${response.data.status_message}`);
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getKeywordsData');
      throw error;
    }
  }

  /**
   * Анализ поисковой выдачи (SERP Analysis API)
   * Возвращает: топ позиции, конкуренты, featured snippets и т.д.
   */
  async getSerpAnalysis(params: {
    keyword: string;
    language_code: string;
    location_code: number;
    device?: 'desktop' | 'mobile';
    depth?: number;
  }): Promise<SerpAnalysisResponse> {
    try {
      const requestBody = [
        {
          keyword: params.keyword,
          language_code: params.language_code,
          location_code: params.location_code,
          device: params.device || 'desktop',
          os: params.device === 'mobile' ? 'android' : undefined,
          depth: params.depth || 100, // получаем топ-100 результатов
          calculate_rectangles: false,
        },
      ];

      const response = await this.client.post<SerpAnalysisResponse>(
        DATAFORSEO_ENDPOINTS.SERP_ORGANIC,
        requestBody
      );

      if (response.data.status_code !== 20000) {
        throw new Error(`DataForSEO API Error: ${response.data.status_message}`);
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getSerpAnalysis');
      throw error;
    }
  }

  /**
   * Получение предложений ключевых слов (Keyword Suggestions API)
   * Возвращает: связанные ключевые слова, их метрики
   */
  async getKeywordSuggestions(params: {
    keyword: string;
    language_code: string;
    location_code: number;
    limit?: number;
  }): Promise<KeywordSuggestionsResponse> {
    try {
      // Use same endpoint as getKeywordsData but request more results
      // This will return related keywords with their metrics
      const requestBody = [
        {
          keywords: [params.keyword],
          location_code: params.location_code,
          language_code: params.language_code,
          search_partners: false,
          sort_by: 'relevance',
          include_seed_keyword: true,
        },
      ];

      console.log('[DataForSEO Client] Keyword Suggestions Request:', {
        endpoint: DATAFORSEO_ENDPOINTS.KEYWORD_SUGGESTIONS,
        keyword: params.keyword,
        limit: params.limit || 50,
      });

      const response = await this.client.post<KeywordSuggestionsResponse>(
        DATAFORSEO_ENDPOINTS.KEYWORD_SUGGESTIONS,
        requestBody
      );

      console.log('[DataForSEO Client] Keyword Suggestions Response:', {
        status_code: response.data.status_code,
        status_message: response.data.status_message,
        cost: response.data.cost,
        result_count: response.data.tasks?.[0]?.result?.length || 0,
      });

      if (response.data.status_code !== 20000) {
        throw new Error(`DataForSEO API Error: ${response.data.status_message}`);
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getKeywordSuggestions');
      throw error;
    }
  }

  /**
   * Batch обработка множества ключевых слов
   * Отправляет все 3 типа запросов для каждого ключевого слова
   */
  async processKeywordsBatch(params: {
    keywords: string[];
    language_code: string;
    location_code: number;
  }): Promise<{
    keywordsData: KeywordsDataResponse;
    serpAnalysis: SerpAnalysisResponse[];
    suggestions: KeywordSuggestionsResponse[];
  }> {
    try {
      // 1. Получаем общие данные по всем ключевым словам сразу
      const keywordsData = await this.getKeywordsData({
        keywords: params.keywords,
        language_code: params.language_code,
        location_code: params.location_code,
      });

      // 2. Для каждого ключевого слова получаем SERP и suggestions
      // Делаем это параллельно для ускорения
      const serpPromises = params.keywords.map((keyword) =>
        this.getSerpAnalysis({
          keyword,
          language_code: params.language_code,
          location_code: params.location_code,
        })
      );

      const suggestionsPromises = params.keywords.map((keyword) =>
        this.getKeywordSuggestions({
          keyword,
          language_code: params.language_code,
          location_code: params.location_code,
        })
      );

      const [serpAnalysis, suggestions] = await Promise.all([
        Promise.all(serpPromises),
        Promise.all(suggestionsPromises),
      ]);

      return {
        keywordsData,
        serpAnalysis,
        suggestions,
      };
    } catch (error) {
      this.handleError(error, 'processKeywordsBatch');
      throw error;
    }
  }

  /**
   * Проверка доступности API и валидности credentials
   */
  async testConnection(): Promise<boolean> {
    try {
      // Простой тестовый запрос с одним ключевым словом
      const response = await this.getKeywordsData({
        keywords: ['test'],
        language_code: 'en',
        location_code: 2840, // USA
      });

      return response.status_code === 20000;
    } catch (error) {
      console.error('DataForSEO connection test failed:', error);
      return false;
    }
  }

  // ===================================
  // Utility Methods
  // ===================================

  /**
   * Получить дату N месяцев назад в формате YYYY-MM-DD
   */
  private getDateMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  /**
   * Получить текущую дату в формате YYYY-MM-DD
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Обработка ошибок API
   */
  private handleError(error: any, method: string): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const message = error.response?.data?.status_message || error.message;
      
      console.error(`DataForSEO ${method} failed:`, {
        status,
        message,
        data: error.response?.data,
      });

      // Специфичные ошибки
      if (status === 401) {
        console.error('Authentication failed. Check DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD');
      } else if (status === 402) {
        console.error('Insufficient funds in DataForSEO account');
      } else if (status === 429) {
        console.error('Rate limit exceeded');
      }
    } else {
      console.error(`DataForSEO ${method} unexpected error:`, error);
    }
  }
}

// Singleton instance
let clientInstance: DataForSeoClient | null = null;

/**
 * Получить singleton instance клиента DataForSEO
 */
export function getDataForSeoClient(): DataForSeoClient {
  if (!clientInstance) {
    clientInstance = new DataForSeoClient();
  }
  return clientInstance;
}

/**
 * Сбросить singleton instance (для тестов)
 */
export function resetDataForSeoClient(): void {
  clientInstance = null;
}
