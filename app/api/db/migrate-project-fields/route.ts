import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('🔄 Starting migration: add description and color to projects...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    });
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Добавить description
      console.log('📝 Adding description column...');
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS description TEXT
      `);
      
      // 2. Добавить color
      console.log('🎨 Adding color column...');
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'
      `);
      
      // 3. Обновить существующие проекты (установить цвет по умолчанию)
      console.log('🔄 Updating existing projects with default color...');
      const updateResult = await client.query(`
        UPDATE projects 
        SET color = '#3B82F6' 
        WHERE color IS NULL OR color = ''
      `);
      console.log(`✅ Updated ${updateResult.rowCount} projects with default color`);
      
      // 4. Проверить и обновить search_location_code если нужно
      console.log('🔄 Updating search_location_code for old projects...');
      const updateLocationResult = await client.query(`
        UPDATE projects 
        SET search_location_code = 2840 
        WHERE search_location_code IS NULL
      `);
      console.log(`✅ Updated ${updateLocationResult.rowCount} projects with default location`);
      
      // 4. Проверка
      console.log('🔍 Verifying columns...');
      const checkResult = await client.query(`
        SELECT 
            column_name, 
            data_type, 
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name IN ('description', 'color', 'search_location_code')
        ORDER BY column_name
      `);
      
      console.log('📋 Columns found:', checkResult.rows);
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully',
        columns: checkResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
