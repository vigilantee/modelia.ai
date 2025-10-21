import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRetry } from '../../hooks/useRetry';

describe('useRetry Hook', () => {
  it('should initialize with zero retry count', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should increment retry count on retry', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    act(() => {
      result.current.retry();
    });

    expect(result.current.retryCount).toBe(1);
    expect(result.current.canRetry).toBe(true);
  });

  it('should not allow retry after max retries reached', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    act(() => {
      result.current.retry();
      result.current.retry();
      result.current.retry();
    });

    expect(result.current.retryCount).toBe(3);
    expect(result.current.canRetry).toBe(false);
  });

  it('should not increment beyond max retries', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    act(() => {
      result.current.retry();
      result.current.retry();
      result.current.retry();
      result.current.retry(); // Should not increment
    });

    expect(result.current.retryCount).toBe(3);
  });

  it('should call onRetry callback with attempt number', () => {
    const onRetry = vi.fn();
    const { result } = renderHook(() => useRetry({ maxRetries: 3, onRetry }));

    act(() => {
      result.current.retry();
    });

    expect(onRetry).toHaveBeenCalledWith(1);

    act(() => {
      result.current.retry();
    });

    expect(onRetry).toHaveBeenCalledWith(2);
  });

  it('should reset retry count', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(result.current.retryCount).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should allow retry again after reset', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }));

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(result.current.canRetry).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.canRetry).toBe(true);
  });
});
