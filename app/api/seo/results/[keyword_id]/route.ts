/**
 * API Route: /api/seo/results/[keyword_id]
 * Получение результатов анализа для конкретного ключевого слова
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import type { GetKeywordResultsResponse } from '@/lib/dataforseo/types';

export async function GET(
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

    // Получаем информацию о ключевом слове
    const keywordResult = await sql`
      SELECT k.*, p.name as project_name
      FROM seo_keywords k
      LEFT JOIN projects p ON k.project_id = p.id
      WHERE k.id = ${keywordId} AND k.user_id = ${userId}
    `;

    if (keywordResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword not found' },
        { status: 404 }
      );
    }

    const keyword = keywordResult.rows[0];

    // Получаем все результаты для этого ключевого слова
    const resultsData = await sql`
      SELECT 
        r.*,
        t.endpoint_type,
        t.status as task_status
      FROM seo_results r
      JOIN seo_tasks t ON r.task_id = t.id
      WHERE r.keyword_id = ${keywordId}
      ORDER BY r.created_at DESC
    `;

    // Получаем SERP позиции
    const serpPositions = await sql`
      SELECT *
      FROM seo_serp_positions
      WHERE keyword_id = ${keywordId}
      ORDER BY position ASC
    `;

    // Форматируем результаты
    const results: any = {};

    for (const row of resultsData.rows) {
      const endpointType = row.endpoint_type;
      const data = row.result_data;

      if (endpointType === 'keywords_data') {
        results.keywords_data = {
          search_volume: data.search_volume || 0,
          cpc: data.cpc || 0,
          competition: data.competition || 0,
          competition_level: data.competition_level || 'UNKNOWN',
          monthly_searches: data.monthly_searches || [],
          low_top_of_page_bid: data.low_top_of_page_bid || 0,
          high_top_of_page_bid: data.high_top_of_page_bid || 0,
        };
      } else if (endpointType === 'serp_analysis') {
        results.serp_analysis = {
          total_results: data.se_results_count || 0,
          items_count: data.items_count || 0,
          top_positions: serpPositions.rows.map((pos: any) => ({
            position: pos.position,
            title: pos.title,
            url: pos.url,
            domain: pos.domain,
            description: pos.description,
          })),
        };
      } else if (endpointType === 'keyword_suggestions') {
        // data это массив предложений
        results.keyword_suggestions = {
          suggestions: Array.isArray(data) ? data.slice(0, 20).map((item: any) => ({
            keyword: item.keyword,
            search_volume: item.search_volume || 0,
            cpc: item.cpc || 0,
            competition: item.competition || 0,
            competition_level: item.competition_level || 'UNKNOWN',
          })) : [],
        };
      }
    }

    const response: GetKeywordResultsResponse = {
      success: true,
      keyword,
      results,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`[SEO] GET /api/seo/results/${params.keyword_id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
