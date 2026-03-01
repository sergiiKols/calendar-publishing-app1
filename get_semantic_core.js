#!/usr/bin/env node

/**
 * ФИНАЛЬНЫЙ РАБОЧИЙ СКРИПТ
 * Получение семантического ядра из одного seed-слова
 * Использует DataForSEO Labs API: Related Keywords
 * 
 * Возвращает: ключевые слова с частотностью и SEARCH INTENT
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Файл .env не найден');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

const env = loadEnv();
const DATAFORSEO_LOGIN = env.DATAFORSEO_LOGIN || process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = env.DATAFORSEO_PASSWORD || process.env.DATAFORSEO_PASSWORD;
const DATAFORSEO_API_URL = env.DATAFORSEO_API_URL || process.env.DATAFORSEO_API_URL || 'https://api.dataforseo.com/v3';

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.error('❌ Ошибка: DATAFORSEO_LOGIN и DATAFORSEO_PASSWORD должны быть установлены в .env');
  process.exit(1);
}

async function getSemanticCore(seedKeyword, locationCode = 2840, languageCode = 'en', limit = 100) {
  const endpoint = `${DATAFORSEO_API_URL}/dataforseo_labs/google/related_keywords/live`;
  
  const requestBody = [
    {
      keyword: seedKeyword,
      language_code: languageCode,
      location_code: locationCode,
      limit: limit,
      include_serp_info: true,
      depth: 1
    }
  ];

  console.log(`\n🔍 Отправка запроса в DataForSEO Labs API...`);
  console.log(`📝 Seed-слово: "${seedKeyword}"`);
  console.log(`🌍 Локация: ${locationCode === 2840 ? 'USA' : locationCode === 2144 ? 'Sri Lanka' : locationCode}`);
  console.log(`🗣️  Язык: ${languageCode}`);
  console.log(`🔢 Лимит: ${limit} слов\n`);

  try {
    const response = await axios.post(
      endpoint,
      requestBody,
      {
        auth: {
          username: DATAFORSEO_LOGIN,
          password: DATAFORSEO_PASSWORD,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`API Error: ${response.data.status_message}`);
    }

    const task = response.data.tasks[0];
    const result = task.result?.[0];
    const items = result?.items || [];

    console.log(`✅ Получено: ${items.length} ключевых слов`);
    console.log(`💰 Стоимость: $${task.cost.toFixed(4)}`);
    console.log(`⏱️  Время: ${task.time}`);

    return {
      items,
      cost: task.cost,
      totalCount: items.length
    };

  } catch (error) {
    console.error('❌ Ошибка при запросе к DataForSEO:', error.message);
    if (error.response) {
      console.error('Ответ от API:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

function analyzeResults(items) {
  if (!items || items.length === 0) {
    console.log('\n❌ Нет данных для анализа');
    return null;
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА');
  console.log('='.repeat(80));
  console.log(`✅ Всего ключевых слов: ${items.length}`);
  
  const intentStats = {};
  const frequencyRanges = {
    'Очень высокая (>10000)': 0,
    'Высокая (1000-10000)': 0,
    'Средняя (100-1000)': 0,
    'Низкая (10-100)': 0,
    'Очень низкая (<10)': 0,
    'Нет данных': 0
  };

  const allKeywords = [];

  items.forEach(item => {
    const keywordData = item.keyword_data;
    const keyword = keywordData.keyword;
    const volume = keywordData.keyword_info?.search_volume || 0;
    const cpc = keywordData.keyword_info?.cpc || 0;
    const competition = keywordData.keyword_info?.competition || 0;
    const intent = keywordData.search_intent_info?.main_intent || 'unknown';
    const difficulty = keywordData.keyword_properties?.keyword_difficulty || 0;
    const relatedKeywords = item.related_keywords || [];
    
    allKeywords.push({
      keyword,
      volume,
      cpc,
      competition,
      intent,
      difficulty,
      relatedKeywords
    });
    
    // Статистика по интентам
    if (!intentStats[intent]) {
      intentStats[intent] = { count: 0, totalVolume: 0, keywords: [] };
    }
    intentStats[intent].count++;
    intentStats[intent].totalVolume += volume;
    
    if (intentStats[intent].keywords.length < 5) {
      intentStats[intent].keywords.push({
        keyword,
        volume,
        cpc,
        competition,
        difficulty
      });
    }
    
    // Статистика по частотности
    if (volume === 0 || volume === null) {
      frequencyRanges['Нет данных']++;
    } else if (volume > 10000) {
      frequencyRanges['Очень высокая (>10000)']++;
    } else if (volume >= 1000) {
      frequencyRanges['Высокая (1000-10000)']++;
    } else if (volume >= 100) {
      frequencyRanges['Средняя (100-1000)']++;
    } else if (volume >= 10) {
      frequencyRanges['Низкая (10-100)']++;
    } else {
      frequencyRanges['Очень низкая (<10)']++;
    }
  });

  // Вывод статистики по интентам
  console.log('\n🎯 РАСПРЕДЕЛЕНИЕ ПО ИНТЕНТАМ:');
  console.log('-'.repeat(80));
  
  Object.entries(intentStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([intent, stats]) => {
      const percentage = ((stats.count / items.length) * 100).toFixed(1);
      console.log(`\n${getIntentEmoji(intent)} ${intent.toUpperCase()}:`);
      console.log(`   Количество: ${stats.count} (${percentage}%)`);
      console.log(`   Общий объем поиска: ${stats.totalVolume.toLocaleString()}`);
      console.log(`   Топ-5 ключевых слов:`);
      stats.keywords.forEach((kw, idx) => {
        console.log(`      ${idx + 1}. "${kw.keyword}"`);
        console.log(`         📊 ${kw.volume.toLocaleString()} запросов/мес | 💰 $${kw.cpc.toFixed(2)} | 🎲 Сложность: ${kw.difficulty}/100`);
      });
    });

  // Вывод статистики по частотности
  console.log('\n📈 РАСПРЕДЕЛЕНИЕ ПО ЧАСТОТНОСТИ:');
  console.log('-'.repeat(80));
  Object.entries(frequencyRanges).forEach(([range, count]) => {
    if (count > 0) {
      const percentage = ((count / items.length) * 100).toFixed(1);
      console.log(`   ${range}: ${count} (${percentage}%)`);
    }
  });

  // Топ-10
  console.log('\n🏆 ТОП-10 КЛЮЧЕВЫХ СЛОВ ПО ОБЪЕМУ ПОИСКА:');
  console.log('-'.repeat(80));
  
  const sorted = [...allKeywords].sort((a, b) => b.volume - a.volume);

  sorted.slice(0, 10).forEach((item, idx) => {
    console.log(`\n${idx + 1}. "${item.keyword}"`);
    console.log(`   📊 Объем поиска: ${item.volume.toLocaleString()} запросов/мес`);
    console.log(`   💰 CPC: $${item.cpc.toFixed(2)}`);
    console.log(`   🎯 Intent: ${item.intent}`);
    console.log(`   ⚔️  Конкуренция: ${(item.competition * 100).toFixed(0)}%`);
    console.log(`   🎲 Сложность: ${item.difficulty}/100`);
    if (item.relatedKeywords.length > 0) {
      console.log(`   🔗 Связанные (${item.relatedKeywords.length}): ${item.relatedKeywords.slice(0, 3).join(', ')}...`);
    }
  });

  console.log('\n' + '='.repeat(80));
  
  return {
    totalKeywords: items.length,
    intentStats,
    allKeywords
  };
}

function getIntentEmoji(intent) {
  const emojis = {
    'informational': 'ℹ️',
    'commercial': '🛍️',
    'transactional': '💳',
    'navigational': '🧭',
    'local': '📍',
    'unknown': '❓'
  };
  return emojis[intent.toLowerCase()] || '❓';
}

async function main() {
  const seedKeyword = process.argv[2] || 'villa rental Sri Lanka';
  const locationCode = parseInt(process.argv[3]) || 2840; // по умолчанию USA
  const limit = parseInt(process.argv[4]) || 100;
  
  console.log('🚀 Запуск скрипта получения семантического ядра...');
  console.log('🔧 Метод: DataForSEO Labs - Related Keywords API');
  
  try {
    const data = await getSemanticCore(seedKeyword, locationCode, 'en', limit);
    
    if (data.totalCount === 0) {
      console.log('\n⚠️  Для этого региона нет данных. Попробуйте другой регион (например, USA: 2840)');
      return;
    }
    
    const stats = analyzeResults(data.items);
    
    if (stats) {
      console.log('\n✅ Анализ завершен успешно!');
      console.log(`\n📊 Краткая сводка:`);
      console.log(`   • Получено слов: ${stats.totalKeywords}`);
      console.log(`   • Стоимость: $${data.cost.toFixed(4)}`);
      console.log(`   • Интентов найдено: ${Object.keys(stats.intentStats).length}`);
      console.log(`   • Цена за слово: $${(data.cost / stats.totalKeywords).toFixed(6)}`);
    }
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();
