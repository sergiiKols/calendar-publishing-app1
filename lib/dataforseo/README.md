# DataForSEO Integration Module

## Структура модуля

```
lib/dataforseo/
├── client.ts         # Клиент для работы с API
├── config.ts         # Конфигурация и константы
├── types.ts          # TypeScript типы
└── README.md         # Этот файл
```

## Использование

### Клиент API

```typescript
import { getDataForSeoClient } from '@/lib/dataforseo/client';

const client = getDataForSeoClient();

// Получить данные по ключевым словам
const response = await client.getKeywordsData({
  keywords: ['keyword1', 'keyword2'],
  language_code: 'en',
  location_code: 2840, // USA
});

// SERP анализ
const serp = await client.getSerpAnalysis({
  keyword: 'my keyword',
  language_code: 'en',
  location_code: 2840,
});

// Предложения
const suggestions = await client.getKeywordSuggestions({
  keyword: 'my keyword',
  language_code: 'en',
  location_code: 2840,
});
```

### Batch обработка

```typescript
// Обработать все endpoints для списка ключевых слов
const results = await client.processKeywordsBatch({
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  language_code: 'en',
  location_code: 2840,
});

// results.keywordsData - Keywords Data для всех
// results.serpAnalysis - массив SERP для каждого
// results.suggestions - массив предложений для каждого
```

### Конфигурация

```typescript
import { 
  DATAFORSEO_LOCATIONS,
  getLocationOptions,
  getLanguageOptions 
} from '@/lib/dataforseo/config';

// Список регионов для UI
const locations = getLocationOptions();
// [{value: '2840', label: 'United States', language: 'en'}, ...]

// Список языков
const languages = getLanguageOptions();
// [{value: 'en', label: 'English'}, ...]

// Использовать конкретный регион
const russia = DATAFORSEO_LOCATIONS.RUSSIA;
// {code: '2643', name: 'Russia', language: 'ru'}
```

### Типы данных

```typescript
import type {
  KeywordsDataResponse,
  SerpAnalysisResponse,
  KeywordSuggestionsResponse,
  SeoKeyword,
  SeoResult,
} from '@/lib/dataforseo/types';
```

## API Endpoints

### Keywords Data
- **Path:** `/v3/keywords_data/google/keywords_for_keywords/live`
- **Возвращает:** search_volume, cpc, competition, monthly_searches
- **Стоимость:** ~$0.001 за keyword

### SERP Analysis
- **Path:** `/v3/serp/google/organic/live`
- **Возвращает:** топ-100 результатов, featured snippets, rankings
- **Стоимость:** ~$0.002 за запрос

### Keyword Suggestions
- **Path:** `/v3/keywords_data/google/keyword_suggestions/live`
- **Возвращает:** похожие ключевые слова с метриками
- **Стоимость:** ~$0.001 за запрос

## Environment Variables

```bash
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
DATAFORSEO_API_URL=https://api.dataforseo.com/v3
```

## Error Handling

```typescript
try {
  const data = await client.getKeywordsData({...});
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    
    if (status === 401) {
      // Authentication failed
    } else if (status === 402) {
      // Insufficient funds
    } else if (status === 429) {
      // Rate limit exceeded
    }
  }
}
```

## Тестирование подключения

```typescript
const client = getDataForSeoClient();
const isConnected = await client.testConnection();

if (isConnected) {
  console.log('DataForSEO API connected successfully!');
} else {
  console.error('Failed to connect to DataForSEO API');
}
```

## Location Codes

Основные коды регионов:
- `2840` - United States
- `2643` - Russia  
- `2124` - Canada
- `2826` - United Kingdom
- `2036` - Australia
- `2144` - Sri Lanka

Полный список: https://docs.dataforseo.com/v3/appendix/locations/

## Language Codes

- `en` - English
- `ru` - Russian
- `es` - Spanish
- `fr` - French
- `de` - German

Полный список: https://docs.dataforseo.com/v3/appendix/languages/

## Links

- [DataForSEO Docs](https://docs.dataforseo.com/)
- [API Reference](https://docs.dataforseo.com/v3/)
- [Pricing](https://dataforseo.com/pricing)
