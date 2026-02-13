/**
 * Instagram Publisher
 * Публикация статей в Instagram через Graph API
 * Требуется Instagram Business Account
 */

import axios from 'axios';

interface Article {
  title: string;
  content: string;
  images?: any;
}

export async function publishToInstagram(article: Article) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('Instagram credentials not configured');
  }

  if (!article.images || article.images.length === 0) {
    throw new Error('Instagram requires at least one image');
  }

  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${accountId}`;

    // Формируем caption
    const caption = `${article.title}\n\n${article.content}`;

    // Шаг 1: Создаём media container
    const containerResponse = await axios.post(`${apiUrl}/media`, {
      image_url: article.images[0],
      caption: caption,
      access_token: accessToken
    });

    const creationId = containerResponse.data.id;

    // Шаг 2: Публикуем media container
    const publishResponse = await axios.post(`${apiUrl}/media_publish`, {
      creation_id: creationId,
      access_token: accessToken
    });

    return {
      success: true,
      url: `https://instagram.com/p/${publishResponse.data.id}`,
      id: publishResponse.data.id
    };

  } catch (error: any) {
    console.error('Instagram publish error:', error.response?.data || error.message);
    throw new Error(`Instagram: ${error.response?.data?.error?.message || error.message}`);
  }
}
