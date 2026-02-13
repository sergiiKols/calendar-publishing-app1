/**
 * LinkedIn Publisher
 * Публикация статей в LinkedIn через API
 */

import axios from 'axios';

interface Article {
  title: string;
  content: string;
  images?: any;
}

export async function publishToLinkedIn(article: Article) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const authorId = process.env.LINKEDIN_AUTHOR_ID;

  if (!accessToken || !authorId) {
    throw new Error('LinkedIn credentials not configured');
  }

  try {
    const apiUrl = 'https://api.linkedin.com/v2/ugcPosts';

    // Формируем текст поста
    const text = `${article.title}\n\n${article.content}`;

    const postData: any = {
      author: authorId,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Если есть изображения - добавляем медиа
    if (article.images && article.images.length > 0) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: article.images[0]
        }
      ];
    }

    const response = await axios.post(apiUrl, postData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const postId = response.headers['x-restli-id'];

    return {
      success: true,
      url: `https://www.linkedin.com/feed/update/${postId}`,
      id: postId
    };

  } catch (error: any) {
    console.error('LinkedIn publish error:', error.response?.data || error.message);
    throw new Error(`LinkedIn: ${error.response?.data?.message || error.message}`);
  }
}
