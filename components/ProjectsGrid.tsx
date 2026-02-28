/**
 * Компонент: ProjectsGrid
 * Сетка с карточками проектов для выбора
 */

'use client';

import { useState } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  description?: string;
  keywords_count?: number;
  created_at?: string;
}

interface ProjectsGridProps {
  projects: Project[];
  onSelectProject: (projectId: number) => void;
  onProjectsChange: () => void;
}

export default function ProjectsGrid({ 
  projects, 
  onSelectProject, 
  onProjectsChange 
}: ProjectsGridProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [editProject, setEditProject] = useState({ name: '', description: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Создание нового проекта
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.project) {
        toast.success('Проект создан!');
        setNewProject({ name: '', description: '' });
        setShowCreateForm(false);
        onProjectsChange();
      } else {
        toast.error(data.error || 'Ошибка создания проекта');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Ошибка при создании проекта');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Начать редактирование
  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProject({ 
      name: project.name, 
      description: project.description || '' 
    });
  };

  // Сохранить изменения
  const handleSaveEdit = async (projectId: number) => {
    if (!editProject.name.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProject.name,
          description: editProject.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      toast.success('Проект обновлён!');
      setEditingProjectId(null);
      setEditProject({ name: '', description: '' });
      onProjectsChange();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Ошибка при обновлении проекта');
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Мои проекты</h2>
          <p className="text-sm text-gray-600 mt-1">
            Выберите проект для работы или создайте новый
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Создать проект
        </button>
      </div>

      {/* Форма создания нового проекта */}
      {showCreateForm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Новый проект</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название проекта <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Например: Интернет-магазин электроники"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (необязательно)
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Краткое описание проекта"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateProject}
                disabled={isSubmitting || !newProject.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={16} />
                {isSubmitting ? 'Создание...' : 'Создать проект'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProject({ name: '', description: '' });
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Сетка проектов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => {
          const isEditing = editingProjectId === project.id;
          const isDeleting = deletingProjectId === project.id;

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
              {isEditing ? (
                // Режим редактирования
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 mb-2">
                    <Edit2 size={16} />
                    <span className="font-semibold text-sm">Редактирование</span>
                  </div>
                  <input
                    type="text"
                    value={editProject.name}
                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                    placeholder="Название проекта"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                    placeholder="Описание"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(project.id)}
                      disabled={!editProject.name.trim() || isSubmitting}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                    >
                      <Save size={14} />
                      Сохранить
                    </button>
                    <button
                      onClick={() => {
                        setEditingProjectId(null);
                        setEditProject({ name: '', description: '' });
                      }}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                // Обычный режим
                <>
                  <button
                    onClick={() => !isDeleting && onSelectProject(project.id)}
                    className="w-full p-4 text-left"
                    disabled={isDeleting}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isDeleting ? 'bg-red-600' : 'bg-blue-600'}
                      `}>
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <BarChart3 size={14} />
                          <span>{project.keywords_count || 0} ключевых слов</span>
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {projects.length === 0 && !showCreateForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Folder size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет проектов
          </h3>
          <p className="text-gray-600 mb-4">
            Создайте первый проект для работы с ключевыми словами
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
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
