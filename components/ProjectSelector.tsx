'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface ProjectSelectorProps {
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
}

export default function ProjectSelector({ selectedProjectId, onSelectProject }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Загрузка проектов
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 ProjectSelector: Fetching projects...');
      const response = await fetch('/api/projects');
      console.log('📡 ProjectSelector: Response status:', response.status);
      const data = await response.json();
      console.log('📦 ProjectSelector: Received data:', data);
      
      if (response.status === 400 && data.error?.includes('Invalid user ID')) {
        // Сессия устарела - показываем сообщение пользователю
        alert('Ваша сессия устарела. Пожалуйста, выйдите и войдите снова, чтобы обновить сессию.');
        console.error('❌ Session expired or invalid. User needs to re-login.');
        return;
      }
      
      if (data.projects) {
        setProjects(data.projects);
        console.log('✅ ProjectSelector: Projects loaded:', data.projects.length);
        
        // Автоматически выбираем первый проект, если ничего не выбрано
        if (!selectedProjectId && data.projects.length > 0) {
          console.log('🎯 ProjectSelector: Auto-selecting first project:', data.projects[0].id);
          onSelectProject(data.projects[0].id);
        }
      } else {
        console.warn('⚠️ ProjectSelector: No projects in response');
      }
    } catch (error) {
      console.error('❌ ProjectSelector: Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция создания проекта убрана - проекты создаются только из SMI

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-10 w-48 rounded-md"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Dropdown для выбора проекта */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-w-[200px]"
            >
              {selectedProject ? (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="font-medium">{selectedProject.name}</span>
                </>
              ) : (
                <span className="text-gray-500">Выберите проект</span>
              )}
              <svg
                className={`ml-auto w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onSelectProject(project.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 ${
                        selectedProjectId === project.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Информация о синхронизации */}
          <div className="text-xs text-gray-500 px-2">
            Проекты синхронизируются из SMI
          </div>
        </div>
      </div>
    </>
  );
}
