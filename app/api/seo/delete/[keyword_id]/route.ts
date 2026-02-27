/**
 * API Route: /api/seo/delete/[keyword_id]
 * Удаление ключевого слова и всех связанных данных
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyword_id: string } }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем данные пользователя
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    const userId = userResult.rows[0].id;

    const keywordId = parseInt(params.keyword_id);

    // Проверяем что ключевое слово принадлежит пользователю
    const keywordCheck = await sql`
      SELECT id FROM seo_keywords
      WHERE id = ${keywordId} AND user_id = ${userId}
    `;

    if (keywordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword not found or access denied' },
        { status: 404 }
      );
    }

    // Удаляем ключевое слово (каскадное удаление удалит связанные данные)
    await sql`
      DELETE FROM seo_keywords WHERE id = ${keywordId}
    `;

    console.log(`[SEO] Deleted keyword ${keywordId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Keyword deleted successfully',
    });

  } catch (error: any) {
    console.error(`[SEO] DELETE /api/seo/delete/${params.keyword_id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
