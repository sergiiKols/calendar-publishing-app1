/**
 * Retry Hook - Повторные попытки при ошибках API
 */

import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
  onError?: (error: Error, attempt: number) => void;
}

interface RetryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  attempt: number;
  retry: () => Promise<T>;
  execute: () => Promise<T>;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): RetryResult<T> {
  const {
    maxAttempts = 3,
    delay = 5000,
    onRetry,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const execute = useCallback(async (): Promise<T> => {
    setLoading(true);
    setError(null);
    setAttempt(1);

    try {
      const result = await fn();
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка');
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [fn]);

  const retry = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let i = 1; i <= maxAttempts; i++) {
      setAttempt(i);
      onRetry?.(i);

      try {
        const result = await fn();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Неизвестная ошибка');
        onError?.(lastError, i);

        if (i < maxAttempts) {
          // Ждем перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, delay * i));
        }
      }
    }

    setLoading(false);
    setError(lastError);
    throw lastError!;
  }, [fn, maxAttempts, delay, onRetry, onError]);

  return {
    data,
    loading,
    error,
    attempt,
    retry,
    execute,
  };
}

/**
 * Хук для ожидания очереди API
 */
export function useQueueWaiter() {
  const [waiting, setWaiting] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const waitForQueue = useCallback(async (position: number, estimatedSeconds: number) => {
    setWaiting(true);
    setQueuePosition(position);
    setEstimatedTime(estimatedSeconds);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setWaiting(false);
        setQueuePosition(0);
        setEstimatedTime(0);
        resolve();
      }, estimatedSeconds * 1000);
    });
  }, []);

  return {
    waiting,
    queuePosition,
    estimatedTime,
    waitForQueue,
  };
}

/**
 * Компонент для отображения состояния ожидания очереди
 */
export function QueueWaitingIndicator({
  position,
  estimatedSeconds,
  onSwitchToLive,
}: {
  position: number;
  estimatedSeconds: number;
  onSwitchToLive?: () => void;
}) {
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900">Ожидание в очереди</h4>
          <p className="text-sm text-blue-800 mt-1">
            Ваш запрос в Standard queue
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Позиция в очереди:</span>
              <span className="font-semibold">{position}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ожидаемое время:</span>
              <span className="font-semibold">
                {minutes > 0 ? `${minutes} мин ${seconds} сек` : `${seconds} сек`}
              </span>
            </div>
          </div>
          {onSwitchToLive && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs text-gray-600 mb-2">
                Можно переключить на Live (+$1.40):
              </p>
              <button
                onClick={onSwitchToLive}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Переключить на Live
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент для отображения ошибки с кнопкой повтора
 */
export function RetryErrorDialog({
  error,
  attempt,
  maxAttempts,
  onRetry,
  onCancel,
}: {
  error: Error;
  attempt: number;
  maxAttempts: number;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-900">Ошибка API</h4>
          <p className="text-sm text-red-800 mt-1">
            {error.message}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Попытка:</span>
              <span className="font-semibold">{attempt}/{maxAttempts}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Повторить
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}