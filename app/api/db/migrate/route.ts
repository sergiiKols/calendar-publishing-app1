/**
 * API endpoint для выполнения миграции базы данных
 * GET /api/db/migrate?secret=YOUR_SECRET
 * GET /api/db/migrate?secret=YOUR_SECRET&create_admin=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

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

    const createAdmin = request.nextUrl.searchParams.get('create_admin');
    const changes: string[] = [];

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
    changes.push('Added arrival_token column to inbox_articles table (if not exists)');

    // Создаём админа если параметр create_admin=true
    if (createAdmin === 'true') {
      console.log('👤 Creating admin user...');
      
      const adminEmail = 'admin@calendar.app';
      const adminPassword = 'password123';
      const adminName = 'Admin';

      // Проверяем, существует ли админ
      const existingAdmin = await sql`
        SELECT id FROM users WHERE email = ${adminEmail}
      `;

      if (existingAdmin.rows.length === 0) {
        // Хешируем пароль
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Создаём админа
        await sql`
          INSERT INTO users (email, password_hash, name)
          VALUES (${adminEmail}, ${passwordHash}, ${adminName})
        `;

        changes.push(`Created admin user: ${adminEmail}`);
        console.log('✅ Admin user created!');
      } else {
        changes.push(`Admin user already exists: ${adminEmail}`);
        console.log('ℹ️  Admin user already exists');
      }
    }

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      changes: changes,
      admin_credentials: createAdmin === 'true' ? {
        email: 'admin@calendar.app',
        password: 'password123'
      } : undefined
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
