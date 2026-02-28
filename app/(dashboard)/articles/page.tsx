/**
 * Page: /articles
 * Страница для написания статей
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PenTool, FileText, Sparkles, Save } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import ModuleNavigation from '@/components/ModuleNavigation';

export default function ArticlesPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Навигация между модулями */}
      <ModuleNavigation />

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PenTool size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Написание статей</h1>
          </div>
          <p className="text-gray-600">
            Создавайте качественный контент с помощью AI и ручного редактирования
          </p>
        </div>

        {/* Placeholder контент */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Карточка 1: Новая статья */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Новая статья
            </h3>
            <p className="text-sm text-gray-600">
              Создайте статью с нуля
            </p>
          </div>

          {/* Карточка 2: AI генерация */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-purple-400 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI генерация
            </h3>
            <p className="text-sm text-gray-600">
              Создайте статью с помощью AI
            </p>
          </div>

          {/* Карточка 3: Шаблоны */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-green-400 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Шаблоны
            </h3>
            <p className="text-sm text-gray-600">
              Используйте готовые шаблоны
            </p>
          </div>
        </div>

        {/* Информационный блок */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 Скоро здесь появится:
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Редактор статей с поддержкой Markdown и WYSIWYG</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>AI-генерация контента на основе ключевых слов из SEO модуля</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>SEO-оптимизация текста (заголовки, мета-теги, плотность ключевых слов)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Библиотека готовых шаблонов для разных типов контента</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Автоматическое добавление изображений и форматирование</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Интеграция с календарём для планирования публикаций</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>Версионность и автосохранение черновиков</span>
            </li>
          </ul>
        </div>

        {/* Пустое состояние - список статей */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Пока нет статей
          </h3>
          <p className="text-gray-600 mb-4">
            Начните создавать контент для вашего проекта
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <PenTool size={18} />
            Создать первую статью
          </button>
        </div>
      </div>
    </div>
  );
}
