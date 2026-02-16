import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getProjectById, updateProject, deleteProject } from '@/lib/db/client';

// GET /api/projects/[id] - получить один проект
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Проверяем, что проект принадлежит пользователю
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
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - обновить проект
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);
    const existingProject = await getProjectById(projectId);
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Проверяем, что проект принадлежит пользователю
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
    if (existingProject.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color, is_active } = body;

    const project = await updateProject(projectId, {
      name,
      description,
      color,
      is_active
    });
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - удалить проект
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);
    const existingProject = await getProjectById(projectId);
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Проверяем, что проект принадлежит пользователю
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
    if (existingProject.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const project = await deleteProject(projectId);
    
    return NextResponse.json({ 
      message: 'Project deleted successfully',
      project 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
