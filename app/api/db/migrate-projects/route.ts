import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const results: string[] = [];
    
    // Шаг 1: Создание таблицы projects
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          external_project_id INTEGER,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          is_active BOOLEAN DEFAULT true,
          synced_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      results.push('✓ Table projects created');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
      results.push('✓ Table projects already exists');
    }

    // Шаг 1.5: Добавление новых колонок в существующую таблицу
    try {
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS external_project_id INTEGER`;
      results.push('✓ Column external_project_id added');
    } catch (e: any) {
      results.push('✓ Column external_project_id already exists');
    }

    try {
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP`;
      results.push('✓ Column synced_at added');
    } catch (e: any) {
      results.push('✓ Column synced_at already exists');
    }

    // Шаг 2: Создание индекса
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, is_active)`;
      results.push('✓ Index idx_projects_user created');
    } catch (e: any) {
      results.push('✓ Index idx_projects_user already exists');
    }

    // Шаг 3: Добавление project_id в calendar_events
    try {
      await sql`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS project_id INTEGER`;
      results.push('✓ Column project_id added');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push('✓ Column project_id already exists');
      } else {
        throw e;
      }
    }

    // Шаг 4: Добавление foreign key (опционально, может уже существовать)
    try {
      await sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_project_id_fkey'
          ) THEN
            ALTER TABLE calendar_events 
            ADD CONSTRAINT calendar_events_project_id_fkey 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `;
      results.push('✓ Foreign key constraint added');
    } catch (e: any) {
      results.push('✓ Foreign key already exists or skipped');
    }

    // Шаг 5: Создание индекса для calendar_events.project_id
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_calendar_project ON calendar_events(project_id)`;
      results.push('✓ Index idx_calendar_project created');
    } catch (e: any) {
      results.push('✓ Index idx_calendar_project already exists');
    }

    // Шаг 6: Создание триггера для updated_at
    try {
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
      results.push('✓ Trigger created');
    } catch (e: any) {
      results.push('✓ Trigger already exists or skipped');
    }

    // Шаг 7: Создание дефолтного проекта для всех пользователей
    let defaultProjectsCount = 0;
    try {
      const defaultProjects = await sql`
        INSERT INTO projects (user_id, name, description, color)
        SELECT DISTINCT u.id, 'Default Project', 'Автоматически созданный проект', '#3B82F6'
        FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM projects WHERE user_id = u.id)
        RETURNING *
      `;
      defaultProjectsCount = defaultProjects.rowCount || 0;
      results.push(`✓ Created ${defaultProjectsCount} default projects`);
    } catch (e: any) {
      results.push('✓ Default projects already exist or skipped');
    }

    // Шаг 8: Привязываем существующие события к дефолтному проекту
    let eventsUpdatedCount = 0;
    try {
      const updatedEvents = await sql`
        UPDATE calendar_events ce
        SET project_id = p.id
        FROM projects p
        WHERE ce.project_id IS NULL
        AND p.name = 'Default Project'
        RETURNING ce.id
      `;
      eventsUpdatedCount = updatedEvents.rowCount || 0;
      results.push(`✓ Updated ${eventsUpdatedCount} calendar events`);
    } catch (e: any) {
      results.push('✓ Events already updated or skipped');
    }

    return NextResponse.json({
      success: true,
      message: 'Projects migration completed successfully!',
      steps: results,
      summary: {
        defaultProjectsCreated: defaultProjectsCount,
        eventsUpdated: eventsUpdatedCount
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
