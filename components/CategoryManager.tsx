/**
 * Компонент: CategoryManager
 * Управление направлениями проекта
 */

'use client';

import { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  color: string;
  keywords_count: number;
  clusters_count: number;
  created_at: string;
}

interface CategoryManagerProps {
  projectId: number;
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onCategoriesChange?: () => void;
}

export default function CategoryManager({
  projectId,
  selectedCategoryId,
  onSelectCategory,
  onCategoriesChange,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' });
  const [editCategory, setEditCategory] = useState({ name: '', description: '', color: '#3B82F6' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [projectId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categories?project_id=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Ошибка загрузки направлений');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Введите название направления');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Направление создано!');
        setNewCategory({ name: '', description: '', color: '#3B82F6' });
        setShowCreateForm(false);
        fetchCategories();
        if (onCategoriesChange) onCategoriesChange();
      } else {
        toast.error(data.error || 'Ошибка создания');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Ошибка создания направления');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditCategory({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
  };

  const handleSaveEdit = async (categoryId: number) => {
    if (!editCategory.name.trim()) {
      toast.error('Введите название направления');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCategory),
      });

      if (response.ok) {
        toast.success('Направление обновлено!');
        setEditingId(null);
        fetchCategories();
        if (onCategoriesChange) onCategoriesChange();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Ошибка обновления направления');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (deletingId === categoryId) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Направление удалено!');
          setDeletingId(null);
          if (selectedCategoryId === categoryId) {
            onSelectCategory(null);
          }
          fetchCategories();
          if (onCategoriesChange) onCategoriesChange();
        } else {
          toast.error('Ошибка удаления');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Ошибка удаления направления');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setDeletingId(categoryId);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Направления проекта</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Название направления"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            autoFocus
          />
          <textarea
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            placeholder="Описание (необязательно)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Цвет:</label>
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Save size={14} />
              Создать
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewCategory({ name: '', description: '', color: '#3B82F6' });
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {/* "Все" - показать без фильтра */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-2 rounded transition-colors ${
            selectedCategoryId === null
              ? 'bg-gray-200 font-medium'
              : 'hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-gray-600" />
            <span className="text-sm">Все направления</span>
            <span className="ml-auto text-xs text-gray-500">
              ({categories.reduce((sum, c) => sum + c.keywords_count, 0)} слов)
            </span>
          </div>
        </button>

        {categories.map((category) => {
          const isEditing = editingId === category.id;
          const isDeleting = deletingId === category.id;

          return (
            <div
              key={category.id}
              className={`border rounded p-3 ${
                isDeleting ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editCategory.name}
                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <textarea
                    value={editCategory.description}
                    onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editCategory.color}
                      onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                      className="w-10 h-6 rounded border cursor-pointer"
                    />
                    <button
                      onClick={() => handleSaveEdit(category.id)}
                      disabled={isSubmitting}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Save size={12} />
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => !isDeleting && onSelectCategory(category.id)}
                    className="w-full text-left"
                    disabled={isDeleting}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm font-medium flex-1">{category.name}</span>
                      <span className="text-xs text-gray-500">
                        {category.keywords_count} слов
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-gray-600 mt-1 ml-6">{category.description}</p>
                    )}
                  </button>

                  {isDeleting ? (
                    <div className="mt-2 pt-2 border-t border-red-200 flex justify-between items-center">
                      <span className="text-xs text-red-900">Удалить направление?</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={isSubmitting}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Да
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                        >
                          Нет
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Trash2 size={12} />
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

      {categories.length === 0 && !showCreateForm && (
        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded">
          <Folder size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Нет направлений</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Создать первое направление
          </button>
        </div>
      )}
    </div>
  );
}
