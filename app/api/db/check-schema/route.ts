import { NextResponse } from 'next/server';
import pool from '@/lib/db/client';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Проверка всех колонок в таблице projects
      const projectsColumns = await client.query(`
        SELECT 
            column_name, 
            data_type, 
            column_default,
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        ORDER BY ordinal_position
      `);
      
      // Проверка всех колонок в таблице calendar_events
      const eventsColumns = await client.query(`
        SELECT 
            column_name, 
            data_type, 
            column_default,
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        ORDER BY ordinal_position
      `);
      
      // Проверка индексов
      const indexes = await client.query(`
        SELECT 
            tablename,
            indexname, 
            indexdef 
        FROM pg_indexes 
        WHERE tablename IN ('projects', 'calendar_events')
        ORDER BY tablename, indexname
      `);
      
      return NextResponse.json({ 
        success: true,
        tables: {
          projects: {
            columns: projectsColumns.rows,
            hasDescription: projectsColumns.rows.some((r: any) => r.column_name === 'description'),
            hasColor: projectsColumns.rows.some((r: any) => r.column_name === 'color'),
            hasSearchLocation: projectsColumns.rows.some((r: any) => r.column_name === 'search_location_code'),
          },
          calendar_events: {
            columns: eventsColumns.rows
          }
        },
        indexes: indexes.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('❌ Schema check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}
