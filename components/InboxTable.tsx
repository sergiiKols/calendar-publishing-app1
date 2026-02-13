'use client';

import { FileText, Calendar, CheckCircle } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

interface InboxTableProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

export default function InboxTable({ articles, onArticleClick }: InboxTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inbox':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'published':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'inbox':
        return <FileText size={16} />;
      case 'scheduled':
        return <Calendar size={16} />;
      case 'published':
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="overflow-y-auto max-h-[600px]">
      {articles.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <FileText className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No articles found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => onArticleClick(article)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(article.status)}`}>
                      {getStatusIcon(article.status)}
                      {article.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
