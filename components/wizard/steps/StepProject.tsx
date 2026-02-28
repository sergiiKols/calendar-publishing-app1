/**
 * Компонент: StepProject
 * Шаг 1: Выбор проекта
 */

'use client';

import { useState } from 'react';
import { Folder, Plus, Check } from 'lucide-react';

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
}

export default function StepProject({
  projects,
  selectedProjectId,
  newProjectName,
  onProjectSelect,
  onNewProjectNameChange
}: StepProjectProps) {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  
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
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelectExisting(project.id.toString())}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${
                    selectedProjectId === project.id.toString()
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${
                          selectedProjectId === project.id.toString()
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }
                      `}
                    >
                      <Folder
                        size={20}
                        className={
                          selectedProjectId === project.id.toString()
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
                  {selectedProjectId === project.id.toString() && (
                    <Check size={20} className="text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
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
