/**
 * NLP Кластеризация ключевых слов
 * Использует текстовое сходство для группировки по семантике и интенту
 */

import { KeywordIntent, SEMANTIC_CLUSTER_CONFIG } from './config';

/**
 * Простой tokenizer для русского и английского
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // убираем пунктуацию, оставляем unicode буквы и цифры
    .split(/\s+/)
    .filter(token => token.length > 2); // убираем короткие слова
}

/**
 * Вычисление TF-IDF весов для набора документов (ключевых слов)
 */
function calculateTfIdf(documents: string[]): Map<string, number[]> {
  const tokenizedDocs = documents.map(doc => tokenize(doc));
  const allTokens = new Set<string>();
  
  // Собираем все уникальные токены
  tokenizedDocs.forEach(tokens => {
    tokens.forEach(token => allTokens.add(token));
  });

  const vocabulary = Array.from(allTokens);
  const vocabIndex = new Map(vocabulary.map((token, idx) => [token, idx]));
  
  // Вычисляем IDF (inverse document frequency)
  const idf = new Map<string, number>();
  vocabulary.forEach(token => {
    const docsWithToken = tokenizedDocs.filter(tokens => tokens.includes(token)).length;
    idf.set(token, Math.log((documents.length + 1) / (docsWithToken + 1)));
  });

  // Вычисляем TF-IDF векторы для каждого документа
  const tfidfVectors = new Map<string, number[]>();
  
  documents.forEach((doc, docIdx) => {
    const tokens = tokenizedDocs[docIdx];
    const vector = new Array(vocabulary.length).fill(0);
    
    // Подсчитываем частоту токенов (TF)
    const tokenCounts = new Map<string, number>();
    tokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
    
    // Вычисляем TF-IDF
    tokenCounts.forEach((count, token) => {
      const tf = count / tokens.length;
      const idfValue = idf.get(token) || 0;
      const idx = vocabIndex.get(token);
      if (idx !== undefined) {
        vector[idx] = tf * idfValue;
      }
    });
    
    tfidfVectors.set(doc, vector);
  });

  return tfidfVectors;
}

/**
 * Cosine similarity между двумя векторами
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * DBSCAN кластеризация на основе cosine similarity
 */
function dbscan(
  keywords: string[],
  tfidfVectors: Map<string, number[]>,
  eps: number = SEMANTIC_CLUSTER_CONFIG.CLUSTERING_SIMILARITY_THRESHOLD,
  minPts: number = SEMANTIC_CLUSTER_CONFIG.MIN_CLUSTER_SIZE
): Map<string, number> {
  const assignments = new Map<string, number>(); // keyword -> cluster_id
  const visited = new Set<string>();
  let clusterId = 0;

  function getNeighbors(keyword: string): string[] {
    const vec1 = tfidfVectors.get(keyword);
    if (!vec1) return [];
    
    const neighbors: string[] = [];
    
    keywords.forEach(otherKeyword => {
      if (keyword === otherKeyword) return;
      
      const vec2 = tfidfVectors.get(otherKeyword);
      if (!vec2) return;
      
      const similarity = cosineSimilarity(vec1, vec2);
      if (similarity >= eps) {
        neighbors.push(otherKeyword);
      }
    });
    
    return neighbors;
  }

  function expandCluster(keyword: string, neighbors: string[], clusterId: number) {
    assignments.set(keyword, clusterId);
    
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (!visited.has(current)) {
        visited.add(current);
        const currentNeighbors = getNeighbors(current);
        
        if (currentNeighbors.length >= minPts) {
          queue.push(...currentNeighbors);
        }
      }
      
      if (!assignments.has(current)) {
        assignments.set(current, clusterId);
      }
    }
  }

  // Основной алгоритм DBSCAN
  keywords.forEach(keyword => {
    if (visited.has(keyword)) return;
    
    visited.add(keyword);
    const neighbors = getNeighbors(keyword);
    
    if (neighbors.length < minPts) {
      assignments.set(keyword, -1); // noise
    } else {
      expandCluster(keyword, neighbors, clusterId);
      clusterId++;
    }
  });

  return assignments;
}

/**
 * Группировка ключевых слов по интенту
 */
export function groupByIntent(keywords: Array<{
  keyword: string;
  intent: KeywordIntent;
  [key: string]: any;
}>): Map<KeywordIntent, typeof keywords> {
  const groups = new Map<KeywordIntent, typeof keywords>();
  
  keywords.forEach(kw => {
    if (!groups.has(kw.intent)) {
      groups.set(kw.intent, []);
    }
    groups.get(kw.intent)!.push(kw);
  });
  
  return groups;
}

/**
 * Кластеризация ключевых слов по семантике
 */
export function clusterKeywordsBySemantic(
  keywords: Array<{
    keyword: string;
    search_volume: number;
    intent: KeywordIntent;
    [key: string]: any;
  }>
): Array<{
  cluster_id: number;
  cluster_name: string;
  keywords: typeof keywords;
  total_search_volume: number;
  avg_keyword_difficulty: number;
  dominant_intent: KeywordIntent;
}> {
  if (keywords.length === 0) return [];

  console.log(`[Clustering] Starting semantic clustering for ${keywords.length} keywords`);

  // Вычисляем TF-IDF векторы
  const keywordStrings = keywords.map(kw => kw.keyword);
  const tfidfVectors = calculateTfIdf(keywordStrings);

  // Применяем DBSCAN
  const assignments = dbscan(
    keywordStrings,
    tfidfVectors,
    SEMANTIC_CLUSTER_CONFIG.CLUSTERING_SIMILARITY_THRESHOLD,
    SEMANTIC_CLUSTER_CONFIG.MIN_CLUSTER_SIZE
  );

  // Группируем по cluster_id
  const clusterMap = new Map<number, typeof keywords>();
  
  keywords.forEach(kw => {
    const clusterId = assignments.get(kw.keyword) ?? -1;
    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }
    clusterMap.get(clusterId)!.push(kw);
  });

  // Формируем финальные кластеры
  const clusters: Array<{
    cluster_id: number;
    cluster_name: string;
    keywords: typeof keywords;
    total_search_volume: number;
    avg_keyword_difficulty: number;
    dominant_intent: KeywordIntent;
  }> = [];

  clusterMap.forEach((clusterKeywords, clusterId) => {
    if (clusterId === -1) return; // пропускаем noise

    // Сортируем по search volume
    clusterKeywords.sort((a, b) => b.search_volume - a.search_volume);

    // Вычисляем метрики кластера
    const totalSearchVolume = clusterKeywords.reduce((sum, kw) => sum + kw.search_volume, 0);
    const avgKeywordDifficulty = clusterKeywords.reduce((sum, kw) => sum + (kw.keyword_difficulty || 0), 0) / clusterKeywords.length;

    // Определяем доминирующий intent
    const intentCounts = new Map<KeywordIntent, number>();
    clusterKeywords.forEach(kw => {
      intentCounts.set(kw.intent, (intentCounts.get(kw.intent) || 0) + 1);
    });
    const dominantIntent = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];

    // Название кластера - самое популярное ключевое слово
    const clusterName = clusterKeywords[0].keyword;

    clusters.push({
      cluster_id: clusterId,
      cluster_name: clusterName,
      keywords: clusterKeywords,
      total_search_volume: totalSearchVolume,
      avg_keyword_difficulty: Math.round(avgKeywordDifficulty),
      dominant_intent: dominantIntent,
    });
  });

  // Сортируем кластеры по общему search volume
  clusters.sort((a, b) => b.total_search_volume - a.total_search_volume);

  console.log(`[Clustering] Created ${clusters.length} semantic clusters`);

  return clusters;
}

/**
 * Полная кластеризация: сначала по интенту, затем по семантике внутри каждого интента
 */
export function clusterKeywordsFull(
  keywords: Array<{
    keyword: string;
    search_volume: number;
    intent: KeywordIntent;
    keyword_difficulty?: number;
    [key: string]: any;
  }>
): {
  byIntent: Map<KeywordIntent, typeof keywords>;
  bySemantic: ReturnType<typeof clusterKeywordsBySemantic>;
  summary: {
    total_keywords: number;
    total_search_volume: number;
    intent_distribution: Record<KeywordIntent, number>;
    cluster_count: number;
  };
} {
  console.log(`[Clustering] Full clustering for ${keywords.length} keywords`);

  // Группировка по интенту
  const byIntent = groupByIntent(keywords);

  // Семантическая кластеризация
  const bySemantic = clusterKeywordsBySemantic(keywords);

  // Статистика
  const totalSearchVolume = keywords.reduce((sum, kw) => sum + kw.search_volume, 0);
  
  const intentDistribution: Record<KeywordIntent, number> = {
    [KeywordIntent.INFORMATIONAL]: 0,
    [KeywordIntent.TRANSACTIONAL]: 0,
    [KeywordIntent.NAVIGATIONAL]: 0,
    [KeywordIntent.COMMERCIAL]: 0,
    [KeywordIntent.LOCAL]: 0,
  };

  byIntent.forEach((kws, intent) => {
    intentDistribution[intent] = kws.length;
  });

  const summary = {
    total_keywords: keywords.length,
    total_search_volume: totalSearchVolume,
    intent_distribution: intentDistribution,
    cluster_count: bySemantic.length,
  };

  return {
    byIntent,
    bySemantic,
    summary,
  };
}

/**
 * Экспорт кластеров в CSV формат
 */
export function exportClustersToCSV(
  clusters: ReturnType<typeof clusterKeywordsBySemantic>
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Cluster ID,Cluster Name,Keyword,Search Volume,CPC,Competition,Keyword Difficulty,Intent,Source');

  // Data
  clusters.forEach(cluster => {
    cluster.keywords.forEach(kw => {
      lines.push([
        cluster.cluster_id,
        `"${cluster.cluster_name}"`,
        `"${kw.keyword}"`,
        kw.search_volume,
        kw.cpc?.toFixed(2) || 0,
        kw.competition?.toFixed(2) || 0,
        kw.keyword_difficulty || 0,
        kw.intent,
        kw.source || 'unknown',
      ].join(','));
    });
  });

  return lines.join('\n');
}
