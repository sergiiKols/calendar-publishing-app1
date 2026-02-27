/**
 * DataForSEO Labs API Client
 * Клиент для сбора семантического ядра (семкластера)
 */

import axios from 'axios';
import {
  getDataForSeoCredentials,
  getDataForSeoBaseUrl,
  DATAFORSEO_ENDPOINTS,
  SEMANTIC_CLUSTER_CONFIG,
  BATCH_CONFIG,
  KeywordIntent,
} from './config';

/**
 * Labs API: Keywords for Keywords
 * Генерация идей ключевых слов из seed-слов
 */
export async function getLabsKeywordsForKeywords(params: {
  seeds: string[]; // 1-5 seed ключевых слов
  language_code: string;
  location_code: number;
  limit?: number;
  filters?: {
    keyword_difficulty_min?: number;
    keyword_difficulty_max?: number;
    search_volume_min?: number;
    search_volume_max?: number;
  };
}): Promise<any> {
  const credentials = getDataForSeoCredentials();
  const baseUrl = getDataForSeoBaseUrl();

  const requestBody = [
    {
      keywords: params.seeds,
      language_code: params.language_code,
      location_code: params.location_code,
      limit: params.limit || BATCH_CONFIG.LABS_DEFAULT_LIMIT,
      include_serp_info: true,
      include_seed_keyword: true,
      filters: params.filters ? [
        params.filters.keyword_difficulty_min ? ['keyword_info.keyword_difficulty', '>=', params.filters.keyword_difficulty_min] : null,
        params.filters.keyword_difficulty_max ? ['keyword_info.keyword_difficulty', '<=', params.filters.keyword_difficulty_max] : null,
        params.filters.search_volume_min ? ['keyword_info.search_volume', '>=', params.filters.search_volume_min] : null,
        params.filters.search_volume_max ? ['keyword_info.search_volume', '<=', params.filters.search_volume_max] : null,
      ].filter(Boolean) : undefined,
      order_by: ['keyword_info.search_volume,desc'], // сортировка по объему
    },
  ];

  try {
    const response = await axios.post(
      `${baseUrl}${DATAFORSEO_ENDPOINTS.LABS_KEYWORDS_FOR_KEYWORDS}`,
      requestBody,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`Labs API Error: ${response.data.status_message}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Labs Keywords for Keywords error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Labs API: Related Keywords
 * Получение связанных ключевых слов
 */
export async function getLabsRelatedKeywords(params: {
  keyword: string;
  language_code: string;
  location_code: number;
  limit?: number;
}): Promise<any> {
  const credentials = getDataForSeoCredentials();
  const baseUrl = getDataForSeoBaseUrl();

  const requestBody = [
    {
      keyword: params.keyword,
      language_code: params.language_code,
      location_code: params.location_code,
      limit: params.limit || 50,
      include_serp_info: true,
    },
  ];

  try {
    const response = await axios.post(
      `${baseUrl}${DATAFORSEO_ENDPOINTS.LABS_RELATED_KEYWORDS}`,
      requestBody,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`Labs API Error: ${response.data.status_message}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Labs Related Keywords error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Labs API: Keywords for Site
 * Получение ключевых слов по домену конкурента
 */
export async function getLabsKeywordsForSite(params: {
  target: string; // домен конкурента
  language_code: string;
  location_code: number;
  limit?: number;
}): Promise<any> {
  const credentials = getDataForSeoCredentials();
  const baseUrl = getDataForSeoBaseUrl();

  const requestBody = [
    {
      target: params.target,
      language_code: params.language_code,
      location_code: params.location_code,
      limit: params.limit || 100,
      include_serp_info: true,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    },
  ];

  try {
    const response = await axios.post(
      `${baseUrl}${DATAFORSEO_ENDPOINTS.LABS_KEYWORDS_FOR_SITE}`,
      requestBody,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`Labs API Error: ${response.data.status_message}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Labs Keywords for Site error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * SERP Advanced API: анализ интента через PAA и snippets
 */
export async function getSerpAdvancedForIntent(params: {
  keyword: string;
  language_code: string;
  location_code: number;
}): Promise<any> {
  const credentials = getDataForSeoCredentials();
  const baseUrl = getDataForSeoBaseUrl();

  const requestBody = [
    {
      keyword: params.keyword,
      language_code: params.language_code,
      location_code: params.location_code,
      device: 'desktop',
      os: 'windows',
      depth: SEMANTIC_CLUSTER_CONFIG.SERP_TOP_RESULTS,
      calculate_rectangles: false,
    },
  ];

  try {
    const response = await axios.post(
      `${baseUrl}${DATAFORSEO_ENDPOINTS.SERP_ORGANIC_ADVANCED}`,
      requestBody,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`SERP API Error: ${response.data.status_message}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('SERP Advanced error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Определение интента ключевого слова по SERP features
 */
export function analyzeKeywordIntent(serpData: any): KeywordIntent {
  if (!serpData || !serpData.tasks || serpData.tasks.length === 0) {
    return KeywordIntent.INFORMATIONAL;
  }

  const result = serpData.tasks[0].result?.[0];
  if (!result) {
    return KeywordIntent.INFORMATIONAL;
  }

  const items = result.items || [];
  const itemTypes = result.item_types || [];
  
  // Проверяем наличие различных SERP features
  const hasPAA = itemTypes.includes('people_also_ask');
  const hasFeaturedSnippet = itemTypes.includes('featured_snippet');
  const hasKnowledgeGraph = itemTypes.includes('knowledge_graph');
  const hasShoppingResults = itemTypes.includes('shopping');
  const hasLocalPack = itemTypes.includes('local_pack');
  
  // Анализ заголовков и URL топ-10
  const topTitles = items
    .filter((item: any) => item.type === 'organic')
    .slice(0, 10)
    .map((item: any) => (item.title || '').toLowerCase());
  
  const topUrls = items
    .filter((item: any) => item.type === 'organic')
    .slice(0, 10)
    .map((item: any) => (item.url || '').toLowerCase());

  // Transactional signals
  const transactionalWords = ['buy', 'price', 'shop', 'order', 'purchase', 'cart', 'купить', 'цена', 'заказать'];
  const hasTransactional = topTitles.some((title: string) =>
    transactionalWords.some((word) => title.includes(word))
  ) || topUrls.some((url: string) =>
    transactionalWords.some((word) => url.includes(word))
  );

  // Commercial signals
  const commercialWords = ['best', 'review', 'comparison', 'vs', 'top', 'лучший', 'обзор', 'сравнение'];
  const hasCommercial = topTitles.some((title: string) =>
    commercialWords.some((word) => title.includes(word))
  );

  // Informational signals
  const informationalWords = ['how', 'what', 'why', 'guide', 'tutorial', 'как', 'что', 'почему', 'гайд'];
  const hasInformational = topTitles.some((title: string) =>
    informationalWords.some((word) => title.includes(word))
  );

  // Local signals
  const localWords = ['near me', 'in', 'location', 'рядом', 'адрес'];
  const hasLocal = topTitles.some((title: string) =>
    localWords.some((word) => title.includes(word))
  ) || hasLocalPack;

  // Приоритизация intent
  if (hasShoppingResults || hasTransactional) {
    return KeywordIntent.TRANSACTIONAL;
  }
  
  if (hasLocal) {
    return KeywordIntent.LOCAL;
  }
  
  if (hasCommercial) {
    return KeywordIntent.COMMERCIAL;
  }
  
  if (hasPAA || hasFeaturedSnippet || hasInformational) {
    return KeywordIntent.INFORMATIONAL;
  }
  
  if (hasKnowledgeGraph) {
    return KeywordIntent.NAVIGATIONAL;
  }

  // По умолчанию
  return KeywordIntent.INFORMATIONAL;
}

/**
 * Сбор полного семантического ядра из seed-ключей
 * Возвращает ~100+ ключевых слов с метриками и интентом
 */
export async function buildSemanticCluster(params: {
  seeds: string[];
  language_code: string;
  location_code: number;
  targetSize?: number;
  competitorDomain?: string;
}): Promise<{
  keywords: Array<{
    keyword: string;
    search_volume: number;
    cpc: number;
    competition: number;
    keyword_difficulty: number;
    intent: KeywordIntent;
    source: 'seed' | 'labs' | 'related' | 'competitor';
  }>;
  totalFound: number;
  processingTime: number;
}> {
  const startTime = Date.now();
  const targetSize = params.targetSize || SEMANTIC_CLUSTER_CONFIG.TARGET_CLUSTER_SIZE;
  
  console.log(`[Semantic Cluster] Building cluster from ${params.seeds.length} seeds, target: ${targetSize} keywords`);

  const allKeywords = new Map<string, any>(); // уникальные ключевые слова

  try {
    // Шаг 1: Labs Keywords for Keywords (основной источник)
    console.log('[Semantic Cluster] Step 1: Labs Keywords for Keywords');
    const labsData = await getLabsKeywordsForKeywords({
      seeds: params.seeds,
      language_code: params.language_code,
      location_code: params.location_code,
      limit: targetSize,
      filters: {
        search_volume_min: SEMANTIC_CLUSTER_CONFIG.MIN_SEARCH_VOLUME,
        keyword_difficulty_max: SEMANTIC_CLUSTER_CONFIG.MAX_KEYWORD_DIFFICULTY,
      },
    });

    // Обработка результатов Labs API
    const labsResults = labsData.tasks?.[0]?.result || [];
    labsResults.forEach((item: any) => {
      const keyword = item.keyword;
      if (!allKeywords.has(keyword)) {
        allKeywords.set(keyword, {
          keyword,
          search_volume: item.keyword_info?.search_volume || 0,
          cpc: item.keyword_info?.cpc || 0,
          competition: item.keyword_info?.competition || 0,
          keyword_difficulty: item.keyword_info?.keyword_difficulty || 0,
          intent: KeywordIntent.INFORMATIONAL, // будет определен позже
          source: params.seeds.includes(keyword) ? 'seed' : 'labs',
        });
      }
    });

    console.log(`[Semantic Cluster] Labs returned ${labsResults.length} keywords`);

    // Шаг 2: Related Keywords для каждого seed (если нужно больше)
    if (allKeywords.size < targetSize) {
      console.log('[Semantic Cluster] Step 2: Related Keywords');
      
      for (const seed of params.seeds) {
        const relatedData = await getLabsRelatedKeywords({
          keyword: seed,
          language_code: params.language_code,
          location_code: params.location_code,
          limit: 30,
        });

        const relatedResults = relatedData.tasks?.[0]?.result || [];
        relatedResults.forEach((item: any) => {
          const keyword = item.keyword;
          if (!allKeywords.has(keyword)) {
            allKeywords.set(keyword, {
              keyword,
              search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
              cpc: item.keyword_data?.keyword_info?.cpc || 0,
              competition: item.keyword_data?.keyword_info?.competition || 0,
              keyword_difficulty: item.keyword_data?.keyword_info?.keyword_difficulty || 0,
              intent: KeywordIntent.INFORMATIONAL,
              source: 'related',
            });
          }
        });
      }

      console.log(`[Semantic Cluster] After related: ${allKeywords.size} keywords`);
    }

    // Шаг 3: Keywords for Site (если указан домен конкурента)
    if (params.competitorDomain && allKeywords.size < targetSize) {
      console.log('[Semantic Cluster] Step 3: Competitor Keywords');
      
      const siteData = await getLabsKeywordsForSite({
        target: params.competitorDomain,
        language_code: params.language_code,
        location_code: params.location_code,
        limit: 50,
      });

      const siteResults = siteData.tasks?.[0]?.result || [];
      siteResults.forEach((item: any) => {
        const keyword = item.keyword;
        if (!allKeywords.has(keyword)) {
          allKeywords.set(keyword, {
            keyword,
            search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
            cpc: item.keyword_data?.keyword_info?.cpc || 0,
            competition: item.keyword_data?.keyword_info?.competition || 0,
            keyword_difficulty: item.keyword_data?.keyword_info?.keyword_difficulty || 0,
            intent: KeywordIntent.INFORMATIONAL,
            source: 'competitor',
          });
        }
      });

      console.log(`[Semantic Cluster] After competitor: ${allKeywords.size} keywords`);
    }

    // Шаг 4: Анализ интента для топовых ключевых слов (первые 20)
    // Это дорого, поэтому делаем только для самых важных
    console.log('[Semantic Cluster] Step 4: Intent Analysis (top 20)');
    
    const sortedKeywords = Array.from(allKeywords.values())
      .sort((a, b) => b.search_volume - a.search_volume);
    
    const topKeywords = sortedKeywords.slice(0, 20);
    
    for (const kwData of topKeywords) {
      try {
        const serpData = await getSerpAdvancedForIntent({
          keyword: kwData.keyword,
          language_code: params.language_code,
          location_code: params.location_code,
        });

        const intent = analyzeKeywordIntent(serpData);
        kwData.intent = intent;

        // Задержка чтобы не упереться в rate limit
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Failed to analyze intent for "${kwData.keyword}":`, error);
        // Продолжаем с дефолтным intent
      }
    }

    // Финальная сортировка и ограничение
    const finalKeywords = Array.from(allKeywords.values())
      .sort((a, b) => {
        // Сортировка: search volume DESC, keyword difficulty ASC
        if (b.search_volume !== a.search_volume) {
          return b.search_volume - a.search_volume;
        }
        return a.keyword_difficulty - b.keyword_difficulty;
      })
      .slice(0, targetSize);

    const processingTime = Date.now() - startTime;

    console.log(`[Semantic Cluster] Complete! ${finalKeywords.length} keywords in ${processingTime}ms`);

    return {
      keywords: finalKeywords,
      totalFound: allKeywords.size,
      processingTime,
    };

  } catch (error) {
    console.error('[Semantic Cluster] Error:', error);
    throw error;
  }
}
