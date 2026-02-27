/**
 * API Route: /api/seo/semantic-cluster/[id]
 * Получение детальной информации о семантическом кластере
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

    // Получаем основную информацию о семкластере
    const clusterInfo = await sql`
      SELECT sc.*, p.name as project_name
      FROM seo_semantic_clusters sc
      LEFT JOIN projects p ON sc.project_id = p.id
      WHERE sc.id = ${clusterId} AND sc.user_id = ${userId}
    `;

    if (clusterInfo.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Semantic cluster not found' },
        { status: 404 }
      );
    }

    const cluster = clusterInfo.rows[0];

    // Получаем все кластеры (группы)
    const clusters = await sql`
      SELECT 
        c.*,
        COUNT(ck.id) as keywords_count
      FROM seo_clusters c
      LEFT JOIN seo_cluster_keywords ck ON c.id = ck.cluster_id
      WHERE c.semantic_cluster_id = ${clusterId}
      GROUP BY c.id
      ORDER BY c.total_search_volume DESC
    `;

    // Получаем ключевые слова для каждого кластера
    const clustersWithKeywords = await Promise.all(
      clusters.rows.map(async (c) => {
        const keywords = await sql`
          SELECT *
          FROM seo_cluster_keywords
          WHERE cluster_id = ${c.id}
          ORDER BY search_volume DESC
        `;

        return {
          ...c,
          keywords: keywords.rows,
        };
      })
    );

    return NextResponse.json({
      success: true,
      cluster: {
        ...cluster,
        clusters: clustersWithKeywords,
      },
    });

  } catch (error: any) {
    console.error(`[Semantic Cluster] GET /api/seo/semantic-cluster/${params.id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seo/semantic-cluster/[id]
 * Удаление семантического кластера
 */
export async function DELETE(
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
      SELECT id FROM seo_semantic_clusters
      WHERE id = ${clusterId} AND user_id = ${userId}
    `;

    if (clusterCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Semantic cluster not found or access denied' },
        { status: 404 }
      );
    }

    // Удаляем (каскадное удаление удалит все связанные данные)
    await sql`
      DELETE FROM seo_semantic_clusters WHERE id = ${clusterId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Semantic cluster deleted successfully',
    });

  } catch (error: any) {
    console.error(`[Semantic Cluster] DELETE /api/seo/semantic-cluster/${params.id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
