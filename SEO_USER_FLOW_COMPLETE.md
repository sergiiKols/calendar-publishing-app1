# 🔄 Полный путь клиента: Сбор семантического ядра

**Дата:** 2026-02-28  
**Описание:** Пошаговый flow клиента от ввода seed-ключей до получения готового семантического кластера

---

## 📋 ОГЛАВЛЕНИЕ

1. [Шаг 1: Клиент открывает форму и вводит seeds](#шаг-1)
2. [Шаг 2: Отправка запроса на сервер](#шаг-2)
3. [Шаг 3: Расширение keywords через DataForSEO Labs](#шаг-3)
4. [Шаг 4: Получение метрик (SV, CPC, KD)](#шаг-4)
5. [Шаг 5: SERP анализ и определение intent](#шаг-5)
6. [Шаг 6: Кластеризация (DBSCAN)](#шаг-6)
7. [Шаг 7: Сохранение в БД](#шаг-7)
8. [Шаг 8: Возврат результата клиенту](#шаг-8)
9. [Шаг 9: Просмотр и экспорт](#шаг-9)

---

## <a name="шаг-1"></a>ШАГ 1: Клиент открывает форму и вводит seeds

### 👤 Действие клиента:
1. Открывает страницу `/seo`
2. Нажимает кнопку "✨ Семантический кластер"
3. Заполняет форму `SemanticClusterForm`:
   - **Seeds** (3-5 ключевых слов):
     ```
     yacht charter
     boat rental
     sailing vacation
     ```
   - **Язык:** Русский (ru)
   - **Регион:** Russia (2643)
   - **Проект:** выбирает из списка (опционально)

### 💻 Что происходит в коде:

**Файл:** `components/SemanticClusterForm.tsx`

```typescript
// Строки 69-128
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Валидация: минимум 3 seeds
  const seedList = seeds.split('\n').filter(s => s.trim());
  if (seedList.length < 3) {
    toast.error('Минимум 3 seed-ключевых слова');
    return;
  }
  
  setIsSubmitting(true);
  setProgress('Отправка запроса...');
  
  // Формируем данные для отправки
  const requestData = {
    seeds: seedList,
    language: language,
    location_code: location,
    location_name: getLocationName(location),
    project_id: selectedProject || null,
    target_size: 100, // целевое количество ключевых слов
  };
}
```

### ✅ Результат:
Клиент видит loading state с прогрессом:
```
[Loader] Отправка запроса...
```

---

## <a name="шаг-2"></a>ШАГ 2: Отправка запроса на сервер

### 💻 Что происходит:

**Файл:** `components/SemanticClusterForm.tsx` (строки 116-124)

```typescript
const response = await fetch('/api/seo/semantic-cluster', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData),
});

const data = await response.json();
```

### 📡 HTTP запрос:
```http
POST /api/seo/semantic-cluster HTTP/1.1
Content-Type: application/json

{
  "seeds": ["yacht charter", "boat rental", "sailing vacation"],
  "language": "ru",
  "location_code": "2643",
  "location_name": "Russia",
  "project_id": null,
  "target_size": 100
}
```

### 🔐 Проверка авторизации:

**Файл:** `app/api/seo/semantic-cluster/route.ts` (строки 19-38)

```typescript
// Проверка сессии
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

// Получение user_id из БД
const userResult = await sql`
  SELECT id FROM users WHERE email = ${session.user.email}
`;
const userId = userResult.rows[0].id;
```

### ✅ Результат:
- ✅ Пользователь авторизован (userId = 42)
- ✅ Запрос валиден (3 seeds, язык и регион указаны)

---


## <a name="шаг-3"></a>ШАГ 3: Расширение keywords через DataForSEO Labs

### 🔄 Что происходит:

**Файл:** `app/api/seo/semantic-cluster/route.ts` (строки 81-88)

```typescript
// Вызов функции buildSemanticCluster
const clusterData = await buildSemanticCluster({
  seeds: ["yacht charter", "boat rental", "sailing vacation"],
  language_code: "ru",
  location_code: 2643,
  targetSize: 100,
  competitorDomain: undefined,
});
```

### 📊 Внутри buildSemanticCluster:

**Файл:** `lib/dataforseo/labs-client.ts` (строки 315-489)

#### 3.1. Labs API: Keywords for Keywords

```typescript
// Строки 343-353
const labsData = await getLabsKeywordsForKeywords({
  seeds: ["yacht charter", "boat rental", "sailing vacation"],
  language_code: "ru",
  location_code: 2643,
  limit: 100,
  filters: {
    search_volume_min: 10,  // SEMANTIC_CLUSTER_CONFIG.MIN_SEARCH_VOLUME
    keyword_difficulty_max: 80, // SEMANTIC_CLUSTER_CONFIG.MAX_KEYWORD_DIFFICULTY
  },
});
```

**DataForSEO Request:**
```http
POST https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_keywords/live
Authorization: Basic base64(login:password)
Content-Type: application/json

[{
  "keywords": ["yacht charter", "boat rental", "sailing vacation"],
  "language_code": "ru",
  "location_code": 2643,
  "limit": 100,
  "include_serp_info": true,
  "include_seed_keyword": true,
  "filters": [
    ["keyword_info.search_volume", ">=", 10],
    ["keyword_info.keyword_difficulty", "<=", 80]
  ],
  "order_by": ["keyword_info.search_volume,desc"]
}]
```

**DataForSEO Response:**
```json
{
  "status_code": 20000,
  "tasks": [{
    "result": [
      {
        "keyword": "yacht charter mediterranean",
        "keyword_info": {
          "search_volume": 8900,
          "cpc": 3.45,
          "competition": 0.67,
          "keyword_difficulty": 42
        }
      },
      {
        "keyword": "boat rental prices",
        "keyword_info": {
          "search_volume": 5400,
          "cpc": 2.80,
          "competition": 0.54,
          "keyword_difficulty": 38
        }
      },
      // ... ещё 98 ключевых слов
    ]
  }]
}
```

**Обработка результата (строки 356-371):**
```typescript
labsResults.forEach((item: any) => {
  const keyword = item.keyword;
  if (!allKeywords.has(keyword)) {
    allKeywords.set(keyword, {
      keyword: "yacht charter mediterranean",
      search_volume: 8900,
      cpc: 3.45,
      competition: 0.67,
      keyword_difficulty: 42,
      intent: KeywordIntent.INFORMATIONAL, // будет определен позже
      source: "labs", // или "seed" если это исходный keyword
    });
  }
});
```

### ✅ Результат Шага 3.1:
```
allKeywords Map (100 записей):
  "yacht charter mediterranean" => {sv: 8900, cpc: 3.45, ...}
  "boat rental prices" => {sv: 5400, cpc: 2.80, ...}
  "sailing vacation greece" => {sv: 3200, cpc: 2.10, ...}
  ...
```

---

#### 3.2. Labs API: Related Keywords (если нужно больше)

**Условие (строки 375-404):**
```typescript
if (allKeywords.size < targetSize) { // если < 100
  for (const seed of ["yacht charter", "boat rental", "sailing vacation"]) {
    const relatedData = await getLabsRelatedKeywords({
      keyword: seed,
      language_code: "ru",
      location_code: 2643,
      limit: 30,
    });
    
    // Добавляем новые ключи в allKeywords
  }
}
```

**DataForSEO Request (Related Keywords):**
```http
POST https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live

[{
  "keyword": "yacht charter",
  "language_code": "ru",
  "location_code": 2643,
  "limit": 30,
  "include_serp_info": true
}]
```

**Response:**
```json
{
  "tasks": [{
    "result": [
      {
        "keyword": "yacht charter cost",
        "keyword_data": {
          "keyword_info": {
            "search_volume": 2100,
            "cpc": 2.95,
            ...
          }
        }
      }
    ]
  }]
}
```

### ✅ Результат Шага 3.2:
```
allKeywords Map (теперь 130 записей после related keywords)
```

---

#### 3.3. Labs API: Keywords for Site (если указан конкурент)

**Условие (строки 407-434):**
```typescript
if (params.competitorDomain && allKeywords.size < targetSize) {
  const siteData = await getLabsKeywordsForSite({
    target: "charterworld.com", // домен конкурента
    language_code: "ru",
    location_code: 2643,
    limit: 50,
  });
}
```

**DataForSEO Request:**
```http
POST https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live

[{
  "target": "charterworld.com",
  "language_code": "ru",
  "location_code": 2643,
  "limit": 50,
  "include_serp_info": true,
  "order_by": ["keyword_data.keyword_info.search_volume,desc"]
}]
```

### ✅ Финальный результат Шага 3:
```javascript
allKeywords Map (150+ ключевых слов):
  - 3 seed keywords
  - 97 from Keywords for Keywords
  - 30 from Related Keywords (для каждого seed)
  - 50 from Keywords for Site (конкурент)

Примеры:
{
  keyword: "yacht charter mediterranean",
  search_volume: 8900,
  cpc: 3.45,
  competition: 0.67,
  keyword_difficulty: 42,
  intent: INFORMATIONAL, // будет обновлен в шаге 5
  source: "labs"
}
```

---

## <a name="шаг-4"></a>ШАГ 4: Получение метрик (SV, CPC, KD)

### 💡 Примечание:
Метрики уже получены в Шаге 3, так как DataForSEO Labs API возвращает их вместе с ключевыми словами благодаря параметру `include_serp_info: true`.

**Данные уже есть:**
- ✅ `search_volume` - объем поиска
- ✅ `cpc` - стоимость клика
- ✅ `competition` - конкуренция (0-1)
- ✅ `keyword_difficulty` - сложность (0-100)

**Если бы нужен был отдельный запрос:**
```typescript
// Альтернативный метод (не используется в текущей реализации)
const metricsData = await getKeywordsData({
  keywords: ["yacht charter", "boat rental", ...],
  language_code: "ru",
  location_code: 2643,
});
```

### ✅ Результат:
Все 150+ keywords имеют полные метрики.

---

## <a name="шаг-5"></a>ШАГ 5: SERP анализ и определение intent

### 🔄 Что происходит:

**Файл:** `lib/dataforseo/labs-client.ts` (строки 437-462)

### 5.1. Выбор топ-20 keywords для анализа

```typescript
// Сортируем по search volume, берем топ-20
const sortedKeywords = Array.from(allKeywords.values())
  .sort((a, b) => b.search_volume - a.search_volume);

const topKeywords = sortedKeywords.slice(0, 20);
```

**Топ-20 keywords:**
```
1. yacht charter mediterranean (SV: 8900)
2. boat rental prices (SV: 5400)
3. sailing vacation greece (SV: 3200)
...
20. private yacht charter (SV: 820)
```

---

### 5.2. SERP запрос для каждого из топ-20

**Цикл по топ-20 (строки 445-462):**
```typescript
for (const kwData of topKeywords) {
  try {
    // SERP запрос
    const serpData = await getSerpAdvancedForIntent({
      keyword: kwData.keyword,
      language_code: "ru",
      location_code: 2643,
    });
    
    // Анализ intent
    const intent = analyzeKeywordIntent(serpData);
    kwData.intent = intent;
    
    // Задержка 300ms (защита от rate limit)
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.error(`Failed to analyze intent for "${kwData.keyword}"`);
    // Оставляем дефолтный intent = INFORMATIONAL
  }
}
```

---

### 5.3. DataForSEO SERP Request

**Пример для keyword "yacht charter mediterranean":**

```http
POST https://api.dataforseo.com/v3/serp/google/organic/live/advanced

[{
  "keyword": "yacht charter mediterranean",
  "language_code": "ru",
  "location_code": 2643,
  "device": "desktop",
  "os": "windows",
  "depth": 10,
  "calculate_rectangles": false
}]
```

**SERP Response:**
```json
{
  "tasks": [{
    "result": [{
      "items": [
        {
          "type": "organic",
          "rank_group": 1,
          "title": "Mediterranean Yacht Charter Guide 2026",
          "url": "https://yachtworld.com/mediterranean-charter",
          "domain": "yachtworld.com"
        },
        {
          "type": "people_also_ask",
          "items": [
            {"question": "How much does a yacht charter cost?"},
            {"question": "What is included in yacht charter?"}
          ]
        }
      ],
      "item_types": ["organic", "people_also_ask", "featured_snippet"]
    }]
  }]
}
```

---

### 5.4. Анализ intent

**Файл:** `lib/dataforseo/labs-client.ts` (строки 229-309)

```typescript
function analyzeKeywordIntent(serpData: any): KeywordIntent {
  const result = serpData.tasks[0].result?.[0];
  const items = result.items || [];
  const itemTypes = result.item_types || [];
  
  // Проверяем SERP features
  const hasPAA = itemTypes.includes('people_also_ask');
  const hasFeaturedSnippet = itemTypes.includes('featured_snippet');
  const hasShoppingResults = itemTypes.includes('shopping');
  const hasLocalPack = itemTypes.includes('local_pack');
  
  // Анализ заголовков топ-10
  const topTitles = items
    .filter(item => item.type === 'organic')
    .slice(0, 10)
    .map(item => item.title.toLowerCase());
  
  // Transactional signals
  const transactionalWords = ['buy', 'price', 'shop', 'купить', 'цена'];
  const hasTransactional = topTitles.some(title =>
    transactionalWords.some(word => title.includes(word))
  );
  
  // Commercial signals
  const commercialWords = ['best', 'review', 'comparison', 'лучший', 'обзор'];
  const hasCommercial = topTitles.some(title =>
    commercialWords.some(word => title.includes(word))
  );
  
  // Informational signals
  const informationalWords = ['how', 'what', 'guide', 'как', 'что', 'гайд'];
  const hasInformational = topTitles.some(title =>
    informationalWords.some(word => title.includes(word))
  );
  
  // Приоритизация
  if (hasShoppingResults || hasTransactional) {
    return KeywordIntent.TRANSACTIONAL;
  }
  if (hasLocalPack) {
    return KeywordIntent.LOCAL;
  }
  if (hasCommercial) {
    return KeywordIntent.COMMERCIAL;
  }
  if (hasPAA || hasFeaturedSnippet || hasInformational) {
    return KeywordIntent.INFORMATIONAL;
  }
  
  return KeywordIntent.INFORMATIONAL; // default
}
```

**Результат анализа:**
```javascript
// "yacht charter mediterranean"
{
  hasPAA: true,
  hasFeaturedSnippet: true,
  hasShoppingResults: false,
  topTitles: ["mediterranean yacht charter guide 2026", "how to charter..."],
  hasInformational: true,
  
  => intent: INFORMATIONAL
}

// "boat rental prices"
{
  hasTransactional: true, // "prices" в заголовках
  topTitles: ["yacht charter prices 2026", "boat rental cost calculator"],
  
  => intent: COMMERCIAL
}
```

### ✅ Результат Шага 5:
```javascript
Топ-20 keywords с обновленным intent:
{
  keyword: "yacht charter mediterranean",
  search_volume: 8900,
  intent: INFORMATIONAL, // ✅ обновлено
  ...
}
{
  keyword: "boat rental prices",
  search_volume: 5400,
  intent: COMMERCIAL, // ✅ обновлено
  ...
}

Остальные 130 keywords:
  intent: INFORMATIONAL // default (не анализировали для экономии)
```

**Стоимость:**
- 20 SERP запросов × $0.0006 = $0.012
- Общее время: ~6 секунд (20 × 300ms задержка)

---


## <a name="шаг-6"></a>ШАГ 6: Кластеризация (DBSCAN)

### 🔄 Что происходит:

**Файл:** `app/api/seo/semantic-cluster/route.ts` (строка 121)

```typescript
// Применяем кластеризацию
const clusteredData = clusterKeywordsFull(filteredKeywords);
```

**Файл:** `lib/dataforseo/clustering.ts` (строки 281-334)

---

### 6.1. Группировка по intent

```typescript
// Сначала группируем по intent
const byIntent = groupByIntent(keywords);

Результат:
Map {
  INFORMATIONAL => [85 keywords],
  COMMERCIAL => [35 keywords],
  TRANSACTIONAL => [20 keywords],
  LOCAL => [10 keywords],
  NAVIGATIONAL => [0 keywords]
}
```

---

### 6.2. Семантическая кластеризация (DBSCAN)

**Алгоритм (строки 187-276):**

#### Шаг 6.2.1: Вычисление TF-IDF векторов

```typescript
// Строки 207-208
const keywordStrings = keywords.map(kw => kw.keyword);
const tfidfVectors = calculateTfIdf(keywordStrings);
```

**Процесс:**
```javascript
// 1. Tokenization
"yacht charter mediterranean" => ["yacht", "charter", "mediterranean"]
"boat rental prices" => ["boat", "rental", "prices"]
"sailing vacation greece" => ["sailing", "vacation", "greece"]

// 2. TF-IDF расчет
Vocabulary: ["yacht", "charter", "mediterranean", "boat", "rental", ...]

TF-IDF векторы:
"yacht charter mediterranean" => [0.85, 0.92, 0.67, 0, 0, ...]
"boat rental prices" => [0, 0, 0, 0.78, 0.81, ...]
```

**Функция calculateTfIdf (строки 21-67):**
```typescript
function calculateTfIdf(documents: string[]): Map<string, number[]> {
  // 1. Tokenize все документы
  const tokenizedDocs = documents.map(doc => tokenize(doc));
  
  // 2. Создать vocabulary (все уникальные токены)
  const vocabulary = Array.from(allTokens);
  
  // 3. Вычислить IDF для каждого токена
  const idf = new Map<string, number>();
  vocabulary.forEach(token => {
    const docsWithToken = tokenizedDocs.filter(tokens => 
      tokens.includes(token)
    ).length;
    idf.set(token, Math.log((documents.length + 1) / (docsWithToken + 1)));
  });
  
  // 4. Вычислить TF-IDF вектор для каждого документа
  documents.forEach((doc, docIdx) => {
    const tokens = tokenizedDocs[docIdx];
    const vector = new Array(vocabulary.length).fill(0);
    
    tokens.forEach(token => {
      const tf = count / tokens.length;
      const idfValue = idf.get(token);
      vector[idx] = tf * idfValue;
    });
    
    tfidfVectors.set(doc, vector);
  });
  
  return tfidfVectors;
}
```

---

#### Шаг 6.2.2: Применение DBSCAN

**Параметры:**
```typescript
eps = 0.3 // CLUSTERING_SIMILARITY_THRESHOLD (cosine similarity)
minPts = 3 // MIN_CLUSTER_SIZE (минимум 3 ключа в кластере)
```

**Алгоритм DBSCAN (строки 92-162):**

```typescript
function dbscan(keywords, tfidfVectors, eps=0.3, minPts=3) {
  const assignments = new Map(); // keyword -> cluster_id
  let clusterId = 0;
  
  // Для каждого ключевого слова
  keywords.forEach(keyword => {
    if (visited.has(keyword)) return;
    
    // Находим соседей (similarity >= 0.3)
    const neighbors = getNeighbors(keyword);
    
    if (neighbors.length < 3) {
      assignments.set(keyword, -1); // noise (не попал в кластер)
    } else {
      // Расширяем кластер
      expandCluster(keyword, neighbors, clusterId);
      clusterId++;
    }
  });
  
  return assignments;
}
```

**Пример работы:**

```javascript
Keyword: "yacht charter mediterranean"
TF-IDF: [0.85, 0.92, 0.67, 0, 0, ...]

Поиск соседей:
  "yacht charter greece" => cosine_similarity = 0.82 ✅ (>= 0.3)
  "luxury yacht charter" => cosine_similarity = 0.74 ✅
  "yacht charter cost" => cosine_similarity = 0.68 ✅
  "yacht rental mediterranean" => cosine_similarity = 0.61 ✅
  "boat rental prices" => cosine_similarity = 0.12 ❌ (< 0.3)
  
Соседей: 4 (>= minPts=3) => создаем Cluster #0

Cluster #0: [
  "yacht charter mediterranean",
  "yacht charter greece",
  "luxury yacht charter",
  "yacht charter cost",
  "yacht rental mediterranean"
]
```

**Результат DBSCAN:**
```javascript
assignments Map {
  "yacht charter mediterranean" => 0,
  "yacht charter greece" => 0,
  "luxury yacht charter" => 0,
  "boat rental prices" => 1,
  "boat rental cost" => 1,
  "sailing vacation greece" => 2,
  "sailing holiday mediterranean" => 2,
  "catamaran rental" => -1, // noise (мало похожих)
  ...
}

Создано кластеров: 12
Noise keywords: 8
```

---

#### Шаг 6.2.3: Формирование финальных кластеров

**Код (строки 230-276):**

```typescript
const clusters = [];

clusterMap.forEach((clusterKeywords, clusterId) => {
  if (clusterId === -1) return; // пропускаем noise
  
  // Сортируем по search volume
  clusterKeywords.sort((a, b) => b.search_volume - a.search_volume);
  
  // Метрики кластера
  const totalSearchVolume = clusterKeywords.reduce(
    (sum, kw) => sum + kw.search_volume, 0
  );
  
  const avgKeywordDifficulty = clusterKeywords.reduce(
    (sum, kw) => sum + kw.keyword_difficulty, 0
  ) / clusterKeywords.length;
  
  // Доминирующий intent
  const intentCounts = new Map();
  clusterKeywords.forEach(kw => {
    intentCounts.set(kw.intent, (intentCounts.get(kw.intent) || 0) + 1);
  });
  const dominantIntent = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Название = самое популярное ключевое слово
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

// Сортируем по search volume
clusters.sort((a, b) => b.total_search_volume - a.total_search_volume);
```

---

### ✅ Результат Шага 6:

**Финальные кластеры:**

```javascript
{
  byIntent: Map {
    INFORMATIONAL => [85 keywords],
    COMMERCIAL => [35 keywords],
    TRANSACTIONAL => [20 keywords],
    LOCAL => [10 keywords]
  },
  
  bySemantic: [
    {
      cluster_id: 0,
      cluster_name: "yacht charter mediterranean",
      keywords: [
        {keyword: "yacht charter mediterranean", search_volume: 8900, ...},
        {keyword: "yacht charter greece", search_volume: 4200, ...},
        {keyword: "luxury yacht charter", search_volume: 3100, ...},
        {keyword: "yacht charter cost", search_volume: 2800, ...},
        {keyword: "yacht rental mediterranean", search_volume: 1900, ...}
      ],
      total_search_volume: 20900,
      avg_keyword_difficulty: 44,
      dominant_intent: "INFORMATIONAL"
    },
    {
      cluster_id: 1,
      cluster_name: "boat rental prices",
      keywords: [
        {keyword: "boat rental prices", search_volume: 5400, ...},
        {keyword: "boat rental cost", search_volume: 3200, ...},
        {keyword: "yacht charter prices", search_volume: 2900, ...}
      ],
      total_search_volume: 11500,
      avg_keyword_difficulty: 38,
      dominant_intent: "COMMERCIAL"
    },
    {
      cluster_id: 2,
      cluster_name: "sailing vacation greece",
      keywords: [...],
      total_search_volume: 9800,
      avg_keyword_difficulty: 32,
      dominant_intent: "INFORMATIONAL"
    },
    // ... ещё 9 кластеров
  ],
  
  summary: {
    total_keywords: 150,
    total_search_volume: 245000,
    intent_distribution: {
      INFORMATIONAL: 85,
      COMMERCIAL: 35,
      TRANSACTIONAL: 20,
      LOCAL: 10,
      NAVIGATIONAL: 0
    },
    cluster_count: 12
  }
}
```

---

## <a name="шаг-7"></a>ШАГ 7: Сохранение в БД

### 🔄 Что происходит:

**Файл:** `app/api/seo/semantic-cluster/route.ts` (строки 127-211)

---

### 7.1. Создание записи semantic_cluster

```sql
INSERT INTO seo_semantic_clusters (
  user_id,
  project_id,
  name,
  seeds,
  language,
  location_code,
  location_name,
  total_keywords,
  total_search_volume,
  cluster_count,
  status
)
VALUES (
  42, -- user_id
  NULL, -- project_id
  'yacht charter, boat rental, sailing vacation', -- name
  '["yacht charter", "boat rental", "sailing vacation"]', -- seeds JSON
  'ru',
  '2643',
  'Russia',
  150, -- total_keywords
  245000, -- total_search_volume
  12, -- cluster_count
  'completed'
)
RETURNING id;
```

**Результат:**
```sql
id: 567 (cluster_record_id)
```

---

### 7.2. Сохранение кластеров

**Цикл по 12 кластерам (строки 160-182):**

```sql
-- Cluster #0
INSERT INTO seo_clusters (
  semantic_cluster_id,
  cluster_id,
  cluster_name,
  dominant_intent,
  total_search_volume,
  avg_keyword_difficulty,
  keywords_count
)
VALUES (
  567, -- semantic_cluster_id
  0,
  'yacht charter mediterranean',
  'INFORMATIONAL',
  20900,
  44,
  5
)
RETURNING id;
-- Возвращает cluster_db_id: 1001

-- Cluster #1
INSERT INTO seo_clusters ... -- cluster_db_id: 1002
-- ...
-- Cluster #11
INSERT INTO seo_clusters ... -- cluster_db_id: 1012
```

---

### 7.3. Сохранение ключевых слов

**Вложенный цикл (строки 186-209):**

```sql
-- Для Cluster #0 (5 keywords)
INSERT INTO seo_cluster_keywords (
  cluster_id,
  keyword,
  search_volume,
  cpc,
  competition,
  keyword_difficulty,
  intent,
  source
)
VALUES
  (1001, 'yacht charter mediterranean', 8900, 3.45, 0.67, 42, 'INFORMATIONAL', 'labs'),
  (1001, 'yacht charter greece', 4200, 3.12, 0.58, 39, 'INFORMATIONAL', 'labs'),
  (1001, 'luxury yacht charter', 3100, 4.20, 0.72, 51, 'INFORMATIONAL', 'labs'),
  (1001, 'yacht charter cost', 2800, 2.95, 0.54, 38, 'INFORMATIONAL', 'related'),
  (1001, 'yacht rental mediterranean', 1900, 2.80, 0.48, 36, 'INFORMATIONAL', 'related');

-- Для Cluster #1 (3 keywords)
INSERT INTO seo_cluster_keywords ...
  (1002, 'boat rental prices', 5400, ...),
  (1002, 'boat rental cost', 3200, ...),
  (1002, 'yacht charter prices', 2900, ...);

-- ... для всех 12 кластеров (150 keywords total)
```

---

### ✅ Результат Шага 7:

**База данных:**

```
seo_semantic_clusters:
  id: 567
  name: "yacht charter, boat rental, sailing vacation"
  total_keywords: 150
  total_search_volume: 245000
  cluster_count: 12
  status: "completed"

seo_clusters (12 записей):
  id: 1001, cluster_name: "yacht charter mediterranean", keywords_count: 5
  id: 1002, cluster_name: "boat rental prices", keywords_count: 3
  id: 1003, cluster_name: "sailing vacation greece", keywords_count: 4
  ...
  id: 1012, cluster_name: "catamaran charter", keywords_count: 7

seo_cluster_keywords (150 записей):
  cluster_id: 1001, keyword: "yacht charter mediterranean", sv: 8900
  cluster_id: 1001, keyword: "yacht charter greece", sv: 4200
  ...
  cluster_id: 1012, keyword: "catamaran charter malta", sv: 850
```

---


## <a name="шаг-8"></a>ШАГ 8: Возврат результата клиенту

### 🔄 Что происходит:

**Файл:** `app/api/seo/semantic-cluster/route.ts` (строки 214-240)

```typescript
// Формируем ответ
return NextResponse.json({
  success: true,
  cluster_id: 567, // clusterRecordId
  summary: {
    total_keywords: 150,
    total_found: 180, // было найдено перед фильтрацией
    total_search_volume: 245000,
    cluster_count: 12,
    intent_distribution: {
      INFORMATIONAL: 85,
      COMMERCIAL: 35,
      TRANSACTIONAL: 20,
      LOCAL: 10,
      NAVIGATIONAL: 0
    },
    processing_time_ms: 8450 // ~8.5 секунд
  },
  clusters: [
    {
      cluster_id: 0,
      cluster_name: "yacht charter mediterranean",
      keywords_count: 5,
      total_search_volume: 20900,
      avg_keyword_difficulty: 44,
      dominant_intent: "INFORMATIONAL",
      top_keywords: [
        {keyword: "yacht charter mediterranean", search_volume: 8900, cpc: 3.45},
        {keyword: "yacht charter greece", search_volume: 4200, cpc: 3.12},
        {keyword: "luxury yacht charter", search_volume: 3100, cpc: 4.20},
        {keyword: "yacht charter cost", search_volume: 2800, cpc: 2.95},
        {keyword: "yacht rental mediterranean", search_volume: 1900, cpc: 2.80}
      ]
    },
    {
      cluster_id: 1,
      cluster_name: "boat rental prices",
      keywords_count: 3,
      total_search_volume: 11500,
      avg_keyword_difficulty: 38,
      dominant_intent: "COMMERCIAL",
      top_keywords: [...]
    },
    // ... ещё 10 кластеров
  ]
});
```

---

### 📡 HTTP Response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "cluster_id": 567,
  "summary": {
    "total_keywords": 150,
    "total_found": 180,
    "total_search_volume": 245000,
    "cluster_count": 12,
    "intent_distribution": {
      "INFORMATIONAL": 85,
      "COMMERCIAL": 35,
      "TRANSACTIONAL": 20,
      "LOCAL": 10,
      "NAVIGATIONAL": 0
    },
    "processing_time_ms": 8450
  },
  "clusters": [...]
}
```

---

### 👤 Клиент получает результат:

**Файл:** `components/SemanticClusterForm.tsx` (строки 124-136)

```typescript
const data = await response.json();

if (data.success) {
  toast.success(`✅ Собрано ${data.summary.total_keywords} ключевых слов!`);
  onSuccess(data.cluster_id); // вызываем callback с cluster_id
  onClose(); // закрываем форму
} else {
  toast.error(data.error);
}
```

---

### 🎨 UI обновляется:

**Файл:** `app/(dashboard)/seo/page.tsx` (строки 361-364)

```typescript
const handleClusterSuccess = (clusterId: number) => {
  setShowClusterForm(false);
  setClusterId(clusterId); // сохраняем cluster_id
  loadClusters(); // перезагружаем список кластеров
};
```

**Клиент видит:**
```
┌────────────────────────────────────────────────────┐
│ ✅ Собрано 150 ключевых слов!                      │
│                                                    │
│ 📊 Семантические кластеры                          │
│ ┌────┬─────────────────────────┬─────┬────────┐  │
│ │ ID │ Название                │ KW  │ SV     │  │
│ ├────┼─────────────────────────┼─────┼────────┤  │
│ │567 │yacht charter, boat...   │ 150 │ 245k   │  │
│ │    │✨ Только что создан     │     │        │  │
│ └────┴─────────────────────────┴─────┴────────┘  │
│ [👁️ Просмотр] [📊 Визуализация] [📥 Export CSV] │
└────────────────────────────────────────────────────┘
```

---

## <a name="шаг-9"></a>ШАГ 9: Просмотр и экспорт результатов

### 9.1. Просмотр деталей кластера

**Клиент нажимает "👁️ Просмотр"**

**Запрос:**
```http
GET /api/seo/semantic-cluster/567
```

**Файл:** `app/api/seo/semantic-cluster/[id]/route.ts` (строки 11-108)

```sql
-- Получаем данные кластера
SELECT 
  sc.*,
  p.name as project_name,
  c.id as cluster_id,
  c.cluster_name,
  c.dominant_intent,
  c.total_search_volume as cluster_sv,
  c.keywords_count,
  ck.keyword,
  ck.search_volume,
  ck.cpc,
  ck.competition,
  ck.keyword_difficulty,
  ck.intent,
  ck.source
FROM seo_semantic_clusters sc
LEFT JOIN projects p ON sc.project_id = p.id
LEFT JOIN seo_clusters c ON sc.id = c.semantic_cluster_id
LEFT JOIN seo_cluster_keywords ck ON c.id = ck.cluster_id
WHERE sc.id = 567 AND sc.user_id = 42
ORDER BY c.cluster_id, ck.search_volume DESC;
```

**Response:**
```json
{
  "success": true,
  "cluster": {
    "id": 567,
    "name": "yacht charter, boat rental, sailing vacation",
    "seeds": ["yacht charter", "boat rental", "sailing vacation"],
    "language": "ru",
    "location_name": "Russia",
    "total_keywords": 150,
    "total_search_volume": 245000,
    "cluster_count": 12,
    "status": "completed",
    "created_at": "2026-02-28T14:30:00Z"
  },
  "clusters": [
    {
      "cluster_id": 0,
      "cluster_name": "yacht charter mediterranean",
      "dominant_intent": "INFORMATIONAL",
      "total_search_volume": 20900,
      "keywords_count": 5,
      "keywords": [
        {
          "keyword": "yacht charter mediterranean",
          "search_volume": 8900,
          "cpc": 3.45,
          "competition": 0.67,
          "keyword_difficulty": 42,
          "intent": "INFORMATIONAL",
          "source": "labs"
        },
        // ... остальные 4 keywords
      ]
    },
    // ... остальные 11 кластеров
  ]
}
```

---

### 🎨 UI показывает детали:

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Кластер: yacht charter, boat rental, sailing vacation    │
│ ──────────────────────────────────────────────────────────── │
│ Seeds: yacht charter, boat rental, sailing vacation          │
│ Язык: Русский | Регион: Russia                              │
│ Создан: 28.02.2026 14:30                                     │
│                                                              │
│ Статистика:                                                  │
│ • Всего ключевых слов: 150                                   │
│ • Общий search volume: 245,000/месяц                         │
│ • Семантических кластеров: 12                                │
│                                                              │
│ Распределение по intent:                                     │
│ • INFORMATIONAL: 85 (57%)                                    │
│ • COMMERCIAL: 35 (23%)                                       │
│ • TRANSACTIONAL: 20 (13%)                                    │
│ • LOCAL: 10 (7%)                                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Кластер #0: yacht charter mediterranean                 │ │
│ │ Intent: INFORMATIONAL | SV: 20,900 | KD: 44 | KW: 5     │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ • yacht charter mediterranean (SV: 8900, CPC: $3.45)     │ │
│ │ • yacht charter greece (SV: 4200, CPC: $3.12)            │ │
│ │ • luxury yacht charter (SV: 3100, CPC: $4.20)            │ │
│ │ • yacht charter cost (SV: 2800, CPC: $2.95)              │ │
│ │ • yacht rental mediterranean (SV: 1900, CPC: $2.80)      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Кластер #1: boat rental prices                          │ │
│ │ Intent: COMMERCIAL | SV: 11,500 | KD: 38 | KW: 3        │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ • boat rental prices (SV: 5400, CPC: $2.80)              │ │
│ │ • boat rental cost (SV: 3200, CPC: $2.50)                │ │
│ │ • yacht charter prices (SV: 2900, CPC: $3.10)            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [... ещё 10 кластеров ...]                                  │
│                                                              │
│ [📥 Export CSV] [📊 Визуализация] [🗑️ Удалить]             │
└──────────────────────────────────────────────────────────────┘
```

---

### 9.2. Экспорт в CSV

**Клиент нажимает "📥 Export CSV"**

**Запрос:**
```http
GET /api/seo/semantic-cluster/567/export
```

**Файл:** `app/api/seo/semantic-cluster/[id]/export/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Получаем данные кластера (аналогично шагу 9.1)
  const { cluster, clusters } = await getClusterDetails(params.id);
  
  // Генерируем CSV
  const csv = exportClustersToCSV(clusters);
  
  // Возвращаем файл
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="semantic-cluster-${params.id}.csv"`
    }
  });
}
```

**Функция exportClustersToCSV:**

**Файл:** `lib/dataforseo/clustering.ts` (строки 339-365)

```typescript
export function exportClustersToCSV(clusters) {
  const lines = [];
  
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
        kw.source || 'unknown'
      ].join(','));
    });
  });
  
  return lines.join('\n');
}
```

**Сгенерированный CSV файл:**

```csv
Cluster ID,Cluster Name,Keyword,Search Volume,CPC,Competition,Keyword Difficulty,Intent,Source
0,"yacht charter mediterranean","yacht charter mediterranean",8900,3.45,0.67,42,INFORMATIONAL,labs
0,"yacht charter mediterranean","yacht charter greece",4200,3.12,0.58,39,INFORMATIONAL,labs
0,"yacht charter mediterranean","luxury yacht charter",3100,4.20,0.72,51,INFORMATIONAL,labs
0,"yacht charter mediterranean","yacht charter cost",2800,2.95,0.54,38,INFORMATIONAL,related
0,"yacht charter mediterranean","yacht rental mediterranean",1900,2.80,0.48,36,INFORMATIONAL,related
1,"boat rental prices","boat rental prices",5400,2.80,0.62,35,COMMERCIAL,labs
1,"boat rental prices","boat rental cost",3200,2.50,0.58,33,COMMERCIAL,labs
1,"boat rental prices","yacht charter prices",2900,3.10,0.65,40,COMMERCIAL,related
2,"sailing vacation greece","sailing vacation greece",3200,2.10,0.45,30,INFORMATIONAL,labs
...
(150 строк total)
```

---

### 📥 Клиент получает файл:

```
Браузер скачивает:
semantic-cluster-567.csv (15 KB)

Клиент может открыть в Excel/Google Sheets:
┌────────┬──────────────────────────┬──────────────────────────┬─────┬──────┬──────┬────┬──────────────┬────────┐
│Cluster │Cluster Name              │Keyword                   │SV   │CPC   │Comp  │KD  │Intent        │Source  │
├────────┼──────────────────────────┼──────────────────────────┼─────┼──────┼──────┼────┼──────────────┼────────┤
│0       │yacht charter mediterranean│yacht charter mediterranean│8900 │3.45  │0.67  │42  │INFORMATIONAL │labs    │
│0       │yacht charter mediterranean│yacht charter greece      │4200 │3.12  │0.58  │39  │INFORMATIONAL │labs    │
│...     │...                       │...                       │...  │...   │...   │... │...           │...     │
└────────┴──────────────────────────┴──────────────────────────┴─────┴──────┴──────┴────┴──────────────┴────────┘
```

---

## 📊 ПОЛНАЯ СТАТИСТИКА ПРОЦЕССА

### ⏱️ Время выполнения:
```
Шаг 1: Ввод данных                         ~30 сек (ручной ввод)
Шаг 2: Отправка запроса                    ~100 мс
Шаг 3: Расширение keywords (DataForSEO)    ~2-3 сек
  - Labs Keywords for Keywords              1.2 сек
  - Related Keywords (3 seeds)              0.9 сек
  - Keywords for Site (опционально)         1.0 сек
Шаг 4: Метрики                              0 сек (уже включены в шаг 3)
Шаг 5: SERP анализ (топ-20)                 ~6 сек
  - 20 SERP запросов × 300ms                6.0 сек
Шаг 6: Кластеризация (DBSCAN)               ~0.5 сек
  - TF-IDF векторы                          0.2 сек
  - DBSCAN алгоритм                         0.3 сек
Шаг 7: Сохранение в БД                      ~0.5 сек
  - INSERT semantic_cluster                 0.05 сек
  - INSERT 12 clusters                      0.15 сек
  - INSERT 150 keywords                     0.3 сек
Шаг 8: Формирование ответа                  ~0.1 сек

ИТОГО: ~9-10 секунд (без ручного ввода)
```

---

### 💰 Стоимость операций:

```
DataForSEO API:
  Labs Keywords for Keywords    $0.10 per 1000 results
    100 keywords                 = $0.010
  
  Related Keywords (3 seeds)     $0.10 per 1000 results
    3 × 30 keywords = 90         = $0.009
  
  Keywords for Site              $0.50 per 1000 results
    50 keywords                  = $0.025
  
  SERP Organic Advanced (20)     $0.60 per 1000 requests
    20 requests                  = $0.012

TOTAL: ~$0.056 (5.6 центов за семкластер из 150 keywords)

С буфером: $0.10-0.50 в зависимости от размера
```

---

### 📦 Что получил клиент:

```javascript
✅ 150 ключевых слов с полными метриками:
   - search_volume (объем поиска)
   - cpc (стоимость клика)
   - competition (конкуренция)
   - keyword_difficulty (сложность)
   - intent (INFORMATIONAL/COMMERCIAL/TRANSACTIONAL/LOCAL)
   - source (labs/related/competitor/seed)

✅ 12 семантических кластеров:
   - Сгруппированы по смыслу (DBSCAN)
   - С доминирующим intent
   - С общими метриками (total SV, avg KD)

✅ Статистика:
   - Распределение по intent
   - Общий search volume: 245,000/месяц
   - Средний keyword difficulty

✅ Возможности:
   - Просмотр в UI
   - Экспорт в CSV
   - Визуализация кластеров
   - Удаление
   - Повторный анализ
```

---

## 🔄 СХЕМА ПОЛНОГО FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                      КЛИЕНТ (Browser)                           │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 1. Открывает форму, вводит 3 seeds
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              SemanticClusterForm.tsx                            │
│  [yacht charter] [boat rental] [sailing vacation]               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 2. POST /api/seo/semantic-cluster
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│           app/api/seo/semantic-cluster/route.ts                 │
│   • Проверка auth (session, userId)                            │
│   • Валидация (min 3 seeds)                                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 3. buildSemanticCluster()
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/dataforseo/labs-client.ts                      │
│                                                                 │
│  3.1. getLabsKeywordsForKeywords()                             │
│       └─> DataForSEO Labs API                                  │
│           └─> Результат: 100 keywords                          │
│                                                                 │
│  3.2. getLabsRelatedKeywords() (для каждого seed)             │
│       └─> DataForSEO Labs API × 3                             │
│           └─> Результат: +90 keywords                          │
│                                                                 │
│  3.3. getLabsKeywordsForSite() (если есть конкурент)          │
│       └─> DataForSEO Labs API                                  │
│           └─> Результат: +50 keywords                          │
│                                                                 │
│  ИТОГО: 150+ keywords с метриками (SV, CPC, KD)               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 5. Анализ intent для топ-20
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/dataforseo/labs-client.ts                      │
│                                                                 │
│  Для каждого из топ-20 keywords:                               │
│    5.1. getSerpAdvancedForIntent()                             │
│         └─> DataForSEO SERP API                                │
│             └─> SERP features (PAA, snippets, shopping)        │
│                                                                 │
│    5.2. analyzeKeywordIntent()                                 │
│         └─> Анализ заголовков, URL, SERP features             │
│             └─> Определение intent (5 типов)                   │
│                                                                 │
│  Результат: 20 keywords с точным intent                        │
│  Остальные 130: default INFORMATIONAL                          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 6. Кластеризация
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/dataforseo/clustering.ts                       │
│                                                                 │
│  6.1. calculateTfIdf()                                         │
│       └─> Токенизация keywords                                 │
│       └─> Вычисление TF-IDF векторов                           │
│                                                                 │
│  6.2. dbscan()                                                 │
│       └─> Cosine similarity между векторами                    │
│       └─> Группировка (eps=0.3, minPts=3)                      │
│                                                                 │
│  6.3. Формирование кластеров                                   │
│       └─> 12 семантических кластеров                           │
│       └─> Метрики (total SV, avg KD, dominant intent)         │
│                                                                 │
│  Результат: 12 clusters × ~12 keywords каждый                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 7. Сохранение в БД
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                                                                 │
│  7.1. INSERT seo_semantic_clusters                             │
│       └─> id: 567, total_keywords: 150, status: 'completed'    │
│                                                                 │
│  7.2. INSERT seo_clusters (12 записей)                         │
│       └─> cluster_id 0-11 для semantic_cluster_id=567         │
│                                                                 │
│  7.3. INSERT seo_cluster_keywords (150 записей)                │
│       └─> Все keywords с метриками                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 8. Формирование ответа
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│           app/api/seo/semantic-cluster/route.ts                 │
│                                                                 │
│  return NextResponse.json({                                    │
│    success: true,                                              │
│    cluster_id: 567,                                            │
│    summary: {...},                                             │
│    clusters: [...]                                             │
│  })                                                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTP 200 OK + JSON
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              SemanticClusterForm.tsx                            │
│  toast.success("✅ Собрано 150 ключевых слов!")                │
│  onSuccess(567) → обновление списка кластеров                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 9. Просмотр результатов
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   UI (app/seo/page.tsx)                         │
│                                                                 │
│  Опции:                                                        │
│  • 👁️ Просмотр деталей (GET /api/.../567)                     │
│  • 📊 Визуализация кластеров                                   │
│  • 📥 Export CSV (GET /api/.../567/export)                     │
│  • 🗑️ Удаление (DELETE /api/.../567)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

**Документ создан:** 2026-02-28  
**Версия:** 1.0  
**Автор:** AI Agent (Rovo Dev)

