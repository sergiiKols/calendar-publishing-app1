import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sql } from '@/lib/db/sql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 GET /api/db/get-user-projects - Direct DB query');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'No user ID in session' }, { status: 400 });
    }

    // Прямой запрос к базе данных
    const result = await sql`
      SELECT * FROM projects 
      WHERE user_id = ${parseInt(userId)} AND is_active = true
      ORDER BY created_at DESC
    `;
    
    console.log('📦 Projects found:', result.rows.length);
    
    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error.message },
      { status: 500 }
    );
  }
}
