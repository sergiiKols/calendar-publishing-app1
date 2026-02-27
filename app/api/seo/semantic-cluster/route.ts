/**
 * API Route: /api/seo/semantic-cluster
 * Сбор семантического ядра (семкластера) из seed-ключей
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';
import { buildSemanticCluster } from '@/lib/dataforseo/labs-client';
import { clusterKeywordsFull, exportClustersToCSV } from '@/lib/dataforseo/clustering';
import { SEMANTIC_CLUSTER_CONFIG } from '@/lib/dataforseo/config';

/**
 * POST /api/seo/semantic-cluster
 * Создание семантического кластера из seed-ключей
 */
export async function POST(request: NextRequest) {
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

    // Парсим запрос
    const body = await request.json();
    const {
      seeds,
      language,
      location_code,
      location_name,
      project_id,
      target_size,
      competitor_domain,
      filters,
    } = body;

    // Валидация
    if (!seeds || !Array.isArray(seeds) || seeds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seeds array is required (1-5 keywords)' },
        { status: 400 }
      );
    }

    if (seeds.length > SEMANTIC_CLUSTER_CONFIG.MAX_SEED_KEYWORDS) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Maximum ${SEMANTIC_CLUSTER_CONFIG.MAX_SEED_KEYWORDS} seed keywords allowed` 
        },
        { status: 400 }
      );
    }

    if (!language || !location_code || !location_name) {
      return NextResponse.json(
        { success: false, error: 'Language and location are required' },
        { status: 400 }
      );
    }

    console.log(`[Semantic Cluster] User ${userId} building cluster from seeds:`, seeds);

    // Шаг 1: Сбор семантического ядра через Labs API
    const clusterData = await buildSemanticCluster({
      seeds,
      language_code: language,
      location_code: parseInt(location_code),
      targetSize: target_size || SEMANTIC_CLUSTER_CONFIG.TARGET_CLUSTER_SIZE,
      competitorDomain: competitor_domain,
    });

    console.log(`[Semantic Cluster] Collected ${clusterData.keywords.length} keywords`);

    // Шаг 2: Применяем фильтры если указаны
    let filteredKeywords = clusterData.keywords;

    if (filters) {
      filteredKeywords = filteredKeywords.filter(kw => {
        if (filters.min_search_volume && kw.search_volume < filters.min_search_volume) {
          return false;
        }
        if (filters.max_search_volume && kw.search_volume > filters.max_search_volume) {
          return false;
        }
        if (filters.min_cpc && kw.cpc < filters.min_cpc) {
          return false;
        }
        if (filters.max_cpc && kw.cpc > filters.max_cpc) {
          return false;
        }
        if (filters.max_keyword_difficulty && kw.keyword_difficulty > filters.max_keyword_difficulty) {
          return false;
        }
        if (filters.intents && filters.intents.length > 0 && !filters.intents.includes(kw.intent)) {
          return false;
        }
        return true;
      });

      console.log(`[Semantic Cluster] After filtering: ${filteredKeywords.length} keywords`);
    }

    // Шаг 3: Кластеризация
    const clusteredData = clusterKeywordsFull(filteredKeywords);

    console.log(`[Semantic Cluster] Created ${clusteredData.bySemantic.length} semantic clusters`);

    // Шаг 4: Сохраняем в БД
    // Создаем запись о семкластере
    const clusterRecord = await sql`
      INSERT INTO seo_semantic_clusters (
        user_id,
        project_id,
        name,
        seeds,
        language,
        location_code,
        location_name,
        total_keywords,
        total_search_volume,
        cluster_count,
        status
      )
      VALUES (
        ${userId},
        ${project_id || null},
        ${seeds.join(', ')},
        ${JSON.stringify(seeds)},
        ${language},
        ${location_code},
        ${location_name},
        ${filteredKeywords.length},
        ${clusteredData.summary.total_search_volume},
        ${clusteredData.summary.cluster_count},
        'completed'
      )
      RETURNING id
    `;

    const clusterRecordId = clusterRecord.rows[0].id;

    // Сохраняем каждый кластер
    for (const cluster of clusteredData.bySemantic) {
      const clusterDbRecord = await sql`
        INSERT INTO seo_clusters (
          semantic_cluster_id,
          cluster_id,
          cluster_name,
          dominant_intent,
          total_search_volume,
          avg_keyword_difficulty,
          keywords_count
        )
        VALUES (
          ${clusterRecordId},
          ${cluster.cluster_id},
          ${cluster.cluster_name},
          ${cluster.dominant_intent},
          ${cluster.total_search_volume},
          ${cluster.avg_keyword_difficulty},
          ${cluster.keywords.length}
        )
        RETURNING id
      `;

      const clusterDbId = clusterDbRecord.rows[0].id;

      // Сохраняем ключевые слова кластера
      for (const kw of cluster.keywords) {
        await sql`
          INSERT INTO seo_cluster_keywords (
            cluster_id,
            keyword,
            search_volume,
            cpc,
            competition,
            keyword_difficulty,
            intent,
            source
          )
          VALUES (
            ${clusterDbId},
            ${kw.keyword},
            ${kw.search_volume},
            ${kw.cpc},
            ${kw.competition},
            ${kw.keyword_difficulty},
            ${kw.intent},
            ${kw.source}
          )
        `;
      }
    }

    console.log(`[Semantic Cluster] Saved to database: cluster_id=${clusterRecordId}`);

    // Формируем ответ
    return NextResponse.json({
      success: true,
      cluster_id: clusterRecordId,
      summary: {
        total_keywords: filteredKeywords.length,
        total_found: clusterData.totalFound,
        total_search_volume: clusteredData.summary.total_search_volume,
        cluster_count: clusteredData.summary.cluster_count,
        intent_distribution: clusteredData.summary.intent_distribution,
        processing_time_ms: clusterData.processingTime,
      },
      clusters: clusteredData.bySemantic.map(c => ({
        cluster_id: c.cluster_id,
        cluster_name: c.cluster_name,
        keywords_count: c.keywords.length,
        total_search_volume: c.total_search_volume,
        avg_keyword_difficulty: c.avg_keyword_difficulty,
        dominant_intent: c.dominant_intent,
        top_keywords: c.keywords.slice(0, 5).map(kw => ({
          keyword: kw.keyword,
          search_volume: kw.search_volume,
          cpc: kw.cpc,
        })),
      })),
    });

  } catch (error: any) {
    console.error('[Semantic Cluster] API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seo/semantic-cluster
 * Получение списка семантических кластеров
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Получаем семантические кластеры
    let query = `
      SELECT 
        sc.*,
        p.name as project_name,
        COUNT(DISTINCT c.id) as clusters_count
      FROM seo_semantic_clusters sc
      LEFT JOIN projects p ON sc.project_id = p.id
      LEFT JOIN seo_clusters c ON sc.id = c.semantic_cluster_id
      WHERE sc.user_id = ${userId}
    `;

    if (projectId) {
      query += ` AND sc.project_id = ${parseInt(projectId)}`;
    }

    query += `
      GROUP BY sc.id, p.name
      ORDER BY sc.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await sql.query(query);

    return NextResponse.json({
      success: true,
      clusters: result.rows,
      total: result.rows.length,
    });

  } catch (error: any) {
    console.error('[Semantic Cluster] GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
