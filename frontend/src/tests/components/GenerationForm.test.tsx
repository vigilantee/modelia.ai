import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GenerationForm from '../../components/GenerationForm';
import * as apiService from '../../services/api.service';

vi.mock('../../services/api.service');

describe('GenerationForm Component', () => {
  const mockOnGenerationCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form elements', () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    expect(screen.getByText('Create Generation')).toBeInTheDocument();
    expect(screen.getByText(/upload image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('should disable generate button when no image', () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const generateButton = screen.getByRole('button', { name: /generate/i });
    expect(generateButton).toBeDisabled();
  });

  it('should render all style options', () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const styleSelect = screen.getByLabelText(/style/i) as HTMLSelectElement;
    const options = Array.from(styleSelect.options).map((opt) => opt.value);

    expect(options).toContain('realistic');
    expect(options).toContain('artistic');
    expect(options).toContain('vintage');
    expect(options).toContain('modern');
  });

  it('should show error for invalid file type', async () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/please select a jpeg or png/i)).toBeInTheDocument();
    });
  });

  it('should show error for file too large', async () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/must be less than 10mb/i)).toBeInTheDocument();
    });
  });

  it('should update character count as user types', () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const textarea = screen.getByLabelText(/prompt/i);
    fireEvent.change(textarea, { target: { value: 'Test prompt here' } });

    expect(screen.getByText(/16\/500 characters/i)).toBeInTheDocument();
  });

  it('should not allow more than 500 characters', () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const textarea = screen.getByLabelText(/prompt/i) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(500);
  });

  it('should show error when submitting without prompt', async () => {
    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const generateButton = screen.getByRole('button', { name: /generate/i });

    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument();
    });
  });

  it('should display retry button on overload error', async () => {
    vi.spyOn(apiService.generationService, 'create').mockRejectedValue({
      response: { data: { error: 'Model overloaded' } },
    });

    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    const textarea = screen.getByLabelText(/prompt/i);
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });

    const generateButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/model overloaded/i)).toBeInTheDocument();
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });

  it('should show retry count', async () => {
    vi.spyOn(apiService.generationService, 'create').mockRejectedValue({
      response: { data: { error: 'Model overloaded' } },
    });

    render(<GenerationForm onGenerationCreated={mockOnGenerationCreated} />);

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    const textarea = screen.getByLabelText(/prompt/i);
    fireEvent.change(textarea, { target: { value: 'Test' } });

    const generateButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/retry 1\/3/i)).toBeInTheDocument();
    });
  });
});
