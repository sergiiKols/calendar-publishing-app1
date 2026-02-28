const axios = require('axios');

const DATAFORSEO_LOGIN = 'alex@yachtservice.vip';
const DATAFORSEO_PASSWORD = 'f293de466eb3eda0';
const BASE_URL = 'https://api.dataforseo.com/v3';

const auth = {
  username: DATAFORSEO_LOGIN,
  password: DATAFORSEO_PASSWORD,
};

async function testExactKeyword() {
  console.log('Testing exact keyword: "Sri Lanka apartment digital nomad"\n');

  const requestBody = [
    {
      keywords: ['Sri Lanka apartment digital nomad'],
      location_code: 2840,
      language_code: 'en',
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
    console.log('Full Response:\n', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testExactKeyword();
