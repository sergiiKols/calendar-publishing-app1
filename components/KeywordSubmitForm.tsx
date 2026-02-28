/**
 * Компонент: KeywordSubmitForm
 * Форма для отправки ключевых слов на анализ (с Wizard интерфейсом)
 */

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationOptions, getLanguageOptions } from '@/lib/dataforseo/config';
import { WizardFormData, WizardStep, RequestHistory as RequestHistoryType } from './wizard/types';
import StepIndicator from './wizard/StepIndicator';
import FormNavigation from './wizard/FormNavigation';
import StepProject from './wizard/steps/StepProject';
import StepSettings from './wizard/steps/StepSettings';
import StepKeywords from './wizard/steps/StepKeywords';
import StepConfirm from './wizard/steps/StepConfirm';
import RequestHistory, { saveToHistory } from './wizard/RequestHistory';
import RestoreDraftDialog from './wizard/RestoreDraftDialog';
import AutoSaveIndicator from './wizard/AutoSaveIndicator';
import { useAutoSave, loadDraft } from '@/hooks/useAutoSave';

interface KeywordSubmitFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

export default function KeywordSubmitForm({ onClose, onSuccess }: KeywordSubmitFormProps) {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<any>(null);

  const [formData, setFormData] = useState<WizardFormData>({
    projectId: '',
    projectName: '',
    language: 'ru',
    location: '2643', // Russia code
    locationName: 'Russia',
    keywords: ''
  });

  const languageOptions = getLanguageOptions();
  const locationOptions = getLocationOptions();

  // Auto-save
  const { lastSaved, isSaving, clearDraft } = useAutoSave(formData, currentStep, true);

  useEffect(() => {
    fetchProjects();
    
    // Проверяем наличие черновика
    const draft = loadDraft();
    if (draft) {
      setDraftToRestore(draft);
      setShowRestoreDialog(true);
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
        if (data.projects.length > 0 && !formData.projectId) {
          setFormData(prev => ({ ...prev, projectId: data.projects[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleRestoreDraft = () => {
    if (draftToRestore) {
      setFormData(draftToRestore.data);
      setCurrentStep(draftToRestore.step);
      setShowRestoreDialog(false);
      toast.success('Черновик восстановлен');
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreDialog(false);
    toast.info('Черновик удален');
  };

  const handleLoadFromHistory = (item: RequestHistoryType) => {
    setFormData({
      projectId: item.projectId,
      projectName: item.projectName,
      language: item.language,
      location: item.locationCode,
      locationName: item.locationName,
      keywords: '' // Не загружаем ключевые слова для безопасности
    });
    setCurrentStep(3); // Переходим сразу на ввод ключевых слов
    toast.success('Настройки загружены из истории');
  };

  const validateStep = (step: WizardStep): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (!formData.projectId && !formData.projectName) {
          return { isValid: false, message: 'Выберите или создайте проект' };
        }
        if (formData.projectId === 'new' && !formData.projectName.trim()) {
          return { isValid: false, message: 'Введите название нового проекта' };
        }
        return { isValid: true };
      
      case 2:
        if (!formData.language) {
          return { isValid: false, message: 'Выберите язык' };
        }
        if (!formData.location) {
          return { isValid: false, message: 'Выберите локацию' };
        }
        return { isValid: true };
      
      case 3:
        const keywordsList = formData.keywords.split('\n').filter(k => k.trim());
        if (keywordsList.length === 0) {
          return { isValid: false, message: 'Введите хотя бы одно ключевое слово' };
        }
        if (keywordsList.length > 100) {
          return { isValid: false, message: 'Максимум 100 ключевых слов' };
        }
        return { isValid: true };
      
      case 4:
        return { isValid: true };
      
      default:
        return { isValid: false };
    }
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      toast.error(validation.message || 'Заполните все обязательные поля');
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    setCurrentStep((currentStep + 1) as WizardStep);
  };

  const handleBack = () => {
    setCurrentStep((currentStep - 1) as WizardStep);
  };

  const handleCancel = () => {
    const hasData = formData.keywords || formData.projectName;
    if (hasData && !confirm('Закрыть форму? Несохраненные данные будут потеряны.')) {
      return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    const validation = validateStep(3); // Валидируем ключевые слова
    if (!validation.isValid) {
      toast.error(validation.message || 'Некорректные данные');
      return;
    }

    setIsSubmitting(true);

    try {
      const keywordList = formData.keywords.split('\n').filter(k => k.trim());
      
      // Если создается новый проект
      let projectId = formData.projectId;
      if (formData.projectId === 'new') {
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.projectName })
        });
        
        const projectData = await projectResponse.json();
        if (!projectData.success) {
          toast.error('Ошибка при создании проекта');
          setIsSubmitting(false);
          return;
        }
        projectId = projectData.project.id.toString();
      }

      const response = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywordList,
          language: formData.language,
          location_code: formData.location,
          location_name: formData.locationName,
          project_id: parseInt(projectId)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Сохраняем в историю
        const projectName = formData.projectId === 'new' 
          ? formData.projectName 
          : projects.find(p => p.id.toString() === formData.projectId)?.name || '';
        
        saveToHistory(
          projectId,
          projectName,
          formData.language,
          formData.location,
          formData.locationName,
          formData.keywords
        );

        // Очищаем черновик
        clearDraft();

        toast.success(`${keywordList.length} ключевых слов добавлено в очередь!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Ошибка при добавлении ключевых слов');
      }
    } catch (error) {
      console.error('Error submitting keywords:', error);
      toast.error('Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (currentStep < 4) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  const validation = validateStep(currentStep);
  
  const getProjectName = () => {
    if (formData.projectId === 'new') {
      return formData.projectName || 'Новый проект';
    }
    return projects.find(p => p.id.toString() === formData.projectId)?.name || '';
  };

  const getLanguageName = () => {
    return languageOptions.find(l => l.value === formData.language)?.label || formData.language;
  };

  const getLocationName = () => {
    return formData.locationName || locationOptions.find(l => l.value === formData.location)?.label || formData.location;
  };

  return (
    <>
      {/* Restore Dialog */}
      {showRestoreDialog && draftToRestore && (
        <RestoreDraftDialog
          draft={draftToRestore}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {/* Main Form */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Добавить ключевые слова
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Wizard-интерфейс для удобного добавления
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-6 pb-0">
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
          </div>

          {/* Form Content */}
          <div className="p-6 min-h-[400px]">
            {currentStep === 1 && (
              <>
                <StepProject
                  projects={projects}
                  selectedProjectId={formData.projectId}
                  newProjectName={formData.projectName}
                  onProjectSelect={(id) => setFormData({ ...formData, projectId: id })}
                  onNewProjectNameChange={(name) => setFormData({ ...formData, projectName: name })}
                />
                <RequestHistory onLoadFromHistory={handleLoadFromHistory} />
              </>
            )}

            {currentStep === 2 && (
              <StepSettings
                language={formData.language}
                location={formData.location}
                languageOptions={languageOptions}
                locationOptions={locationOptions}
                onLanguageChange={(lang) => setFormData({ ...formData, language: lang })}
                onLocationChange={(code, name) => setFormData({ ...formData, location: code, locationName: name })}
              />
            )}

            {currentStep === 3 && (
              <StepKeywords
                keywords={formData.keywords}
                onKeywordsChange={(kw) => setFormData({ ...formData, keywords: kw })}
              />
            )}

            {currentStep === 4 && (
              <StepConfirm
                formData={formData}
                projectName={getProjectName()}
                languageName={getLanguageName()}
                locationName={getLocationName()}
                onEdit={(step) => setCurrentStep(step as WizardStep)}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 pt-0">
            <FormNavigation
              currentStep={currentStep}
              canGoNext={validation.isValid}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onNext={handleNext}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              validationMessage={validation.message}
            />
          </div>
        </div>
      </div>
    </>
  );
}
