import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/sql';

export async function GET() {
  try {
    // Check keywords
    const keywords = await sql`
      SELECT id, keyword, status, created_at 
      FROM seo_keywords 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    // Check results
    const results = await sql`
      SELECT 
        sr.id, 
        sk.keyword, 
        sr.search_volume, 
        sr.cpc, 
        sr.competition,
        sr.endpoint_type,
        sr.created_at
      FROM seo_results sr
      JOIN seo_keywords sk ON sr.keyword_id = sk.id
      ORDER BY sr.created_at DESC 
      LIMIT 10
    `;
    
    // Check tasks
    const tasks = await sql`
      SELECT 
        st.id,
        sk.keyword,
        st.endpoint_type,
        st.status,
        st.error_message,
        st.created_at
      FROM seo_tasks st
      JOIN seo_keywords sk ON st.keyword_id = sk.id
      ORDER BY st.created_at DESC
      LIMIT 15
    `;
    
    return NextResponse.json({
      success: true,
      data: {
        keywords: keywords.rows,
        results: results.rows,
        tasks: tasks.rows,
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
