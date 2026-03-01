/**
 * Page: /seo
 * Страница для работы с ключевыми словами и DataForSEO
 * Новая структура: Выбор проекта → Рабочая зона проекта
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import ModuleNavigation from '@/components/ModuleNavigation';
import ProjectsGrid from '@/components/ProjectsGrid';
import ProjectWorkspace from '@/components/ProjectWorkspace';

interface Project {
  id: number;
  name: string;
  description?: string;
  keywords_count?: number;
  created_at?: string;
  search_location_code?: number;
  color?: string;
}

export default function SeoPage() {
  const { status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    fetchProjects(); // Обновить список проектов
  };  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Навигация между модулями */}
      <ModuleNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProject ? (
          // Рабочая зона выбранного проекта
          <ProjectWorkspace
            project={selectedProject}
            onBack={handleBackToProjects}
          />
        ) : (
          // Сетка выбора проектов
          <ProjectsGrid
            projects={projects}
            onSelectProject={handleSelectProject}
            onProjectsChange={fetchProjects}
          />
        )}
      </div>
    </div>
  );
}
