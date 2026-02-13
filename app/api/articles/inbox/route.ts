/**
 * API endpoint для получения статей из inbox
 * GET /api/articles/inbox?status=inbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInboxArticles } from '@/lib/db/client';

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
