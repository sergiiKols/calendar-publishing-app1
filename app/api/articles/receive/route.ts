/**
 * API endpoint для приёма статей из SMI проекта
 * POST /api/articles/receive
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInboxArticle, getOrCreateProjectFromSMI } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received article submission request');
    
    // Проверка API ключа
    const apiKey = request.headers.get('X-API-Key');
    const envKey = process.env.CALENDAR_API_KEY;
    
    console.log('🔑 API Key check:', {
      received: apiKey ? 'present' : 'missing',
      expected: envKey ? 'configured' : 'NOT CONFIGURED'
    });
    
    // Если API ключ не настроен, пропускаем проверку (для тестирования)
    if (envKey && apiKey !== envKey) {
      console.error('❌ Unauthorized: API key mismatch');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API Key' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }

    console.log('📦 Request body:', {
      hasTitle: !!body.title,
      hasContent: !!body.content,
      hasImages: !!body.images,
      imagesCount: body.images?.length || 0,
      hasArrivalToken: !!body.arrival_token,
      hasProjectId: !!body.project_id,
      hasProjectName: !!body.project_name
    });

    const { title, content, images, source_project, arrival_token, project_id, project_name } = body;

    // Валидация
    if (!title || !content) {
      console.error('❌ Validation failed: missing title or content');
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Синхронизируем проект из SMI (если передан)
    let projectInfo = null;
    if (project_id && project_name) {
      console.log(`🔄 Syncing project from SMI: ID=${project_id}, Name=${project_name}`);
      try {
        projectInfo = await getOrCreateProjectFromSMI({
          external_project_id: project_id,
          name: project_name,
          user_id: 1 // TODO: получать из сессии
        });
        console.log(`✅ Project synced: ${projectInfo.name} (Calendar ID: ${projectInfo.id})`);
      } catch (error: any) {
        console.error('⚠️  Project sync failed:', error.message);
        // Продолжаем без проекта
      }
    }

    // Создаём статью в inbox
    console.log('💾 Creating article in database...');
    const article = await createInboxArticle({
      title,
      content,
      images: images || [],
      source_project: project_name || source_project || 'smi_unknown',
      arrival_token: arrival_token || null
    });

    console.log('✅ Article created successfully:', article.id);

    return NextResponse.json({
      success: true,
      arrival_marker: arrival_token, // Возвращаем маркер прибытия
      article: {
        id: article.id,
        title: article.title,
        status: article.status,
        created_at: article.created_at,
        arrival_token: article.arrival_token
      },
      project: projectInfo ? {
        id: projectInfo.id,
        external_id: projectInfo.external_project_id,
        name: projectInfo.name
      } : null
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error receiving article:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to receive article', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
