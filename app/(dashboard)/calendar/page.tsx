'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, Settings } from 'lucide-react';
import InboxTable from '@/components/InboxTable';
import CalendarGrid from '@/components/CalendarGrid';
import ScheduleModal from '@/components/ScheduleModal';
import ArticleViewModal from '@/components/ArticleViewModal';

export default function CalendarPage() {
  const [inboxArticles, setInboxArticles] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInboxArticles();
    loadCalendarEvents();
  }, [statusFilter, currentMonth, currentYear]);

  const loadInboxArticles = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/articles/inbox'
        : `/api/articles/inbox?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setInboxArticles(data.articles || []);
    } catch (error) {
      console.error('Error loading inbox:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const response = await fetch(
        `/api/calendar/events?month=${currentMonth}&year=${currentYear}`
      );
      const data = await response.json();
      setCalendarEvents(data.events || []);
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article);
    setShowScheduleModal(true);
  };

  const handleViewArticle = (article: any) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handleScheduleSubmit = async (scheduleData: any) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: selectedArticle?.id ?? 0,
          publish_date: scheduleData.date,
          publish_time: scheduleData.time,
          platforms: scheduleData.platforms
        })
      });

      if (response.ok) {
        setShowScheduleModal(false);
        loadInboxArticles();
        loadCalendarEvents();
      }
    } catch (error) {
      console.error('Error scheduling article:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar Publishing</h1>
              <p className="text-sm text-gray-600">Plan and automate your content</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Settings size={20} />
              Settings
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Inbox Table */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">📋 Inbox Articles</h2>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {inboxArticles.length}
                  </span>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('inbox')}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === 'inbox'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    New
                  </button>
                  <button
                    onClick={() => setStatusFilter('scheduled')}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === 'scheduled'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Scheduled
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === 'published'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              <InboxTable
                articles={inboxArticles}
                onArticleClick={handleArticleClick}
                onViewClick={handleViewArticle}
              />
            </div>
          </div>

          {/* Right: Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">📅 Publishing Calendar</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (currentMonth === 1) {
                          setCurrentMonth(12);
                          setCurrentYear(currentYear - 1);
                        } else {
                          setCurrentMonth(currentMonth - 1);
                        }
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      ←
                    </button>
                    <span className="text-sm font-medium px-4">
                      {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <button
                      onClick={() => {
                        if (currentMonth === 12) {
                          setCurrentMonth(1);
                          setCurrentYear(currentYear + 1);
                        } else {
                          setCurrentMonth(currentMonth + 1);
                        }
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>

              <CalendarGrid
                events={calendarEvents}
                month={currentMonth}
                year={currentYear}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedArticle && (
        <ScheduleModal
          article={selectedArticle}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={handleScheduleSubmit}
        />
      )}

      {/* Article View Modal */}
      {showArticleModal && selectedArticle && (
        <ArticleViewModal
          article={selectedArticle}
          onClose={() => {
            setShowArticleModal(false);
            setSelectedArticle(null);
          }}
        />
      )}
    </div>
  );
}
