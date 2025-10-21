import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GenerationList from '../../components/GenerationList';
import { Generation } from '../../types';

describe('GenerationList Component', () => {
  const mockGenerations: Generation[] = [
    {
      id: 1,
      status: 'completed',
      prompt: 'Test prompt 1',
      style: 'realistic',
      inputImageUrl: '/uploads/test1.jpg',
      outputImageUrl: '/uploads/output1.jpg',
      retryCount: 0,
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      status: 'processing',
      prompt: 'Test prompt 2',
      style: 'artistic',
      inputImageUrl: '/uploads/test2.jpg',
      retryCount: 0,
      createdAt: '2025-01-01T00:01:00Z',
    },
    {
      id: 3,
      status: 'failed',
      prompt: 'Test prompt 3',
      style: 'vintage',
      inputImageUrl: '/uploads/test3.jpg',
      errorMessage: 'Model overloaded',
      retryCount: 2,
      createdAt: '2025-01-01T00:02:00Z',
    },
  ];

  it('should render empty state when no generations', () => {
    render(<GenerationList generations={[]} />);

    expect(screen.getByText(/no generations yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first generation/i)).toBeInTheDocument();
  });

  it('should render all generations', () => {
    render(<GenerationList generations={mockGenerations} />);

    expect(screen.getByText('Test prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Test prompt 2')).toBeInTheDocument();
    expect(screen.getByText('Test prompt 3')).toBeInTheDocument();
  });

  it('should show correct status badges', () => {
    render(<GenerationList generations={mockGenerations} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should display styles correctly', () => {
    render(<GenerationList generations={mockGenerations} />);

    expect(screen.getByText('realistic')).toBeInTheDocument();
    expect(screen.getByText('artistic')).toBeInTheDocument();
    expect(screen.getByText('vintage')).toBeInTheDocument();
  });

  it('should show error message for failed generation', () => {
    render(<GenerationList generations={mockGenerations} />);

    expect(screen.getByText(/model overloaded/i)).toBeInTheDocument();
  });

  it('should display retry count for failed generation', () => {
    render(<GenerationList generations={mockGenerations} />);

    expect(screen.getByText(/2 retries/i)).toBeInTheDocument();
  });

  it('should call onRestore when clicking card', () => {
    const mockOnRestore = vi.fn();
    render(<GenerationList generations={mockGenerations} onRestore={mockOnRestore} />);

    const firstCard = screen.getByText('Test prompt 1').closest('div[role="button"]');
    fireEvent.click(firstCard!);

    expect(mockOnRestore).toHaveBeenCalledWith(mockGenerations[0]);
  });

  it('should call onRestore with Enter key', () => {
    const mockOnRestore = vi.fn();
    render(<GenerationList generations={mockGenerations} onRestore={mockOnRestore} />);

    const firstCard = screen.getByText('Test prompt 1').closest('div[role="button"]');
    fireEvent.keyDown(firstCard!, { key: 'Enter' });

    expect(mockOnRestore).toHaveBeenCalledWith(mockGenerations[0]);
  });

  it('should call onRestore with Space key', () => {
    const mockOnRestore = vi.fn();
    render(<GenerationList generations={mockGenerations} onRestore={mockOnRestore} />);

    const firstCard = screen.getByText('Test prompt 1').closest('div[role="button"]');
    fireEvent.keyDown(firstCard!, { key: ' ' });

    expect(mockOnRestore).toHaveBeenCalledWith(mockGenerations[0]);
  });

  it('should show loading spinner for processing generation', () => {
    render(<GenerationList generations={mockGenerations} />);

    const processingCard = screen.getByText('Test prompt 2').closest('div');
    expect(processingCard?.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render correct number of generations', () => {
    render(<GenerationList generations={mockGenerations} />);

    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(3);
  });
});
