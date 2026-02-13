'use client';

import { useState, useEffect } from 'react';
import ArticleViewModal from './ArticleViewModal';

interface CalendarEvent {
  id: number;
  article_id: number;
  title: string;
  content: string;
  images: string[] | any;
  publish_date: string;
  publish_time: string;
  platforms: string[];
  status: string;
  created_at: string;
  source_project?: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  month: number;
  year: number;
}

export default function CalendarGrid({ events, month, year }: CalendarGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);

  // Получаем количество дней в месяце
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Создаём массив дней
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Группируем события по датам
  const eventsByDate: { [key: string]: CalendarEvent[] } = {};
  events.forEach((event) => {
    const date = new Date(event.publish_date).getDate();
    const key = `${year}-${month}-${date}`;
    if (!eventsByDate[key]) {
      eventsByDate[key] = [];
    }
    eventsByDate[key].push(event);
  });

  const getEventsForDay = (day: number) => {
    const key = `${year}-${month}-${day}`;
    return eventsByDate[key] || [];
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      wordpress: 'bg-blue-500',
      telegram: 'bg-cyan-500',
      facebook: 'bg-blue-600',
      instagram: 'bg-pink-500',
      linkedin: 'bg-blue-700'
    };
    return colors[platform.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <div className="p-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {emptyDays.map((i) => (
          <div key={`empty-${i}`} className="aspect-square bg-gray-50 rounded" />
        ))}

        {/* Days of month */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() + 1 &&
            year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`aspect-square border rounded p-1 ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-xs font-medium text-gray-700 mb-1">{day}</div>
              
              {/* Event indicators */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left px-1 py-0.5 bg-blue-100 hover:bg-blue-200 rounded text-xs truncate transition"
                    title={event.title}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{event.publish_time.slice(0, 5)}</span>
                      <div className="flex gap-0.5">
                        {event.platforms.slice(0, 2).map((platform, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`}
                            title={platform}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && !showArticleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-gray-900">{selectedEvent.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date & Time</label>
                <p className="text-gray-900">
                  {new Date(selectedEvent.publish_date).toLocaleDateString()} at{' '}
                  {selectedEvent.publish_time}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Platforms</label>
                <div className="flex gap-2 mt-1">
                  {selectedEvent.platforms.map((platform, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-gray-900 capitalize">{selectedEvent.status}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
              >
                Close
              </button>
              <button
                onClick={() => setShowArticleModal(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition font-medium"
              >
                Открыть статью
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article View Modal */}
      {selectedEvent && showArticleModal && (
        <ArticleViewModal
          article={{
            id: selectedEvent.article_id,
            title: selectedEvent.title,
            content: selectedEvent.content,
            images: selectedEvent.images,
            status: selectedEvent.status,
            created_at: selectedEvent.created_at || new Date().toISOString(),
            source_project: selectedEvent.source_project
          }}
          onClose={() => {
            setShowArticleModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
