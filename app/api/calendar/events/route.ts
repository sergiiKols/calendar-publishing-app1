/**
 * API endpoints для работы с календарными событиями
 * GET /api/calendar/events?month=2&year=2026
 * POST /api/calendar/events - создать событие
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, getCalendarEvents } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    const events = await getCalendarEvents(month, year);

    return NextResponse.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_id, publish_date, publish_time, platforms } = body;

    // Валидация
    if (!article_id || !publish_date || !publish_time || !platforms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Создаём событие
    const event = await createCalendarEvent({
      article_id,
      publish_date,
      publish_time,
      platforms
    });

    return NextResponse.json({
      success: true,
      event
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}
