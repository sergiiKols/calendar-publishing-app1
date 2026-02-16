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
    const userIdRaw = (session.user as any).id;
    console.log('🆔 Raw User ID from session:', userIdRaw, 'type:', typeof userIdRaw);
    console.log('📋 Full session.user:', JSON.stringify(session.user, null, 2));
    
    if (!userIdRaw) {
      console.error('❌ UPDATED CODE: Invalid user ID:', userIdRaw);
      console.error('📋 Full session.user:', JSON.stringify(session.user, null, 2));
      return NextResponse.json(
        { error: 'UPDATED: Invalid user ID is undefined', message: 'Your session is missing user information. Please log out and log back in to refresh your session.' },
        { status: 400 }
      );
    }
    
    const userId = parseInt(userIdRaw);
    console.log('🆔 Parsed User ID:', userId, 'isNaN:', isNaN(userId));
    
    if (isNaN(userId)) {
      console.error('❌ Invalid user ID format:', userIdRaw);
      return NextResponse.json(
        { error: 'Invalid user session format' },
        { status: 400 }
      );
    }
    
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

    const userIdRaw = (session.user as any).id;
    if (!userIdRaw) {
      return NextResponse.json(
        { error: 'Invalid user ID: undefined', message: 'Your session is missing user information. Please log out and log back in to refresh your session.' },
        { status: 400 }
      );
    }
    const userId = parseInt(userIdRaw);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user session format' },
        { status: 400 }
      );
    }
    
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
