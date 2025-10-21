import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import * as apiService from '../../services/api.service';

vi.mock('../../services/api.service');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with null user and isLoading true', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should login successfully', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com' },
      token: 'mock-token',
    };

    vi.spyOn(apiService.authService, 'login').mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.login('test@example.com', 'password123');

    expect(result.current.user).toEqual(mockResponse.user);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should register successfully', async () => {
    const mockResponse = {
      user: { id: 1, email: 'test@example.com' },
      token: 'mock-token',
    };

    vi.spyOn(apiService.authService, 'register').mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.register('test@example.com', 'password123');

    expect(result.current.user).toEqual(mockResponse.user);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should logout successfully', async () => {
    localStorage.setItem('token', 'mock-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.logout();

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
