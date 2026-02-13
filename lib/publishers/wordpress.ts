/**
 * WordPress Publisher
 * Публикация статей через WordPress REST API
 */

import axios from 'axios';

interface Article {
  title: string;
  content: string;
  images?: any;
}

export async function publishToWordPress(article: Article) {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    throw new Error('WordPress credentials not configured');
  }

  try {
    // Загружаем изображения (если есть)
    let featuredMediaId = null;
    if (article.images && article.images.length > 0) {
      featuredMediaId = await uploadWordPressImage(article.images[0], siteUrl, username, appPassword);
    }

    // Создаём пост
    const response = await axios.post(
      `${siteUrl}/wp-json/wp/v2/posts`,
      {
        title: article.title,
        content: article.content,
        status: 'publish',
        featured_media: featuredMediaId
      },
      {
        auth: {
          username,
          password: appPassword
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      url: response.data.link,
      id: response.data.id
    };

  } catch (error: any) {
    console.error('WordPress publish error:', error.response?.data || error.message);
    throw new Error(`WordPress: ${error.response?.data?.message || error.message}`);
  }
}

async function uploadWordPressImage(imageUrl: string, siteUrl: string, username: string, appPassword: string) {
  try {
    // Скачиваем изображение
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data);

    // Загружаем в WordPress
    const response = await axios.post(
      `${siteUrl}/wp-json/wp/v2/media`,
      buffer,
      {
        auth: {
          username,
          password: appPassword
        },
        headers: {
          'Content-Type': imageResponse.headers['content-type'],
          'Content-Disposition': `attachment; filename="image.jpg"`
        }
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
}
