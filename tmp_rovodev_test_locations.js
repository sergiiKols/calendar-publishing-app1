/**
 * Тестирование различных location codes для DataForSEO
 * Чтобы найти правильный код для Sri Lanka
 */

const axios = require('axios');

const DATAFORSEO_LOGIN = 'alex@yachtservice.vip';
const DATAFORSEO_PASSWORD = 'f293de466eb3eda0';
const BASE_URL = 'https://api.dataforseo.com/v3';

const auth = {
  username: DATAFORSEO_LOGIN,
  password: DATAFORSEO_PASSWORD,
};

// Различные варианты локаций и ключевых слов для тестирования
const testCases = [
  {
    name: 'Sri Lanka location + Sri Lanka keyword',
    keyword: 'apartment rent colombo',
    location_code: 2144, // Sri Lanka
    language_code: 'en',
  },
  {
    name: 'USA location + popular keyword',
    keyword: 'seo',
    location_code: 2840, // United States
    language_code: 'en',
  },
  {
    name: 'USA location + digital nomad',
    keyword: 'digital nomad',
    location_code: 2840, // United States
    language_code: 'en',
  },
  {
    name: 'Global location + Sri Lanka keyword',
    keyword: 'sri lanka apartment',
    location_code: 2840, // United States
    language_code: 'en',
  },
];

async function testKeyword(testCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`Keyword: "${testCase.keyword}"`);
  console.log(`Location: ${testCase.location_code}`);
  console.log(`Language: ${testCase.language_code}`);
  console.log(`${'='.repeat(70)}`);

  const requestBody = [
    {
      keywords: [testCase.keyword],
      location_code: testCase.location_code,
      language_code: testCase.language_code,
      search_partners: false,
      sort_by: 'relevance',
    },
  ];

  try {
    const response = await axios.post(
      `${BASE_URL}/keywords_data/google_ads/keywords_for_keywords/live`,
      requestBody,
      {
        auth,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    console.log('Status:', data.status_code, data.status_message);
    console.log('Cost:', data.cost);
    console.log('Tasks:', data.tasks_count);

    if (data.tasks && data.tasks[0]?.result) {
      const result = data.tasks[0].result[0];
      console.log('\n📊 RESULT:');
      console.log('  Keyword:', result.keyword);
      console.log('  Search Volume:', result.search_volume);
      console.log('  CPC:', result.cpc);
      console.log('  Competition Index:', result.competition_index);
      console.log('  Competition:', result.competition);
      
      if (result.monthly_searches) {
        console.log('  Monthly Searches:', result.monthly_searches.length, 'months');
      }
      
      // Проверяем есть ли хоть какие-то данные
      const hasData = result.search_volume !== null || 
                     result.cpc !== null || 
                     result.competition_index !== null;
      
      if (hasData) {
        console.log('  ✅ HAS DATA!');
      } else {
        console.log('  ❌ NO DATA (all null)');
      }
    }
  } catch (error) {
    console.log('❌ ERROR!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function main() {
  console.log('🔍 DataForSEO Location & Keyword Testing');
  console.log('Login:', DATAFORSEO_LOGIN);
  console.log('Testing multiple scenarios...\n');

  for (const testCase of testCases) {
    await testKeyword(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза между запросами
  }

  console.log('\n' + '='.repeat(70));
  console.log('Testing complete!');
  console.log('='.repeat(70));
}

main().catch(console.error);
