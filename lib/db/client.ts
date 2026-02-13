import { sql } from '@vercel/postgres';

/**
 * Database client для работы с Vercel Postgres
 */

// ================================
// USERS
// ================================

export async function createUser(email: string, passwordHash: string, name?: string) {
  const result = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id, email, name, created_at
  `;
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result.rows[0];
}

// ================================
// INBOX ARTICLES
// ================================

export async function createInboxArticle(data: {
  title: string;
  content: string;
  images?: string[];
  source_project?: string;
  arrival_token?: string;
}) {
  const result = await sql`
    INSERT INTO inbox_articles (title, content, images, source_project, arrival_token)
    VALUES (
      ${data.title},
      ${data.content},
      ${JSON.stringify(data.images || [])},
      ${data.source_project || 'unknown'},
      ${data.arrival_token || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getInboxArticles(status?: string) {
  if (status) {
    const result = await sql`
      SELECT * FROM inbox_articles 
      WHERE status = ${status}
      ORDER BY created_at DESC
    `;
    return result.rows;
  }
  
  const result = await sql`
    SELECT * FROM inbox_articles 
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateArticleStatus(articleId: number, status: string) {
  const result = await sql`
    UPDATE inbox_articles 
    SET status = ${status}
    WHERE id = ${articleId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getArticleById(articleId: number) {
  const result = await sql`
    SELECT * FROM inbox_articles WHERE id = ${articleId}
  `;
  return result.rows[0];
}

export async function updateArticle(articleId: number, data: { title?: string; content?: string }) {
  const updates = [];
  const values = [];
  
  if (data.title !== undefined) {
    updates.push(`title = $${updates.length + 1}`);
    values.push(data.title);
  }
  
  if (data.content !== undefined) {
    updates.push(`content = $${updates.length + 1}`);
    values.push(data.content);
  }
  
  if (updates.length === 0) {
    return await getArticleById(articleId);
  }
  
  values.push(articleId);
  
  const result = await sql`
    UPDATE inbox_articles 
    SET title = ${data.title}, content = ${data.content}
    WHERE id = ${articleId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteArticle(articleId: number) {
  // Сначала получаем информацию о статье включая токен
  const article = await getArticleById(articleId);
  
  if (!article) {
    return null;
  }
  
  // Удаляем статью (CASCADE удалит связанные события)
  const result = await sql`
    DELETE FROM inbox_articles WHERE id = ${articleId}
    RETURNING *
  `;
  
  return {
    article: result.rows[0],
    arrival_token: article.arrival_token // Возвращаем токен для callback
  };
}

// ================================
// CALENDAR EVENTS
// ================================

export async function createCalendarEvent(data: {
  article_id: number;
  publish_date: string;
  publish_time: string;
  platforms: string[];
}) {
  const result = await sql`
    INSERT INTO calendar_events (article_id, publish_date, publish_time, platforms)
    VALUES (
      ${data.article_id},
      ${data.publish_date},
      ${data.publish_time},
      ${JSON.stringify(data.platforms)}
    )
    RETURNING *
  `;
  
  // Обновляем статус статьи на 'scheduled'
  await updateArticleStatus(data.article_id, 'scheduled');
  
  // Получаем информацию о статье для отправки маркера обратно
  const article = await getArticleById(data.article_id);
  
  return {
    event: result.rows[0],
    arrival_token: article.arrival_token // Возвращаем маркер для отправки обратно
  };
}

export async function getCalendarEvents(month?: number, year?: number) {
  if (month && year) {
    const result = await sql`
      SELECT ce.*, ia.title, ia.content, ia.images, ia.source_project, ia.created_at as article_created_at
      FROM calendar_events ce
      JOIN inbox_articles ia ON ce.article_id = ia.id
      WHERE EXTRACT(MONTH FROM publish_date) = ${month}
        AND EXTRACT(YEAR FROM publish_date) = ${year}
      ORDER BY publish_date, publish_time
    `;
    return result.rows;
  }
  
  const result = await sql`
    SELECT ce.*, ia.title, ia.content, ia.images, ia.source_project, ia.created_at as article_created_at
    FROM calendar_events ce
    JOIN inbox_articles ia ON ce.article_id = ia.id
    ORDER BY publish_date, publish_time
  `;
  return result.rows;
}

export async function getPendingPublications() {
  const now = new Date();
  const result = await sql`
    SELECT ce.*, ia.title, ia.content, ia.images
    FROM calendar_events ce
    JOIN inbox_articles ia ON ce.article_id = ia.id
    WHERE ce.status = 'pending'
      AND (
        ce.publish_date < CURRENT_DATE
        OR (
          ce.publish_date = CURRENT_DATE 
          AND ce.publish_time <= CURRENT_TIME
        )
      )
    ORDER BY publish_date, publish_time
  `;
  return result.rows;
}

export async function updateEventStatus(eventId: number, status: string) {
  const result = await sql`
    UPDATE calendar_events 
    SET status = ${status}, 
        published_at = ${status === 'published' ? 'NOW()' : null}
    WHERE id = ${eventId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteCalendarEvent(eventId: number) {
  // Сначала получаем информацию о событии и статье
  const event = await sql`
    SELECT ce.*, ia.arrival_token 
    FROM calendar_events ce
    JOIN inbox_articles ia ON ce.article_id = ia.id
    WHERE ce.id = ${eventId}
  `;
  
  if (event.rows.length > 0) {
    const eventData = event.rows[0];
    const articleId = eventData.article_id;
    const arrivalToken = eventData.arrival_token;
    
    // Удаляем событие
    const result = await sql`
      DELETE FROM calendar_events WHERE id = ${eventId}
      RETURNING *
    `;
    
    // Обновляем статус статьи обратно на 'inbox'
    await updateArticleStatus(articleId, 'inbox');
    
    return {
      event: result.rows[0],
      arrival_token: arrivalToken // Возвращаем токен для callback
    };
  }
  
  return null;
}

// ================================
// PUBLISHING PLATFORMS
// ================================

export async function createPlatform(data: {
  user_id: number;
  platform_type: string;
  platform_name: string;
  credentials: any;
}) {
  const result = await sql`
    INSERT INTO publishing_platforms (user_id, platform_type, platform_name, credentials)
    VALUES (
      ${data.user_id},
      ${data.platform_type},
      ${data.platform_name},
      ${JSON.stringify(data.credentials)}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPlatforms(userId: number, platformType?: string) {
  if (platformType) {
    const result = await sql`
      SELECT * FROM publishing_platforms 
      WHERE user_id = ${userId} AND platform_type = ${platformType} AND is_active = true
      ORDER BY platform_name
    `;
    return result.rows;
  }
  
  const result = await sql`
    SELECT * FROM publishing_platforms 
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY platform_type, platform_name
  `;
  return result.rows;
}

export async function updatePlatform(platformId: number, data: any) {
  const result = await sql`
    UPDATE publishing_platforms 
    SET credentials = ${JSON.stringify(data.credentials)},
        platform_name = ${data.platform_name},
        is_active = ${data.is_active}
    WHERE id = ${platformId}
    RETURNING *
  `;
  return result.rows[0];
}

// ================================
// PUBLISH LOGS
// ================================

export async function createPublishLog(data: {
  calendar_event_id: number;
  platform_id?: number;
  platform_type: string;
  status: 'success' | 'failed';
  error_message?: string;
  published_url?: string;
}) {
  const result = await sql`
    INSERT INTO publish_logs (
      calendar_event_id, 
      platform_id, 
      platform_type, 
      status, 
      error_message,
      published_url
    )
    VALUES (
      ${data.calendar_event_id},
      ${data.platform_id || null},
      ${data.platform_type},
      ${data.status},
      ${data.error_message || null},
      ${data.published_url || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPublishLogs(eventId: number) {
  const result = await sql`
    SELECT * FROM publish_logs 
    WHERE calendar_event_id = ${eventId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}
