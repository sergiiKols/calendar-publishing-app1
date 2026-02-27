/**
 * API Route: /api/seo/semantic-cluster/[id]/export
 * Экспорт семантического кластера в CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const clusterId = parseInt(params.id);

    // Проверяем права доступа
    const clusterCheck = await sql`
      SELECT name FROM seo_semantic_clusters
      WHERE id = ${clusterId} AND user_id = ${userId}
    `;

    if (clusterCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Semantic cluster not found' },
        { status: 404 }
      );
    }

    const clusterName = clusterCheck.rows[0].name;

    // Получаем все данные для экспорта
    const data = await sql`
      SELECT 
        c.cluster_id,
        c.cluster_name,
        c.dominant_intent,
        c.total_search_volume as cluster_search_volume,
        c.avg_keyword_difficulty as cluster_difficulty,
        ck.keyword,
        ck.search_volume,
        ck.cpc,
        ck.competition,
        ck.keyword_difficulty,
        ck.intent,
        ck.source
      FROM seo_clusters c
      JOIN seo_cluster_keywords ck ON c.id = ck.cluster_id
      WHERE c.semantic_cluster_id = ${clusterId}
      ORDER BY c.cluster_id, ck.search_volume DESC
    `;

    // Формируем CSV
    const lines: string[] = [];
    
    // Header
    lines.push([
      'Cluster ID',
      'Cluster Name',
      'Dominant Intent',
      'Cluster Search Volume',
      'Cluster Difficulty',
      'Keyword',
      'Search Volume',
      'CPC',
      'Competition',
      'Keyword Difficulty',
      'Intent',
      'Source',
    ].join(','));

    // Data
    data.rows.forEach(row => {
      lines.push([
        row.cluster_id,
        `"${row.cluster_name}"`,
        row.dominant_intent,
        row.cluster_search_volume,
        row.cluster_difficulty,
        `"${row.keyword}"`,
        row.search_volume,
        row.cpc?.toFixed(2) || 0,
        row.competition?.toFixed(2) || 0,
        row.keyword_difficulty || 0,
        row.intent,
        row.source,
      ].join(','));
    });

    const csv = lines.join('\n');

    // Возвращаем CSV файл
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="semantic-cluster-${clusterName.replace(/[^a-zA-Z0-9]/g, '-')}.csv"`,
      },
    });

  } catch (error: any) {
    console.error(`[Semantic Cluster] Export error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
