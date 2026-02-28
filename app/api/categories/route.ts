/**
 * API Route: /api/categories
 * Управление направлениями (категориями) проектов
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories?project_id=X
 * Получение списка направлений проекта
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userId = userResult.rows[0].id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'project_id is required' }, { status: 400 });
    }

    // Проверяем доступ к проекту
    const projectCheck = await sql`
      SELECT id FROM projects WHERE id = ${parseInt(projectId)} AND user_id = ${userId}
    `;
    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Получаем направления с количеством ключевых слов
    const categories = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT k.id) as keywords_count,
        COUNT(DISTINCT sc.id) as clusters_count
      FROM project_categories c
      LEFT JOIN seo_keywords k ON c.id = k.category_id
      LEFT JOIN seo_semantic_clusters sc ON c.id = sc.category_id
      WHERE c.project_id = ${parseInt(projectId)} AND c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order, c.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      categories: categories.rows,
    });
  } catch (error: any) {
    console.error('[Categories] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Создание нового направления
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userId = userResult.rows[0].id;

    const body = await request.json();
    const { project_id, name, description, color } = body;

    if (!project_id || !name) {
      return NextResponse.json(
        { success: false, error: 'project_id and name are required' },
        { status: 400 }
      );
    }

    // Проверяем доступ к проекту
    const projectCheck = await sql`
      SELECT id FROM projects WHERE id = ${project_id} AND user_id = ${userId}
    `;
    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Создаём направление
    const result = await sql`
      INSERT INTO project_categories (project_id, name, description, color)
      VALUES (${project_id}, ${name}, ${description || null}, ${color || '#3B82F6'})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      category: result.rows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Categories] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
