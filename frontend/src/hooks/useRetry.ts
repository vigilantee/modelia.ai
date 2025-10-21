import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries: number;
  onRetry?: (attempt: number) => void;
}

export function useRetry({ maxRetries, onRetry }: UseRetryOptions) {
  const [retryCount, setRetryCount] = useState(0);

  const canRetry = retryCount < maxRetries;

  const retry = useCallback(() => {
    if (canRetry) {
      const newCount = retryCount + 1;
      setRetryCount(newCount);
      onRetry?.(newCount);
    }
  }, [retryCount, canRetry, onRetry]);

  const reset = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    retryCount,
    canRetry,
    retry,
    reset,
  };
}
