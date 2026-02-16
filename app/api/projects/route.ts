import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createProject, getProjects } from '@/lib/db/client';

// GET /api/projects - получить все проекты пользователя
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/projects - Fetching projects...');
    const session = await getServerSession(authOptions);
    
    console.log('👤 Session:', { hasSession: !!session, email: session?.user?.email });
    
    if (!session?.user?.email) {
      console.warn('⚠️ Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем user_id из сессии
    const userId = (session.user as any).id;
    console.log('🆔 User ID:', userId);
    
    const projects = await getProjects(userId);
    console.log('📦 Projects fetched:', { count: projects.length, projects });
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - создать новый проект
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    
    const { name, description, color } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await createProject({
      user_id: userId,
      name,
      description,
      color: color || '#3B82F6'
    });
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
