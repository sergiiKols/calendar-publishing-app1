/**
 * Vercel Cron Job endpoint для автоматической публикации
 * Вызывается каждые 15 минут
 * GET /api/cron/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingPublications, updateEventStatus, createPublishLog } from '@/lib/db/client';
import { publishToWordPress } from '@/lib/publishers/wordpress';
import { publishToTelegram } from '@/lib/publishers/telegram';
import { publishToFacebook } from '@/lib/publishers/facebook';
import { publishToInstagram } from '@/lib/publishers/instagram';
import { publishToLinkedIn } from '@/lib/publishers/linkedin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Проверка cron secret
    const cronSecret = request.headers.get('X-Cron-Secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting cron job: publish pending articles');

    // Получаем статьи, готовые к публикации
    const pendingEvents = await getPendingPublications();

    console.log(`📋 Found ${pendingEvents.length} pending publications`);

    const results = [];

    for (const event of pendingEvents) {
      console.log(`📝 Processing event #${event.id}: ${event.title}`);

      // Обновляем статус на 'publishing'
      await updateEventStatus(event.id, 'publishing');

      const platforms = event.platforms as string[];
      let successCount = 0;
      let failCount = 0;

      // Публикуем на каждую платформу
      for (const platform of platforms) {
        try {
          let result;

          switch (platform.toLowerCase()) {
            case 'wordpress':
              result = await publishToWordPress(event);
              break;
            case 'telegram':
              result = await publishToTelegram(event);
              break;
            case 'facebook':
              result = await publishToFacebook(event);
              break;
            case 'instagram':
              result = await publishToInstagram(event);
              break;
            case 'linkedin':
              result = await publishToLinkedIn(event);
              break;
            default:
              throw new Error(`Unknown platform: ${platform}`);
          }

          // Логируем успех
          await createPublishLog({
            calendar_event_id: event.id,
            platform_type: platform,
            status: 'success',
            published_url: result.url
          });

          successCount++;
          console.log(`✅ Published to ${platform}: ${result.url}`);

        } catch (error: any) {
          // Логируем ошибку
          await createPublishLog({
            calendar_event_id: event.id,
            platform_type: platform,
            status: 'failed',
            error_message: error.message
          });

          failCount++;
          console.error(`❌ Failed to publish to ${platform}:`, error.message);
        }
      }

      // Обновляем финальный статус события
      const finalStatus = failCount === 0 ? 'published' : 'failed';
      await updateEventStatus(event.id, finalStatus);

      results.push({
        event_id: event.id,
        title: event.title,
        platforms: platforms.length,
        success: successCount,
        failed: failCount,
        status: finalStatus
      });
    }

    console.log('✅ Cron job completed');

    return NextResponse.json({
      success: true,
      processed: pendingEvents.length,
      results
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    );
  }
}
