/**
 * Компонент: ProjectsGrid
 * Сетка с карточками проектов для выбора
 */

'use client';

import { useState } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X, BarChart3, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectModal from './ProjectModal';

interface Project {
  id: number;
  name: string;
  description?: string;
  keywords_count?: number;
  created_at?: string;
  search_location_code?: number;
  color?: string;
}

interface ProjectsGridProps {
  projects: Project[];
  onSelectProject: (projectId: number) => void;
  onProjectsChange: () => void;
}

const LOCATION_NAMES: Record<number, string> = {
  2840: '🇺🇸 США',
  2144: '🇱🇰 Шри-Ланка',
  2826: '🇬🇧 Великобритания',
  2643: '🇷🇺 Россия',
  2124: '🇨🇦 Канада',
  2036: '🇦🇺 Австралия',
};

export default function ProjectsGrid({ 
  projects, 
  onSelectProject, 
  onProjectsChange 
}: ProjectsGridProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сохранение проекта (создание или обновление)
  const handleSaveProject = async (projectData: { 
    name: string; 
    description: string; 
    color: string; 
    search_location_code: number 
  }) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!editingProject;
      const url = isEditing ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      if (response.ok && (data.success || data.project)) {
        toast.success(isEditing ? 'Проект обновлён!' : 'Проект создан!');
        setShowModal(false);
        setEditingProject(null);
        onProjectsChange();
      } else {
        toast.error(data.error || 'Ошибка сохранения проекта');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Ошибка при сохранении проекта');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Открыть модальное окно для редактирования
  const handleStartEdit = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  // Удаление проекта
  const handleDeleteProject = async (projectId: number) => {
    if (deletingProjectId === projectId) {
      // Подтверждено - удаляем
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete project');
        }

        toast.success('Проект удалён!');
        setDeletingProjectId(null);
        onProjectsChange();
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Ошибка при удалении проекта');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Первый клик - показываем подтверждение
      setDeletingProjectId(projectId);
    }
  };

  return (
    <div className="space-y-6">
      {/* ProjectModal для создания/редактирования */}
      <ProjectModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Мои проекты</h2>
          <p className="text-sm text-gray-600 mt-1">
            Выберите проект для работы или создайте новый
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Создать проект
        </button>
      </div>

      {/* Сетка проектов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => {
          const isDeleting = deletingProjectId === project.id;
          const locationName = LOCATION_NAMES[project.search_location_code || 2840] || '🌍 Регион';

          return (
            <div
              key={project.id}
              className={`
                bg-white rounded-lg border-2 transition-all
                ${isDeleting 
                  ? 'border-red-600 bg-red-50' 
                  : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                }
              `}
            >
              {/* Карточка проекта */}
              <button
                onClick={() => !isDeleting && onSelectProject(project.id)}
                className="w-full p-4 text-left"
                disabled={isDeleting}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className={`
                      w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isDeleting ? 'bg-red-600' : ''}
                    `}
                    style={{ backgroundColor: isDeleting ? undefined : (project.color || '#3B82F6') }}
                  >
                    <Folder size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Globe size={14} />
                        <span>{locationName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <BarChart3 size={14} />
                        <span>{project.keywords_count || 0} ключевых слов</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Кнопки управления */}
              {isDeleting ? (
                <div className="px-4 pb-4 pt-2 border-t border-red-200">
                  <p className="text-sm text-red-900 font-medium mb-2">Удалить проект?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Удаление...' : 'Да, удалить'}
                    </button>
                    <button
                      onClick={() => setDeletingProjectId(null)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(project);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 size={14} />
                    Редактировать
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                    Удалить
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {projects.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Folder size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет проектов
          </h3>
          <p className="text-gray-600 mb-4">
            Создайте первый проект для работы с ключевыми словами
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setShowModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Создать проект
          </button>
        </div>
      )}
    </div>
  );
}
