/**
 * API endpoints для работы с календарными событиями
 * GET /api/calendar/events?month=2&year=2026
 * POST /api/calendar/events - создать событие
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, getCalendarEvents, deleteCalendarEvent } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

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
    const result = await createCalendarEvent({
      article_id,
      publish_date,
      publish_time,
      platforms
    });

    // Отправляем маркер обратно в SMI проект (если он есть)
    if (result.arrival_token && process.env.SMI_CALLBACK_URL) {
      try {
        await fetch(process.env.SMI_CALLBACK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.CALENDAR_API_KEY || ''
          },
          body: JSON.stringify({
            arrival_token: result.arrival_token,
            status: 'scheduled',
            scheduled_date: publish_date,
            scheduled_time: publish_time,
            platforms: platforms
          })
        });
      } catch (callbackError) {
        console.error('Failed to send callback to SMI:', callbackError);
        // Не прерываем выполнение, если callback не удался
      }
    }

    return NextResponse.json({
      success: true,
      event: result.event,
      arrival_token: result.arrival_token
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const deletedEvent = await deleteCalendarEvent(parseInt(eventId));

    if (!deletedEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}
