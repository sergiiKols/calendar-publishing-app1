/**
 * API endpoint для приёма статей из SMI проекта
 * POST /api/articles/receive
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInboxArticle } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    // Проверка API ключа
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== process.env.CALENDAR_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, images, source_project, arrival_token } = body;

    // Валидация
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Создаём статью в inbox
    const article = await createInboxArticle({
      title,
      content,
      images: images || [],
      source_project: source_project || 'smi_unknown',
      arrival_token: arrival_token || null
    });

    return NextResponse.json({
      success: true,
      arrival_marker: arrival_token, // Возвращаем маркер прибытия
      article: {
        id: article.id,
        title: article.title,
        status: article.status,
        created_at: article.created_at,
        arrival_token: article.arrival_token
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error receiving article:', error);
    return NextResponse.json(
      { error: 'Failed to receive article', details: error.message },
      { status: 500 }
    );
  }
}
