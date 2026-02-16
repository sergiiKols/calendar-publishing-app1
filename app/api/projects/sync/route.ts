import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProjectFromSMI } from '@/lib/db/client';

/**
 * POST /api/projects/sync
 * 
 * Endpoint для синхронизации проектов из SMI системы
 * Вызывается автоматически из SMI при создании проекта
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { external_project_id, name, description, color } = body;

    console.log('📥 Received project sync request from SMI:', {
      external_project_id,
      name,
      description: description?.substring(0, 50) || 'N/A',
      color: color || 'default'
    });

    // Валидация
    if (!external_project_id || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: external_project_id and name are required' 
        },
        { status: 400 }
      );
    }

    // Создание/обновление проекта
    // user_id = 1 - это дефолтный пользователь (можно сделать динамическим через auth)
    const project = await getOrCreateProjectFromSMI({
      external_project_id: external_project_id,
      name: name,
      description: description,
      color: color,
      user_id: 1
    });

    console.log('✅ Project synced to Calendar:', {
      calendar_project_id: project.id,
      external_project_id: project.external_project_id,
      name: project.name
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        external_project_id: project.external_project_id,
        name: project.name,
        description: project.description,
        color: project.color,
        synced_at: project.synced_at
      },
      message: `Project synced successfully: ${project.name}`
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error syncing project from SMI:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync project', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/sync
 * 
 * Информация о endpoint'е синхронизации
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/projects/sync',
    method: 'POST',
    description: 'Синхронизация проектов из SMI системы в Calendar App',
    required_fields: {
      external_project_id: 'number - ID проекта в SMI системе',
      name: 'string - Название проекта'
    },
    optional_fields: {
      description: 'string - Описание проекта',
      color: 'string - Цвет проекта в формате #RRGGBB'
    },
    example: {
      external_project_id: 5,
      name: 'Блог компании',
      description: 'Корпоративный блог',
      color: '#3B82F6'
    }
  });
}
