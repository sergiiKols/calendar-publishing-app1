/**
 * API endpoint для выполнения миграции базы данных
 * GET /api/db/migrate?secret=YOUR_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Проверка секретного ключа для безопасности
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== process.env.MIGRATION_SECRET && secret !== process.env.CALENDAR_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Running database migration...');

    // Добавляем колонку arrival_token если её нет
    const migrationSQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'inbox_articles' 
          AND column_name = 'arrival_token'
        ) THEN
          ALTER TABLE inbox_articles 
          ADD COLUMN arrival_token VARCHAR(255);
          
          RAISE NOTICE 'Column arrival_token added to inbox_articles table';
        ELSE
          RAISE NOTICE 'Column arrival_token already exists in inbox_articles table';
        END IF;
      END $$;
    `;

    await sql.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      changes: ['Added arrival_token column to inbox_articles table']
    });

  } catch (error: any) {
    console.error('❌ Error running migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run migration', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
