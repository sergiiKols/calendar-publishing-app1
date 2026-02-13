/**
 * Facebook Publisher
 * Публикация статей на Facebook Page через Graph API
 */

import axios from 'axios';

interface Article {
  title: string;
  content: string;
  images?: any;
}

export async function publishToFacebook(article: Article) {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId) {
    throw new Error('Facebook credentials not configured');
  }

  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${pageId}`;

    // Формируем текст поста
    const message = `${article.title}\n\n${article.content}`;

    let response;

    // Если есть изображения - публикуем с фото
    if (article.images && article.images.length > 0) {
      response = await axios.post(`${apiUrl}/photos`, {
        url: article.images[0],
        caption: message,
        access_token: pageAccessToken
      });

      const postId = response.data.post_id;
      return {
        success: true,
        url: `https://facebook.com/${postId}`,
        id: response.data.id
      };
    } else {
      // Публикуем только текст
      response = await axios.post(`${apiUrl}/feed`, {
        message: message,
        access_token: pageAccessToken
      });

      return {
        success: true,
        url: `https://facebook.com/${response.data.id}`,
        id: response.data.id
      };
    }

  } catch (error: any) {
    console.error('Facebook publish error:', error.response?.data || error.message);
    throw new Error(`Facebook: ${error.response?.data?.error?.message || error.message}`);
  }
}
