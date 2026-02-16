import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting projects migration...');
    
    // Создание таблицы projects
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ Table projects created');

    // Создание индекса
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, is_active)`;
    console.log('✓ Index idx_projects_user created');

    // Добавление project_id в calendar_events
    await sql`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE`;
    console.log('✓ Column project_id added to calendar_events');

    // Создание индекса для calendar_events.project_id
    await sql`CREATE INDEX IF NOT EXISTS idx_calendar_project ON calendar_events(project_id)`;
    console.log('✓ Index idx_calendar_project created');

    // Создание триггера для updated_at
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at'
        ) THEN
          CREATE TRIGGER update_projects_updated_at 
            BEFORE UPDATE ON projects 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `;
    console.log('✓ Trigger update_projects_updated_at created');

    // Создание дефолтного проекта для всех пользователей
    const defaultProjects = await sql`
      INSERT INTO projects (user_id, name, description, color)
      SELECT DISTINCT u.id, 'Default Project', 'Автоматически созданный проект', '#3B82F6'
      FROM users u
      WHERE NOT EXISTS (SELECT 1 FROM projects WHERE user_id = u.id)
      RETURNING *
    `;
    console.log(`✓ Created ${defaultProjects.rowCount} default projects`);

    // Привязываем существующие события к дефолтному проекту
    const updatedEvents = await sql`
      UPDATE calendar_events ce
      SET project_id = p.id
      FROM projects p
      JOIN users u ON p.user_id = u.id
      WHERE ce.project_id IS NULL
      AND p.name = 'Default Project'
      RETURNING ce.id
    `;
    console.log(`✓ Updated ${updatedEvents.rowCount} calendar events with default project`);

    return NextResponse.json({
      success: true,
      message: 'Projects migration completed successfully!',
      details: {
        defaultProjectsCreated: defaultProjects.rowCount,
        eventsUpdated: updatedEvents.rowCount
      }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message,
        hint: 'Check if all required tables exist'
      },
      { status: 500 }
    );
  }
}
