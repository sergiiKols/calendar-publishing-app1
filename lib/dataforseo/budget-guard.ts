/**
 * Budget Guard - Защита от превышения лимитов DataForSEO
 */

export interface BudgetLimits {
  maxCostPerRequest: number;      // Максимум за один запрос ($)
  maxDailyCost: number;            // Максимум в день ($)
  maxMonthlyCost: number;          // Максимум в месяц ($)
  maxKeywordsPerBatch: number;     // Максимум ключей в одном batch
  alertThreshold: number;          // Порог для предупреждения (%)
}

export const DEFAULT_LIMITS: BudgetLimits = {
  maxCostPerRequest: 0.50,         // Не больше $0.50 за запрос
  maxDailyCost: 2.00,              // Не больше $2 в день
  maxMonthlyCost: 20.00,           // Не больше $20 в месяц
  maxKeywordsPerBatch: 100,        // Не больше 100 ключей за раз
  alertThreshold: 80,              // Предупреждение при 80% лимита
};

// Расчет стоимости запросов
export const API_COSTS = {
  // Keywords Data API (Google Ads)
  SEARCH_VOLUME: 0.00005,          // $0.05 per 1000 keywords
  KEYWORDS_FOR_KEYWORDS: 0.0001,   // $0.10 per 1000 keywords
  
  // SERP API
  SERP_ORGANIC: 0.0006,            // $0.60 per 1000 requests
  
  // Keyword Suggestions
  KEYWORD_SUGGESTIONS: 0.0001,     // $0.10 per 1000 keywords
};

interface UsageStats {
  todayCost: number;
  monthCost: number;
  totalRequests: number;
  lastReset: Date;
}

class BudgetGuard {
  private limits: BudgetLimits;
  private usage: UsageStats;

  constructor(limits: BudgetLimits = DEFAULT_LIMITS) {
    this.limits = limits;
    this.usage = this.loadUsage();
  }

  /**
   * Проверить можно ли выполнить запрос
   */
  canMakeRequest(estimatedCost: number, keywordsCount: number = 1): {
    allowed: boolean;
    reason?: string;
    warning?: string;
  } {
    // Проверка 1: Превышение стоимости запроса
    if (estimatedCost > this.limits.maxCostPerRequest) {
      return {
        allowed: false,
        reason: `Стоимость запроса ($${estimatedCost.toFixed(4)}) превышает лимит ($${this.limits.maxCostPerRequest})`
      };
    }

    // Проверка 2: Превышение количества ключей
    if (keywordsCount > this.limits.maxKeywordsPerBatch) {
      return {
        allowed: false,
        reason: `Количество ключей (${keywordsCount}) превышает лимит (${this.limits.maxKeywordsPerBatch})`
      };
    }

    // Проверка 3: Превышение дневного лимита
    const newDailyCost = this.usage.todayCost + estimatedCost;
    if (newDailyCost > this.limits.maxDailyCost) {
      return {
        allowed: false,
        reason: `Дневной лимит исчерпан. Использовано: $${this.usage.todayCost.toFixed(2)} из $${this.limits.maxDailyCost}`
      };
    }

    // Проверка 4: Превышение месячного лимита
    const newMonthlyCost = this.usage.monthCost + estimatedCost;
    if (newMonthlyCost > this.limits.maxMonthlyCost) {
      return {
        allowed: false,
        reason: `Месячный лимит исчерпан. Использовано: $${this.usage.monthCost.toFixed(2)} из $${this.limits.maxMonthlyCost}`
      };
    }

    // Предупреждения
    let warning: string | undefined;
    
    const dailyPercent = (newDailyCost / this.limits.maxDailyCost) * 100;
    if (dailyPercent >= this.limits.alertThreshold) {
      warning = `⚠️ Использовано ${dailyPercent.toFixed(0)}% дневного лимита`;
    }

    const monthlyPercent = (newMonthlyCost / this.limits.maxMonthlyCost) * 100;
    if (monthlyPercent >= this.limits.alertThreshold) {
      warning = `⚠️ Использовано ${monthlyPercent.toFixed(0)}% месячного лимита`;
    }

    return { allowed: true, warning };
  }

  /**
   * Рассчитать стоимость запроса
   */
  estimateCost(apiType: keyof typeof API_COSTS, count: number = 1): number {
    const costPerUnit = API_COSTS[apiType];
    return costPerUnit * count;
  }

  /**
   * Записать использование после запроса
   */
  recordUsage(actualCost: number) {
    this.usage.todayCost += actualCost;
    this.usage.monthCost += actualCost;
    this.usage.totalRequests += 1;
    this.saveUsage();
  }

  /**
   * Получить статистику использования
   */
  getUsageStats() {
    const dailyPercent = (this.usage.todayCost / this.limits.maxDailyCost) * 100;
    const monthlyPercent = (this.usage.monthCost / this.limits.maxMonthlyCost) * 100;

    return {
      today: {
        used: this.usage.todayCost,
        limit: this.limits.maxDailyCost,
        remaining: this.limits.maxDailyCost - this.usage.todayCost,
        percent: dailyPercent
      },
      month: {
        used: this.usage.monthCost,
        limit: this.limits.maxMonthlyCost,
        remaining: this.limits.maxMonthlyCost - this.usage.monthCost,
        percent: monthlyPercent
      },
      totalRequests: this.usage.totalRequests
    };
  }

  /**
   * Сбросить дневные счетчики (вызывать в 00:00)
   */
  resetDaily() {
    this.usage.todayCost = 0;
    this.saveUsage();
  }

  /**
   * Сбросить месячные счетчики (вызывать 1-го числа)
   */
  resetMonthly() {
    this.usage.monthCost = 0;
    this.usage.totalRequests = 0;
    this.saveUsage();
  }

  /**
   * Обновить лимиты
   */
  updateLimits(newLimits: Partial<BudgetLimits>) {
    this.limits = { ...this.limits, ...newLimits };
  }

  // Приватные методы для хранения данных
  private loadUsage(): UsageStats {
    // TODO: Загрузить из БД или localStorage
    // Сейчас возвращаем дефолтные значения
    return {
      todayCost: 0,
      monthCost: 0,
      totalRequests: 0,
      lastReset: new Date()
    };
  }

  private saveUsage() {
    // TODO: Сохранить в БД
    console.log('[BudgetGuard] Usage saved:', this.usage);
  }
}

// Singleton instance
let budgetGuard: BudgetGuard | null = null;

export function getBudgetGuard(limits?: BudgetLimits): BudgetGuard {
  if (!budgetGuard) {
    budgetGuard = new BudgetGuard(limits);
  }
  return budgetGuard;
}

export default BudgetGuard;
