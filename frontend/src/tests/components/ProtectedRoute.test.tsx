import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import * as useAuthHook from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

const MockedUseAuth = useAuthHook as any;

describe('ProtectedRoute Component', () => {
  const TestChild = () => <div>Protected Content</div>;

  it('should show loading spinner while loading', () => {
    MockedUseAuth.useAuth = vi.fn(() => ({
      user: null,
      isLoading: true,
    }));

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    MockedUseAuth.useAuth = vi.fn(() => ({
      user: { id: 1, email: 'test@example.com' },
      isLoading: false,
    }));

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    MockedUseAuth.useAuth = vi.fn(() => ({
      user: null,
      isLoading: false,
    }));

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
