'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ScheduleModalProps {
  article: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function ScheduleModal({ article, onClose, onSubmit }: ScheduleModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);

  const availablePlatforms = [
    { id: 'wordpress', name: 'WordPress', color: 'bg-blue-500' },
    { id: 'telegram', name: 'Telegram', color: 'bg-cyan-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
  ];

  const togglePlatform = (platformId: string) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 ScheduleModal: Form submitted', { date, time, platforms });
    
    if (!date || !time || platforms.length === 0) {
      console.warn('⚠️ ScheduleModal: Validation failed', { date, time, platformsCount: platforms.length });
      alert('Please fill all fields');
      return;
    }
    
    console.log('✅ ScheduleModal: Validation passed, calling onSubmit');
    onSubmit({ date, time, platforms });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Article</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Article Preview */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {article.content.substring(0, 150)}...
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="space-y-2">
              {availablePlatforms.map((platform) => (
                <label
                  key={platform.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {platform.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
