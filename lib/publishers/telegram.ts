/**
 * Telegram Publisher
 * Публикация статей в Telegram канал через Bot API
 */

import axios from 'axios';

interface Article {
  title: string;
  content: string;
  images?: any;
}

export async function publishToTelegram(article: Article) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    throw new Error('Telegram credentials not configured');
  }

  try {
    const apiUrl = `https://api.telegram.org/bot${botToken}`;

    // Формируем текст сообщения
    const text = `<b>${article.title}</b>\n\n${article.content}`;

    // Если есть изображения - отправляем с фото
    if (article.images && article.images.length > 0) {
      const response = await axios.post(`${apiUrl}/sendPhoto`, {
        chat_id: channelId,
        photo: article.images[0],
        caption: text,
        parse_mode: 'HTML'
      });

      return {
        success: true,
        url: `https://t.me/${channelId.replace('@', '')}/${response.data.result.message_id}`,
        id: response.data.result.message_id
      };
    } else {
      // Отправляем только текст
      const response = await axios.post(`${apiUrl}/sendMessage`, {
        chat_id: channelId,
        text: text,
        parse_mode: 'HTML'
      });

      return {
        success: true,
        url: `https://t.me/${channelId.replace('@', '')}/${response.data.result.message_id}`,
        id: response.data.result.message_id
      };
    }

  } catch (error: any) {
    console.error('Telegram publish error:', error.response?.data || error.message);
    throw new Error(`Telegram: ${error.response?.data?.description || error.message}`);
  }
}
