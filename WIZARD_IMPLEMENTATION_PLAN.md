# 🎯 План реализации Wizard-интерфейса и улучшений UX

## Задача 1: Wizard-style интерфейс (1.1 + 1.2 + 1.3)

### 1.1. Многошаговая форма для KeywordSubmitForm

#### Текущее состояние:
- Одна длинная форма со всеми полями сразу
- Все поля видны одновременно (проект, язык, локация, ключевые слова)
- Нет визуального разделения на этапы

#### Что будет реализовано:

**Шаг 1: Выбор проекта** 
- Выбор существующего проекта из списка
- Или создание нового проекта (инлайн-форма)
- Валидация: проект обязателен
- UI: крупные карточки проектов для удобного выбора
- Показать краткое описание проекта (если есть)

**Шаг 2: Настройки поиска**
- Выбор языка (select с поиском)
- Выбор локации/страны (select с поиском)
- Предпросмотр выбранных настроек
- Валидация: язык и локация обязательны
- UI: два больших селекта с иконками флагов

**Шаг 3: Ключевые слова**
- Textarea для ввода ключевых слов (по одному на строку)
- Live counter: количество введенных ключевых слов
- Валидация: минимум 1 ключевое слово, максимум 100
- Предварительная оценка стоимости на основе количества
- UI: большое поле ввода с подсказками

**Шаг 4: Подтверждение и запуск**
- Сводная таблица всех выбранных параметров:
  - ✓ Проект: [название]
  - ✓ Язык: [язык]
  - ✓ Локация: [страна]
  - ✓ Ключевые слова: [количество] слов
  - 💰 Примерная стоимость: $X.XX
- Кнопка "Запустить анализ"
- Возможность вернуться на любой шаг для редактирования

#### Технические детали:
```tsx
// Состояние wizard
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  projectId: '',
  projectName: '', // для нового проекта
  language: '',
  location: '',
  keywords: ''
});

// Валидация каждого шага
const validateStep = (step: number) => {
  switch(step) {
    case 1: return formData.projectId !== '';
    case 2: return formData.language !== '' && formData.location !== '';
    case 3: return formData.keywords.trim().split('\n').filter(k => k.trim()).length > 0;
    default: return true;
  }
};
```

---

### 1.2. Прогресс-бар шагов

#### Что будет реализовано:

**Визуальный индикатор прогресса**
- Горизонтальная шкала с 4 шагами
- Каждый шаг представлен кружком с номером
- Активный шаг: синий, заполненный
- Пройденные шаги: зеленый с галочкой ✓
- Будущие шаги: серый, пустой
- Линии между шагами показывают прогресс

**Подписи к шагам:**
1. Проект
2. Настройки
3. Ключевые слова
4. Подтверждение

#### UI компонент:
```tsx
interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

const StepIndicator = ({ steps, currentStep, completedSteps }: StepIndicatorProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Кружок с номером/галочкой */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                ${isCompleted ? 'bg-green-600 text-white' : ''}
                ${!isCurrent && !isCompleted ? 'bg-gray-300 text-gray-600' : ''}
              `}>
                {isCompleted ? '✓' : stepNumber}
              </div>
              
              {/* Подпись */}
              <span className={`ml-2 text-sm font-medium ${
                isCurrent ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {label}
              </span>
              
              {/* Линия к следующему шагу */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  isPast ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Процент выполнения */}
      <div className="mt-2 text-center text-sm text-gray-500">
        Шаг {currentStep} из {steps.length}
      </div>
    </div>
  );
};
```

---

### 1.3. Навигация Назад/Далее

#### Что будет реализовано:

**Кнопки навигации:**

**Кнопка "Назад":**
- Показывается на шагах 2, 3, 4
- Скрыта на шаге 1
- Возвращает на предыдущий шаг
- Сохраняет введенные данные
- Стиль: вторичная кнопка (border, gray)

**Кнопка "Далее":**
- Показывается на шагах 1, 2, 3
- Меняется на "Запустить анализ" на шаге 4
- Disabled, если текущий шаг не валиден
- Показывает tooltip с причиной, почему disabled
- Стиль: первичная кнопка (blue-600)

**Кнопка "Отмена":**
- Показывается на всех шагах
- Закрывает форму
- Спрашивает подтверждение, если есть введенные данные

#### UI Footer формы:
```tsx
const FormFooter = () => {
  const canGoNext = validateStep(currentStep);
  const isLastStep = currentStep === 4;
  
  return (
    <div className="flex justify-between items-center pt-6 border-t">
      {/* Левая часть */}
      <div>
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Назад
          </button>
        )}
      </div>
      
      {/* Правая часть */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Отмена
        </button>
        
        {isLastStep ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Запуск...
              </>
            ) : (
              <>
                🚀 Запустить анализ
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canGoNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canGoNext ? 'Заполните все обязательные поля' : ''}
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
};
```

**Клавиатурные shortcuts:**
- `Enter` на шагах 1-3: переход на следующий шаг (если валидно)
- `Enter` на шаге 4: запуск анализа
- `Escape`: закрытие формы (с подтверждением)

---

## Задача 2: История запросов (2.1)

### Текущее состояние:
- Нет сохранения истории предыдущих запросов
- Пользователь должен вводить все параметры заново

### Что будет реализовано:

**Хранение истории в localStorage:**
```tsx
interface RequestHistory {
  id: string;
  timestamp: number;
  projectId: string;
  projectName: string;
  language: string;
  location: string;
  keywordsCount: number;
  // Первые 3 ключевых слова для превью
  keywordsPreview: string[];
}

// Максимум 5 последних запросов
const MAX_HISTORY = 5;
```

**UI компонент "История запросов":**

Показывается на **Шаге 1** (выбор проекта) в виде отдельной секции:

```tsx
const RequestHistoryPanel = () => {
  const [history, setHistory] = useState<RequestHistory[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('seo_request_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);
  
  const loadFromHistory = (item: RequestHistory) => {
    setFormData({
      projectId: item.projectId,
      language: item.language,
      location: item.location,
      keywords: '' // Ключевые слова не сохраняем для безопасности
    });
    setCurrentStep(3); // Переходим сразу на ввод ключевых слов
    toast.success('Настройки загружены из истории');
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Clock size={16} />
        Последние запросы
      </h3>
      
      {history.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          История запросов пуста
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
              onClick={() => loadFromHistory(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {item.projectName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.language} • {item.location} • {item.keywordsCount} слов
                  </div>
                  {item.keywordsPreview.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.keywordsPreview.join(', ')}...
                    </div>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-blue-600 text-white rounded text-sm transition-opacity"
                >
                  Использовать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Сохранение в историю:**
- Автоматически после успешного запуска анализа
- Только последние 5 запросов (FIFO)
- Дедупликация: если точно такие же параметры, обновляем timestamp

**Функции управления историей:**
```tsx
const saveToHistory = (data: FormData) => {
  const newItem: RequestHistory = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    projectId: data.projectId,
    projectName: data.projectName,
    language: data.language,
    location: data.location,
    keywordsCount: data.keywords.split('\n').filter(k => k.trim()).length,
    keywordsPreview: data.keywords.split('\n').slice(0, 3)
  };
  
  const existing = JSON.parse(localStorage.getItem('seo_request_history') || '[]');
  const updated = [newItem, ...existing].slice(0, MAX_HISTORY);
  
  localStorage.setItem('seo_request_history', JSON.stringify(updated));
};

const clearHistory = () => {
  localStorage.removeItem('seo_request_history');
  setHistory([]);
  toast.success('История очищена');
};
```

---

## Задача 3: Auto-save каждые 3 секунды (2.2)

### Текущее состояние:
- Если пользователь закроет форму, все данные теряются
- Нет автосохранения черновиков

### Что будет реализовано:

**Auto-save функционал:**

```tsx
// Хук для автосохранения
const useAutoSave = (data: FormData, delay: number = 3000) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      localStorage.setItem('seo_form_draft', JSON.stringify({
        data,
        timestamp: Date.now(),
        step: currentStep
      }));
      setLastSaved(new Date());
      setIsSaving(false);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [data, delay]);
  
  return { lastSaved, isSaving };
};

// Использование в компоненте
const { lastSaved, isSaving } = useAutoSave(formData);
```

**UI индикатор автосохранения:**

В шапке формы, справа:
```tsx
const AutoSaveIndicator = ({ lastSaved, isSaving }) => {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="animate-spin" size={14} />
        Сохранение...
      </div>
    );
  }
  
  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check size={14} />
        Сохранено {formatDistanceToNow(lastSaved, { locale: ru })}
      </div>
    );
  }
  
  return null;
};
```

**Восстановление черновика при открытии:**

```tsx
// При монтировании компонента
useEffect(() => {
  const draft = localStorage.getItem('seo_form_draft');
  if (draft) {
    const { data, timestamp, step } = JSON.parse(draft);
    
    // Показываем диалог только если черновик свежий (< 24 часов)
    const hoursSinceSave = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursSinceSave < 24) {
      setShowRestoreDialog(true);
      setDraftData({ data, step });
    } else {
      // Старый черновик - удаляем
      localStorage.removeItem('seo_form_draft');
    }
  }
}, []);

const handleRestoreDraft = () => {
  if (draftData) {
    setFormData(draftData.data);
    setCurrentStep(draftData.step);
    setShowRestoreDialog(false);
    toast.success('Черновик восстановлен');
  }
};

const handleDiscardDraft = () => {
  localStorage.removeItem('seo_form_draft');
  setShowRestoreDialog(false);
  toast.info('Черновик удален');
};
```

**Диалог восстановления черновика:**

```tsx
const RestoreDraftDialog = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Save className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Найден несохраненный черновик
            </h3>
            <p className="text-gray-600 mb-1">
              У вас есть незавершенная форма от{' '}
              {new Date(draftData.timestamp).toLocaleString('ru-RU')}
            </p>
            <p className="text-sm text-gray-500">
              Проект: <span className="font-medium">{draftData.data.projectName || 'не выбран'}</span>
            </p>
            {draftData.data.keywords && (
              <p className="text-sm text-gray-500">
                Ключевых слов: {draftData.data.keywords.split('\n').filter(k => k.trim()).length}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDiscardDraft}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Начать заново
          </button>
          <button
            onClick={handleRestoreDraft}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Продолжить редактирование
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Очистка черновика:**
- Автоматически удаляется после успешной отправки формы
- Можно удалить вручную через кнопку "Очистить черновик" в футере
- Удаляется при нажатии "Отмена" (с подтверждением)

---

## 📦 Структура файлов после реализации

```
components/
├── KeywordSubmitForm.tsx          # ← ОБНОВИТЬ: добавить wizard
├── SemanticClusterForm.tsx        # ← Оставить как есть (пока)
├── wizard/                        # ← НОВАЯ папка
│   ├── StepIndicator.tsx         # Прогресс-бар шагов
│   ├── FormNavigation.tsx        # Кнопки Назад/Далее
│   ├── steps/                    # ← Шаги wizard
│   │   ├── StepProject.tsx       # Шаг 1: выбор проекта
│   │   ├── StepSettings.tsx      # Шаг 2: язык и локация
│   │   ├── StepKeywords.tsx      # Шаг 3: ввод ключевых слов
│   │   └── StepConfirm.tsx       # Шаг 4: подтверждение
│   ├── RequestHistory.tsx        # История запросов
│   ├── RestoreDraftDialog.tsx    # Диалог восстановления
│   └── AutoSaveIndicator.tsx     # Индикатор автосохранения
└── ...

hooks/                             # ← НОВАЯ папка
└── useAutoSave.ts                # Хук для автосохранения

lib/
└── seo/                          # ← НОВАЯ папка
    ├── formValidation.ts         # Валидация шагов
    └── costEstimator.ts          # Расчет стоимости
```

---

## 🧪 Тестирование

### Сценарии для тестирования:

**Wizard:**
1. ✅ Проход через все 4 шага с валидными данными
2. ✅ Попытка перейти дальше с невалидными данными (должно быть заблокировано)
3. ✅ Возврат назад на предыдущий шаг (данные сохранены)
4. ✅ Отмена на середине заполнения (подтверждение)
5. ✅ Клавиша Enter для перехода на следующий шаг
6. ✅ Клавиша Escape для закрытия формы

**История:**
1. ✅ Сохранение в историю после успешного запуска
2. ✅ Загрузка из истории (параметры применены, переход на шаг 3)
3. ✅ Максимум 5 записей в истории
4. ✅ Очистка истории

**Auto-save:**
1. ✅ Черновик сохраняется каждые 3 секунды
2. ✅ Индикатор "Сохранение..." появляется
3. ✅ При повторном открытии формы показывается диалог восстановления
4. ✅ Восстановление черновика (данные и шаг)
5. ✅ Отклонение черновика
6. ✅ Черновик удаляется после успешной отправки
7. ✅ Старые черновики (>24ч) не восстанавливаются

---

## ⏱️ Оценка времени

| Задача | Время | Детали |
|--------|-------|--------|
| **1.1** Wizard-структура | 2 дня | Разделение на 4 шага, валидация |
| **1.2** Прогресс-бар | 1 день | StepIndicator компонент |
| **1.3** Навигация | 1 день | FormNavigation, keyboard shortcuts |
| **2.1** История запросов | 2 дня | localStorage, UI компонент |
| **2.2** Auto-save | 1 день | useAutoSave hook, индикаторы |
| **ИТОГО** | **7 дней** | Полная реализация всех 5 под-задач |

---

## 🎨 Дизайн-система

**Цвета:**
- Primary (шаги): `blue-600`
- Success (завершено): `green-600`
- Secondary (неактивно): `gray-300`
- Акцент (wizard): `gradient from-blue-600 to-purple-600`

**Анимации:**
- Переходы между шагами: `transition-all duration-300`
- Появление индикаторов: `fade-in`
- Spinner при сохранении: `animate-spin`

**Отступы:**
- Между шагами: `mb-8`
- В формах: `space-y-6`
- В футере: `gap-3`

---

## ✅ Чек-лист перед началом реализации

- [ ] Изучить текущую структуру KeywordSubmitForm
- [ ] Создать папку `components/wizard/`
- [ ] Создать папку `hooks/`
- [ ] Установить зависимости (date-fns для форматирования времени)
- [ ] Создать типы TypeScript для FormData и History
- [ ] Подготовить тестовые данные

---

## 📝 Примечания

- Все localStorage ключи начинаются с префикса `seo_` для избежания конфликтов
- Используем `react-hot-toast` для уведомлений (уже установлен)
- Иконки из `lucide-react` (уже установлен)
- Wizard должен работать и на мобильных устройствах (responsive)
- Accessibility: поддержка клавиатуры, ARIA-метки

