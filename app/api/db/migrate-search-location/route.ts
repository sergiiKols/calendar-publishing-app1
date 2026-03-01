import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/sql';

/**
 * API для выполнения миграции search_location_code
 * GET /api/db/migrate-search-location
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Начало миграции: добавление search_location_code в projects...');

    // Проверяем существует ли уже поле
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'search_location_code'
    `;

    if (checkColumn.rows.length > 0) {
      console.log('✅ Поле search_location_code уже существует');
      return NextResponse.json({
        success: true,
        message: 'Field search_location_code already exists',
        alreadyExists: true
      });
    }

    // Добавляем поле search_location_code
    await sql`
      ALTER TABLE projects 
      ADD COLUMN search_location_code INTEGER DEFAULT 2840
    `;

    console.log('✅ Поле search_location_code добавлено');

    // Создаем индекс
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_location 
      ON projects(search_location_code)
    `;

    console.log('✅ Индекс создан');

    // Обновляем существующие проекты
    const updateResult = await sql`
      UPDATE projects 
      SET search_location_code = 2840 
      WHERE search_location_code IS NULL
    `;

    console.log(`✅ Обновлено проектов: ${updateResult.count}`);

    // Проверяем результат
    const checkResult = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'search_location_code'
    `;

    // Получаем список проектов
    const projects = await sql`
      SELECT id, name, search_location_code 
      FROM projects 
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      columnInfo: checkResult.rows[0],
      updatedCount: updateResult.count,
      sampleProjects: projects.rows
    });

  } catch (error: any) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
