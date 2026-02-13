'use client';

import { useState } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';

interface ArticleViewModalProps {
  article: {
    id: number;
    title: string;
    content: string;
    images?: string[] | any;
    status: string;
    created_at: string;
    source_project?: string;
  };
  onClose: () => void;
  onSave?: (updatedArticle: any) => void;
}

export default function ArticleViewModal({ article, onClose, onSave }: ArticleViewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedContent, setEditedContent] = useState(article.content);

  // Парсим изображения если они в формате JSON
  const images = typeof article.images === 'string' 
    ? JSON.parse(article.images) 
    : (Array.isArray(article.images) ? article.images : []);

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        id: article.id,
        title: editedTitle,
        content: editedContent
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-xl font-semibold text-gray-900 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Заголовок статьи"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                article.status === 'inbox' ? 'bg-gray-100 text-gray-700' :
                article.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {article.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(article.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {article.source_project && (
                <span className="text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded">
                  📡 {article.source_project}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Images Section */}
          {images && images.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={18} className="text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Изображения ({images.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition rounded-lg flex items-center justify-center">
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded text-sm font-medium text-gray-700 shadow-lg transition"
                      >
                        Открыть
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Содержание статьи</h3>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={20}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Содержание статьи..."
              />
            ) : (
              <div className="prose max-w-none bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {article.content}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            ID: {article.id}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedTitle(article.title);
                    setEditedContent(article.content);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Save size={18} />
                  Сохранить
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Закрыть
                </button>
                {onSave && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Редактировать
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
