/**
 * API Route: /api/seo/keywords
 * Управление ключевыми словами для SEO анализа
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';
import { getDataForSeoClient } from '@/lib/dataforseo/client';
import { BATCH_CONFIG } from '@/lib/dataforseo/config';
import type { SubmitKeywordsRequest, SubmitKeywordsResponse } from '@/lib/dataforseo/types';

/**
 * POST /api/seo/keywords
 * Отправка ключевых слов на анализ в DataForSEO
 */
export async function POST(request: NextRequest) {
  console.log('[SEO API] ===== POST REQUEST RECEIVED - CODE VERSION: 2026-02-28-v3 =====');
  
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
    const body: SubmitKeywordsRequest = await request.json();
    const { keywords, project_id, category_id } = body;
    
    // Получаем регион и язык из проекта
    let location_code: string;
    let location_name: string;
    let language: string = 'en'; // Дефолтный язык
    
    if (project_id) {
      const projectResult = await sql`
        SELECT search_location_code FROM projects WHERE id = ${project_id}
      `;
      if (projectResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      const projectLocationCode = projectResult.rows[0].search_location_code || 2840;
      location_code = String(projectLocationCode);
      
      // Определяем название региона и язык по региону
      const locationConfig: { [key: number]: { name: string; language: string } } = {
        2840: { name: 'United States', language: 'en' },
        2144: { name: 'Sri Lanka', language: 'en' },
        2826: { name: 'United Kingdom', language: 'en' },
        2643: { name: 'Russia', language: 'ru' },
        2124: { name: 'Canada', language: 'en' },
        2036: { name: 'Australia', language: 'en' },
      };
      
      const config = locationConfig[projectLocationCode] || locationConfig[2840];
      location_name = config.name;
      language = config.language;
      
      console.log(`[SEO] Using settings from project ${project_id}: language=${language}, location=${location_code} (${location_name})`);
    } else {
      return NextResponse.json(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Валидация
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    if (keywords.length > BATCH_CONFIG.MAX_KEYWORDS) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Maximum ${BATCH_CONFIG.MAX_KEYWORDS} keywords per request` 
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

    // Проверяем project_id если указан
    if (project_id) {
      const projectCheck = await sql`
        SELECT id FROM projects 
        WHERE id = ${project_id} AND user_id = ${userId}
      `;
      if (projectCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    }

    console.log(`[SEO] Processing ${keywords.length} keywords for user ${userId}`);

    // Сохраняем ключевые слова в БД
    const keywordIds: number[] = [];
    const taskIds: number[] = [];

    for (const keyword of keywords) {
      // Создаем запись для ключевого слова
      const keywordResult = await sql`
        INSERT INTO seo_keywords (
          user_id, 
          project_id,
          category_id,
          keyword, 
          language, 
          location_code, 
          location_name, 
          status
        )
        VALUES (
          ${userId}, 
          ${project_id || null},
          ${category_id || null},
          ${keyword.trim()}, 
          ${language}, 
          ${location_code}, 
          ${location_name}, 
          'processing'
        )
        RETURNING id
      `;
      const keywordId = keywordResult.rows[0].id;
      keywordIds.push(keywordId);

      // Создаем задачи для каждого endpoint
      const endpointTypes = ['keywords_data', 'serp_analysis', 'keyword_suggestions'];
      
      for (const endpointType of endpointTypes) {
        const taskResult = await sql`
          INSERT INTO seo_tasks (
            keyword_id, 
            endpoint_type, 
            status
          )
          VALUES (
            ${keywordId}, 
            ${endpointType}, 
            'pending'
          )
          RETURNING id
        `;
        taskIds.push(taskResult.rows[0].id);
      }
    }

    // Запускаем обработку в фоне (не блокируем ответ)
    processKeywordsInBackground(keywords, language, parseInt(location_code), keywordIds, userId)
      .catch(error => {
        console.error('[SEO] Background processing failed:', error);
      });

    const response: SubmitKeywordsResponse = {
      success: true,
      keyword_ids: keywordIds,
      task_ids: taskIds,
      message: `Successfully queued ${keywords.length} keywords for analysis`,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('[SEO] POST /api/seo/keywords error:', error);
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
 * GET /api/seo/keywords
 * Получение списка ключевых слов
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

    // Параметры запроса
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Увеличено с 50 до 1000
    const offset = parseInt(searchParams.get('offset') || '0');

    // Строим запрос с метриками из seo_results
    let query = `
      SELECT 
        k.*,
        p.name as project_name,
        sk.keyword as source_keyword_name,
        r.search_volume,
        r.cpc,
        r.competition,
        r.result_data->>'search_intent' as search_intent,
        COUNT(DISTINCT t.id) as tasks_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
      FROM seo_keywords k
      LEFT JOIN projects p ON k.project_id = p.id
      LEFT JOIN seo_keywords sk ON k.source_keyword_id = sk.id
      LEFT JOIN seo_tasks t ON k.id = t.keyword_id
      LEFT JOIN seo_results r ON (k.id = r.keyword_id AND r.endpoint_type = 'keywords_data')
      WHERE k.user_id = ${userId}
    `;

    if (projectId) {
      query += ` AND k.project_id = ${parseInt(projectId)}`;
    }

    if (status) {
      query += ` AND k.status = '${status}'`;
    }

    query += `
      GROUP BY k.id, p.name, sk.keyword, r.search_volume, r.cpc, r.competition, r.result_data
      ORDER BY k.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await sql.query(query);

    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM seo_keywords 
      WHERE user_id = ${userId}
    `;
    if (projectId) {
      countQuery += ` AND project_id = ${parseInt(projectId)}`;
    }
    if (status) {
      countQuery += ` AND status = '${status}'`;
    }

    const countResult = await sql.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      keywords: result.rows,
      total,
    });

  } catch (error: any) {
    console.error('[SEO] GET /api/seo/keywords error:', error);
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
 * Фоновая обработка ключевых слов через DataForSEO API
 */
async function processKeywordsInBackground(
  keywords: string[],
  language: string,
  locationCode: number,
  keywordIds: number[],
  userId: number
): Promise<void> {
  const client = getDataForSeoClient();

  try {
    console.log(`[SEO] Starting background processing for ${keywords.length} keywords`);

    // Обрабатываем каждое ключевое слово
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      const keywordId = keywordIds[i];

      try {
        let completedTasks = 0;
        let failedTasks = 0;

        console.log(`[SEO] About to call processKeywordsData for: ${keyword}`);

        // 1. Keywords Data (основной метод - обязательный)
        try {
          await processKeywordsData(client, keyword, language, locationCode, keywordId);
          completedTasks++;
          console.log(`[SEO] processKeywordsData completed successfully for: ${keyword}`);
        } catch (error: any) {
          console.error(`[SEO] Keywords Data FAILED for ${keyword}:`, error);
          console.error(`[SEO] Error message:`, error?.message);
          console.error(`[SEO] Error stack:`, error?.stack);
          failedTasks++;
        }

        // 2. SERP Analysis (опциональный - может быть недоступен в плане)
        try {
          await processSerpAnalysis(client, keyword, language, locationCode, keywordId);
          completedTasks++;
        } catch (error: any) {
          const errorStatus = error?.response?.status;
          const errorMessage = error?.response?.data?.status_message || error?.message || 'SERP API not available';
          
          // 404 означает, что endpoint не доступен в текущем плане
          if (errorStatus === 404) {
            console.log(`[SEO] SERP Analysis not available in current plan for ${keyword} (404)`);
          } else {
            console.error(`[SEO] SERP Analysis failed for ${keyword}:`, error?.response?.data || error?.message);
          }
          
          // Помечаем задачу как failed, но продолжаем
          const taskResult = await sql`
            SELECT id FROM seo_tasks 
            WHERE keyword_id = ${keywordId} AND endpoint_type = 'serp_analysis'
            LIMIT 1
          `;
          if (taskResult.rows.length > 0) {
            await sql`
              UPDATE seo_tasks 
              SET status = 'failed', 
                  completed_at = NOW(),
                  error_message = ${errorStatus === 404 ? 'API not available in current plan' : errorMessage}
              WHERE id = ${taskResult.rows[0].id}
            `;
          }
          failedTasks++;
        }

        // 3. Keyword Suggestions (опциональный)
        try {
          await processKeywordSuggestions(client, keyword, language, locationCode, keywordId);
          completedTasks++;
        } catch (error: any) {
          const errorStatus = error?.response?.status;
          const errorMessage = error?.response?.data?.status_message || error?.message || 'Keyword Suggestions API not available';
          
          // 404 означает, что endpoint не доступен в текущем плане
          if (errorStatus === 404) {
            console.log(`[SEO] Keyword Suggestions not available in current plan for ${keyword} (404)`);
          } else {
            console.error(`[SEO] Keyword Suggestions failed for ${keyword}:`, error?.response?.data || error?.message);
          }
          
          // Помечаем задачу как failed, но продолжаем
          const taskResult = await sql`
            SELECT id FROM seo_tasks 
            WHERE keyword_id = ${keywordId} AND endpoint_type = 'keyword_suggestions'
            LIMIT 1
          `;
          if (taskResult.rows.length > 0) {
            await sql`
              UPDATE seo_tasks 
              SET status = 'failed', 
                  completed_at = NOW(),
                  error_message = ${errorStatus === 404 ? 'API not available in current plan' : errorMessage}
              WHERE id = ${taskResult.rows[0].id}
            `;
          }
          failedTasks++;
        }

        // Обновляем статус ключевого слова (completed если хотя бы 1 задача успешна, иначе failed)
        const finalStatus = completedTasks > 0 ? 'completed' : 'failed';
        await sql`
          UPDATE seo_keywords 
          SET status = ${finalStatus}, updated_at = NOW()
          WHERE id = ${keywordId}
        `;

        console.log(`[SEO] Completed processing for keyword: ${keyword} (${completedTasks}/${completedTasks + failedTasks} tasks successful)`);

      } catch (error) {
        console.error(`[SEO] Error processing keyword ${keyword}:`, error);
        
        // Помечаем как failed
        await sql`
          UPDATE seo_keywords 
          SET status = 'failed', updated_at = NOW()
          WHERE id = ${keywordId}
        `;
      }
    }

    console.log(`[SEO] Background processing completed`);

  } catch (error) {
    console.error('[SEO] Background processing failed:', error);
    throw error;
  }
}

// Helper функции для обработки каждого endpoint

async function processKeywordsData(
  client: any,
  keyword: string,
  language: string,
  locationCode: number,
  keywordId: number
) {
  console.log(`[SEO] processKeywordsData started for: ${keyword}`);
  
  const taskResult = await sql`
    SELECT id FROM seo_tasks 
    WHERE keyword_id = ${keywordId} AND endpoint_type = 'keywords_data'
    LIMIT 1
  `;
  const taskId = taskResult.rows[0].id;

  await sql`
    UPDATE seo_tasks SET status = 'processing' WHERE id = ${taskId}
  `;

  console.log(`[SEO] Using Keywords Data API (Google Ads) for: ${keyword}`);
  
  // Use Keywords Data API (Google Ads Search Volume)
  // This is the main API endpoint that should be available in all plans
  const response = await client.getKeywordsData({
    keywords: [keyword],
    language_code: language,
    location_code: locationCode,
  });

  console.log(`[SEO] Full API Response:`, JSON.stringify(response, null, 2));
  
  const data = response.tasks[0]?.result?.[0];
  if (data) {
    const hasData = data.search_volume !== null || data.cpc !== null || data.competition_index !== null;
    
    console.log(`[SEO] Keywords Data API success! Data:`, { 
      search_volume: data.search_volume, 
      cpc: data.cpc,
      competition_index: data.competition_index,
      hasData: hasData,
      note: hasData ? 'Data available' : 'No data - keyword may be too specific or have low search volume'
    });
    
    // Convert Google Ads competition index to 0-1 scale
    const competitionValue = data.competition_index !== undefined 
      ? data.competition_index / 100  // Google Ads returns 0-100, convert to 0-1
      : null;
    
    await sql`
      INSERT INTO seo_results (
        keyword_id, task_id, endpoint_type, result_data,
        search_volume, cpc, competition
      )
      VALUES (
        ${keywordId}, ${taskId}, 'keywords_data', ${JSON.stringify(data)},
        ${data.search_volume || null}, ${data.cpc || null}, ${competitionValue}
      )
    `;
    
    // If no data available, log a helpful message
    if (!hasData) {
      console.log(`[SEO] ⚠️  No metrics available for "${keyword}". This keyword may be:
        - Too specific (try shorter variations)
        - Very low search volume (< 10 searches/month)
        - Not tracked by Google Ads in this region
        Suggestion: Try breaking it into shorter keywords like "sri lanka apartment" or "digital nomad"`);
    }
  } else {
    console.log(`[SEO] Keywords Data API returned no data for keyword: ${keyword}`);
  }

  await sql`
    UPDATE seo_tasks SET status = 'completed', completed_at = NOW()
    WHERE id = ${taskId}
  `;
}

async function processSerpAnalysis(
  client: any,
  keyword: string,
  language: string,
  locationCode: number,
  keywordId: number
) {
  const taskResult = await sql`
    SELECT id FROM seo_tasks 
    WHERE keyword_id = ${keywordId} AND endpoint_type = 'serp_analysis'
    LIMIT 1
  `;
  const taskId = taskResult.rows[0].id;

  await sql`
    UPDATE seo_tasks SET status = 'processing' WHERE id = ${taskId}
  `;

  const response = await client.getSerpAnalysis({
    keyword,
    language_code: language,
    location_code: locationCode,
  });

  const serpData = response.tasks[0]?.result?.[0];
  if (serpData) {
    const resultInsert = await sql`
      INSERT INTO seo_results (
        keyword_id, task_id, endpoint_type, result_data
      )
      VALUES (
        ${keywordId}, ${taskId}, 'serp_analysis', ${JSON.stringify(serpData)}
      )
      RETURNING id
    `;
    const resultId = resultInsert.rows[0].id;

    // Сохраняем топ-10 позиций
    const items = serpData.items?.slice(0, 10) || [];
    for (const item of items) {
      if (item.type === 'organic') {
        await sql`
          INSERT INTO seo_serp_positions (
            result_id, keyword_id, position, url, title, description, domain
          )
          VALUES (
            ${resultId}, ${keywordId}, ${item.rank_absolute},
            ${item.url || null}, ${item.title || null}, 
            ${item.description || null}, ${item.domain || null}
          )
        `;
      }
    }
  }

  await sql`
    UPDATE seo_tasks SET status = 'completed', completed_at = NOW()
    WHERE id = ${taskId}
  `;
}

async function processKeywordSuggestions(
  client: any,
  keyword: string,
  language: string,
  locationCode: number,
  keywordId: number
) {
  console.log(`[SEO] processKeywordSuggestions started for: ${keyword}`);
  
  const taskResult = await sql`
    SELECT id FROM seo_tasks 
    WHERE keyword_id = ${keywordId} AND endpoint_type = 'keyword_suggestions'
    LIMIT 1
  `;
  const taskId = taskResult.rows[0].id;

  await sql`
    UPDATE seo_tasks SET status = 'processing' WHERE id = ${taskId}
  `;

  const response = await client.getKeywordSuggestions({
    keyword,
    language_code: language,
    location_code: locationCode,
    limit: 700, // Увеличено с 50 до 700 для получения большего количества идей
  });

  console.log(`[SEO] Keyword Suggestions API Response:`, {
    status_code: response.status_code,
    tasks_count: response.tasks_count,
    result_count: response.tasks?.[0]?.result?.length || 0,
  });

  const suggestions = response.tasks[0]?.result || [];
  if (suggestions.length > 0) {
    console.log(`[SEO] ✅ Got ${suggestions.length} keyword suggestions for "${keyword}"`);
    console.log(`[SEO] Sample suggestions:`, suggestions.slice(0, 5).map((s: any) => ({
      keyword: s.keyword,
      search_volume: s.search_volume,
      cpc: s.cpc,
      competition_index: s.competition_index,
    })));
    
    // Сохраняем raw результаты
    await sql`
      INSERT INTO seo_results (
        keyword_id, task_id, endpoint_type, result_data
      )
      VALUES (
        ${keywordId}, ${taskId}, 'keyword_suggestions', ${JSON.stringify(suggestions)}
      )
    `;
    
    // 🆕 АВТОМАТИЧЕСКИ СОХРАНЯЕМ related keywords в таблицу seo_keywords
    console.log(`[SEO] 💾 Auto-saving ${suggestions.length} related keywords to seo_keywords table...`);
    
    // Получаем project_id и user_id из исходного ключевого слова
    const sourceKeywordResult = await sql`
      SELECT project_id, user_id, language, location_code 
      FROM seo_keywords 
      WHERE id = ${keywordId}
    `;
    const sourceKeyword = sourceKeywordResult.rows[0];
    
    let savedCount = 0;
    for (const suggestion of suggestions) {
      try {
        // Проверяем, не существует ли уже такое ключевое слово в этом проекте
        const existingCheck = await sql`
          SELECT id FROM seo_keywords 
          WHERE keyword = ${suggestion.keyword} 
          AND project_id = ${sourceKeyword.project_id}
        `;
        
        if (existingCheck.rows.length === 0) {
          // Сохраняем новое ключевое слово со связью к источнику
          await sql`
            INSERT INTO seo_keywords (
              keyword, language, location_code, user_id, project_id, source_keyword_id
            )
            VALUES (
              ${suggestion.keyword}, 
              ${sourceKeyword.language}, 
              ${sourceKeyword.location_code}, 
              ${sourceKeyword.user_id}, 
              ${sourceKeyword.project_id}, 
              ${keywordId}
            )
          `;
          
          // Сохраняем метрики из suggestion
          const newKeywordResult = await sql`
            SELECT id FROM seo_keywords 
            WHERE keyword = ${suggestion.keyword} 
            AND project_id = ${sourceKeyword.project_id}
            ORDER BY created_at DESC
            LIMIT 1
          `;
          const newKeywordId = newKeywordResult.rows[0].id;
          
          // Создаем задачу для нового ключевого слова
          const newTaskResult = await sql`
            INSERT INTO seo_tasks (keyword_id, endpoint_type, status)
            VALUES (${newKeywordId}, 'keywords_data', 'completed')
            RETURNING id
          `;
          const newTaskId = newTaskResult.rows[0].id;
          
          // Сохраняем результаты
          const competitionValue = suggestion.competition_index !== undefined 
            ? suggestion.competition_index / 100 
            : null;
            
          await sql`
            INSERT INTO seo_results (
              keyword_id, task_id, endpoint_type, result_data,
              search_volume, cpc, competition
            )
            VALUES (
              ${newKeywordId}, ${newTaskId}, 'keywords_data', ${JSON.stringify(suggestion)},
              ${suggestion.search_volume || null}, 
              ${suggestion.cpc || null}, 
              ${competitionValue}
            )
          `;
          
          savedCount++;
        }
      } catch (error) {
        console.error(`[SEO] Error saving related keyword "${suggestion.keyword}":`, error);
      }
    }
    
    console.log(`[SEO] ✅ Saved ${savedCount} new related keywords out of ${suggestions.length} suggestions`);
  } else {
    console.log(`[SEO] ⚠️  No keyword suggestions returned for "${keyword}"`);
  }

  await sql`
    UPDATE seo_tasks SET status = 'completed', completed_at = NOW()
    WHERE id = ${taskId}
  `;
  
  console.log(`[SEO] processKeywordSuggestions completed for: ${keyword}`);
}
