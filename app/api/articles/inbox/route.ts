/**
 * API endpoint для получения статей из inbox
 * GET /api/articles/inbox?status=inbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInboxArticles, deleteArticle, updateArticle } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;

    const articles = await getInboxArticles(status);

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length
    });

  } catch (error: any) {
    console.error('Error fetching inbox articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: 'At least one field (title or content) is required' },
        { status: 400 }
      );
    }

    const updatedArticle = await updateArticle(parseInt(articleId), { title, content });

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: updatedArticle
    });

  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteArticle(parseInt(articleId));

    if (!result) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Отправляем callback в SMI проект что статья полностью удалена
    if (result.arrival_token && process.env.SMI_CALLBACK_URL) {
      try {
        await fetch(process.env.SMI_CALLBACK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.CALENDAR_API_KEY || ''
          },
          body: JSON.stringify({
            arrival_token: result.arrival_token,
            status: 'deleted',
            message: 'Article permanently deleted from calendar app'
          })
        });
      } catch (callbackError) {
        console.error('Failed to send deletion callback to SMI:', callbackError);
        // Не прерываем выполнение, если callback не удался
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article', details: error.message },
      { status: 500 }
    );
  }
}
