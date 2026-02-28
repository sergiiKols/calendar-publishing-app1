/**
 * Cost Estimator - Расчет стоимости операций DataForSEO
 */

import { API_COSTS, BudgetLimits, DEFAULT_LIMITS } from './budget-guard';

/**
 * Рассчитать стоимость расширения семантики (Keywords Finder)
 */
export function estimateKeywordsFinderCost(
  seedCount: number,
  ideasPerSeed: number,
  limits: BudgetLimits = DEFAULT_LIMITS
): number {
  // Keywords for Keywords API: $0.10 per 1000 keywords
  const totalKeywords = seedCount * ideasPerSeed;
  const cost = (totalKeywords / 1000) * API_COSTS.KEYWORDS_FOR_KEYWORDS;
  return Math.max(0.001, cost); // Минимум $0.001
}

/**
 * Рассчитать стоимость получения метрик (Keywords Data)
 */
export function estimateMetricsCost(
  keywordCount: number,
  limits: BudgetLimits = DEFAULT_LIMITS
): number {
  // Keywords Data API: $0.05 per 1000 keywords
  const cost = (keywordCount / 1000) * API_COSTS.SEARCH_VOLUME;
  return Math.max(0.001, cost);
}

/**
 * Рассчитать стоимость SERP анализа
 */
export function estimateSERPCost(
  keywordCount: number,
  depth: 'top-10' | 'top-20' | 'top-100' = 'top-10',
  limits: BudgetLimits = DEFAULT_LIMITS
): number {
  // SERP Organic API: $0.60 per 1000 requests
  const multiplier = depth === 'top-10' ? 1 : depth === 'top-20' ? 1.5 : 5;
  const cost = (keywordCount / 1000) * API_COSTS.SERP_ORGANIC * multiplier;
  return Math.max(0.001, cost);
}

/**
 * Рассчитать стоимость полного семантического кластера
 */
export function estimateClusterCost(
  seedCount: number,
  targetSize: number,
  includeSERP: boolean = true,
  limits: BudgetLimits = DEFAULT_LIMITS
): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    keywordsFinder: 0,
    metrics: 0,
    serp: 0,
  };

  // Keywords Finder (2x для расширения)
  const finderCost = estimateKeywordsFinderCost(seedCount, targetSize / seedCount);
  breakdown.keywordsFinder = finderCost;

  // Metrics для всех ключей
  const totalKeywords = targetSize * 2; // Учитываем расширение
  const metricsCost = estimateMetricsCost(totalKeywords);
  breakdown.metrics = metricsCost;

  // SERP (опционально)
  if (includeSERP) {
    const serpCost = estimateSERPCost(totalKeywords, 'top-20');
    breakdown.serp = serpCost;
  }

  const total = breakdown.keywordsFinder + breakdown.metrics + breakdown.serp;

  return {
    total: Math.round(total * 1000) / 1000,
    breakdown,
  };
}

/**
 * Рассчитать стоимость batch операции
 */
export function estimateBatchCost(
  operationType: 'keywords_data' | 'serp' | 'suggestions',
  count: number,
  limits: BudgetLimits = DEFAULT_LIMITS
): number {
  const costs = {
    keywords_data: API_COSTS.SEARCH_VOLUME,
    serp: API_COSTS.SERP_ORGANIC,
    suggestions: API_COSTS.KEYWORD_SUGGESTIONS,
  };

  const costPerUnit = costs[operationType];
  const cost = (count / 1000) * costPerUnit;
  return Math.max(0.001, cost);
}

/**
 * Форматировать стоимость для отображения
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Проверить, укладывается ли операция в лимиты
 */
export function checkCostLimit(
  estimatedCost: number,
  limits: BudgetLimits = DEFAULT_LIMITS
): {
  allowed: boolean;
  warning?: string;
  reason?: string;
} {
  if (estimatedCost > limits.maxCostPerRequest) {
    return {
      allowed: false,
      reason: `Стоимость ($${estimatedCost.toFixed(2)}) превышает лимит ($${limits.maxCostPerRequest})`,
    };
  }

  if (estimatedCost > limits.maxDailyCost * 0.8) {
    return {
      allowed: true,
      warning: `Внимание: операция составляет ${(estimatedCost / limits.maxDailyCost * 100).toFixed(0)}% дневного лимита`,
    };
  }

  return { allowed: true };
}