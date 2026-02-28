/**
 * Компонент: ModuleNavigation
 * Навигация между модулями: SEO, Календарь, Написание статей
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, PenTool } from 'lucide-react';

export default function ModuleNavigation() {
  const pathname = usePathname();

  const modules = [
    {
      name: 'SEO',
      href: '/seo',
      icon: BarChart3,
      description: 'Анализ ключевых слов'
    },
    {
      name: 'Календарь',
      href: '/calendar',
      icon: Calendar,
      description: 'Планирование публикаций'
    },
    {
      name: 'Написание статей',
      href: '/articles',
      icon: PenTool,
      description: 'Создание контента'
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 py-3">
          {modules.map((module, index) => {
            const isActive = pathname.startsWith(module.href);
            const Icon = module.icon;

            return (
              <div key={module.href} className="flex items-center">
                <Link
                  href={module.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={18} />
                  <div className="flex flex-col">
                    <span className="text-sm">{module.name}</span>
                    {isActive && (
                      <span className="text-xs text-blue-600">{module.description}</span>
                    )}
                  </div>
                </Link>
                {index < modules.length - 1 && (
                  <div className="h-6 w-px bg-gray-200 mx-2"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
