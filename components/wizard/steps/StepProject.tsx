/**
 * Компонент: StepProject
 * Шаг 1: Выбор проекта
 */

'use client';

import { useState } from 'react';
import { Folder, Plus, Check, Edit2, Trash2, X, Save } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface StepProjectProps {
  projects: Project[];
  selectedProjectId: string;
  newProjectName: string;
  onProjectSelect: (projectId: string) => void;
  onNewProjectNameChange: (name: string) => void;
  onProjectsChange?: () => void; // Callback для обновления списка проектов
}

export default function StepProject({
  projects,
  selectedProjectId,
  newProjectName,
  onProjectSelect,
  onNewProjectNameChange,
  onProjectsChange
}: StepProjectProps) {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Debug: log projects
  console.log('StepProject - projects:', projects, 'count:', projects.length);

  const handleSelectExisting = (projectId: string) => {
    onProjectSelect(projectId);
    setShowNewProjectForm(false);
    onNewProjectNameChange('');
  };

  const handleCreateNew = () => {
    setShowNewProjectForm(true);
    onProjectSelect('new');
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      setEditingProjectId(null);
      setEditName('');
      setEditDescription('');
      
      // Обновить список проектов
      if (onProjectsChange) {
        onProjectsChange();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Ошибка при обновлении проекта');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingProjectId === projectId) {
      // Подтверждено - удаляем
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete project');
        }

        setDeletingProjectId(null);
        
        // Если удаляемый проект был выбран, сбрасываем выбор
        if (selectedProjectId === projectId.toString()) {
          onProjectSelect('');
        }
        
        // Обновить список проектов
        if (onProjectsChange) {
          onProjectsChange();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Ошибка при удалении проекта');
      } finally {
        setIsDeleting(false);
      }
    } else {
      // Первый клик - показываем подтверждение
      setDeletingProjectId(projectId);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingProjectId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Выберите проект
        </h3>
        <p className="text-sm text-gray-600">
          Ключевые слова будут привязаны к выбранному проекту
        </p>
      </div>

      {/* Существующие проекты */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Существующие проекты:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((project) => {
              const isEditing = editingProjectId === project.id;
              const isDeleting = deletingProjectId === project.id;
              
              return (
                <div
                  key={project.id}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all relative
                    ${
                      selectedProjectId === project.id.toString()
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                    ${isDeleting ? 'border-red-600 bg-red-50 ring-2 ring-red-200' : ''}
                  `}
                >
                  {isEditing ? (
                    // Режим редактирования
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-blue-900 mb-2">
                        <Edit2 size={16} />
                        <span className="font-semibold text-sm">Редактирование</span>
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Название проекта"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Описание (необязательно)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(project.id, e)}
                          disabled={!editName.trim() || isSaving}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Save size={14} />
                          {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
                        >
                          <X size={14} />
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Обычный режим просмотра
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectExisting(project.id.toString())}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`
                                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                ${
                                  selectedProjectId === project.id.toString()
                                    ? 'bg-blue-600'
                                    : isDeleting
                                    ? 'bg-red-600'
                                    : 'bg-gray-200'
                                }
                              `}
                            >
                              <Folder
                                size={20}
                                className={
                                  selectedProjectId === project.id.toString() || isDeleting
                                    ? 'text-white'
                                    : 'text-gray-600'
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{project.name}</h4>
                              {project.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedProjectId === project.id.toString() && !isDeleting && (
                            <Check size={20} className="text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {/* Кнопки управления */}
                      {isDeleting ? (
                        <div className="mt-3 pt-3 border-t border-red-200 flex items-center justify-between">
                          <p className="text-sm text-red-900 font-medium">Удалить проект?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              disabled={isDeleting}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeleting ? 'Удаление...' : 'Да, удалить'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelDelete}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleEditProject(project, e)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors"
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
        </div>
      )}

      {/* Кнопка создания нового проекта */}
      {!showNewProjectForm && (
        <button
          type="button"
          onClick={handleCreateNew}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <Plus size={20} />
          <span className="font-medium">Создать новый проект</span>
        </button>
      )}

      {/* Форма нового проекта */}
      {showNewProjectForm && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-blue-900">
            <Plus size={18} />
            <h4 className="font-semibold">Новый проект</h4>
          </div>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => onNewProjectNameChange(e.target.value)}
            placeholder="Введите название проекта"
            className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowNewProjectForm(false);
              onProjectSelect('');
              onNewProjectNameChange('');
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Подсказка */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          💡 <strong>Совет:</strong> Организуйте ключевые слова по проектам для удобного управления и анализа.
        </p>
      </div>
    </div>
  );
}
