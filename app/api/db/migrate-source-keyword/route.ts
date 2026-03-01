import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('🔄 Starting migration: add source_keyword_id to seo_keywords...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    });
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Добавить source_keyword_id
      console.log('📝 Adding source_keyword_id column...');
      await client.query(`
        ALTER TABLE seo_keywords 
        ADD COLUMN IF NOT EXISTS source_keyword_id INTEGER
      `);
      
      // 2. Создать индекс
      console.log('🔍 Creating index...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_seo_keywords_source 
        ON seo_keywords(source_keyword_id)
      `);
      
      // 3. Проверка
      console.log('🔍 Verifying column...');
      const checkResult = await client.query(`
        SELECT 
            column_name, 
            data_type, 
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'seo_keywords' 
        AND column_name = 'source_keyword_id'
      `);
      
      console.log('📋 Column found:', checkResult.rows);
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully',
        column: checkResult.rows[0]
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
