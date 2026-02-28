/**
 * API Route: /api/categories/[id]
 * Управление конкретным направлением
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/categories/[id]
 * Обновление направления
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const categoryId = parseInt(params.id);
    const body = await request.json();
    const { name, description, color } = body;

    // Проверяем доступ к направлению через проект
    const accessCheck = await sql`
      SELECT c.id 
      FROM project_categories c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = ${categoryId} AND p.user_id = ${userId}
    `;
    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Обновляем направление
    const result = await sql`
      UPDATE project_categories
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        color = COALESCE(${color}, color),
        updated_at = NOW()
      WHERE id = ${categoryId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      category: result.rows[0],
    });
  } catch (error: any) {
    console.error('[Categories] PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Удаление направления
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const categoryId = parseInt(params.id);

    // Проверяем доступ к направлению через проект
    const accessCheck = await sql`
      SELECT c.id 
      FROM project_categories c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = ${categoryId} AND p.user_id = ${userId}
    `;
    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Удаляем направление (ON DELETE SET NULL очистит связи)
    await sql`DELETE FROM project_categories WHERE id = ${categoryId}`;

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('[Categories] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
