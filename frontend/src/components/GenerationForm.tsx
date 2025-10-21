import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { generationService } from '../services/api.service';
import type { Generation, StyleOption } from '../types';
import { Upload, X, RefreshCw, StopCircle } from 'lucide-react';
import { useRetry } from '../hooks/useRetry';

interface GenerationFormProps {
  onGenerationCreated: (generation: Generation) => void;
  onRestoreGeneration?: (generation: Generation) => void;
  restoredGeneration?: Generation | null;
}

// Keeping this interface for reference, though the usage is simplified below.
interface ErrorInterface {
  name: string;
  response?: {
    data?: {
      error: string;
    };
  };
}

const STYLE_OPTIONS: { value: StyleOption; label: string }[] = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'modern', label: 'Modern' },
];

export default function GenerationForm({
  onGenerationCreated,
  restoredGeneration,
}: GenerationFormProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleOption>('realistic');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { retryCount, canRetry, retry, reset } = useRetry({
    maxRetries: 3,
    onRetry: (attempt) => {
      console.log(`Retry attempt ${attempt}`);
      handleSubmit(null, true);
    },
  });

  // Restore generation effect
  useState(() => {
    if (restoredGeneration) {
      setPrompt(restoredGeneration.prompt);
      setStyle(restoredGeneration.style as StyleOption);
      setImagePreview(`http://localhost:3001${restoredGeneration.inputImageUrl}`);
    }
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError('Please select a JPEG or PNG image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError('');
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSubmitting(false);
      setError('Generation cancelled');
    }
  };

  const handleSubmit = async (e: FormEvent | null, isRetry: boolean = false) => {
    if (e) e.preventDefault();
    setError('');

    if (!image && !restoredGeneration) {
      setError('Please select an image');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!isRetry) {
      reset();
    }

    setIsSubmitting(true);
    abortControllerRef.current = new AbortController();

    try {
      const imageToUse =
        image ||
        (restoredGeneration ? await fetchImageAsFile(restoredGeneration.inputImageUrl) : null);

      if (!imageToUse) {
        throw new Error('No image available');
      }

      const { generation } = await generationService.create(
        {
          image: imageToUse,
          prompt: prompt.trim(),
          style,
        },
        abortControllerRef.current.signal
      );

      onGenerationCreated(generation);

      if (!isRetry) {
        setImage(null);
        setImagePreview(null);
        setPrompt('');
        setStyle('realistic');
      }
    } catch (err: unknown) {
      // FIX: Use standard unknown type for caught error
      // Safely cast error to a type that includes the properties we need (name, response)
      const typedError = err as ErrorInterface;

      if (typedError.name === 'CanceledError' || typedError.name === 'AbortError') {
        return;
      }

      const errorMessage = typedError.response?.data?.error || 'Failed to create generation';
      setError(errorMessage);

      if (errorMessage.includes('overload') && canRetry) {
        setError(`${errorMessage} (Retry ${retryCount + 1}/3 available)`);
      }
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const fetchImageAsFile = async (url: string): Promise<File> => {
    const response = await window.fetch(`http://localhost:3001${url}`);
    const blob = await response.blob();
    return new File([blob], 'restored-image.jpg', { type: blob.type });
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Generation</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-start">
          <span>{error}</span>
          {error.includes('overload') && canRetry && (
            <button
              onClick={retry}
              className="ml-2 text-red-700 hover:text-red-900 flex items-center gap-1"
              disabled={isSubmitting}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image (JPEG/PNG, max 10MB)
          </label>

          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JPEG or PNG (Max 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </label>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isSubmitting}
                aria-label="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleOption)}
            className="input-field"
            disabled={isSubmitting}
          >
            {STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="input-field resize-none"
            rows={4}
            placeholder="Describe what you want to generate... (e.g., 'A model wearing a red dress on a runway')"
            disabled={isSubmitting}
            maxLength={500}
            aria-label="Generation prompt"
          />
          <p className="mt-1 text-sm text-gray-500">{prompt.length}/500 characters</p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !image || !prompt.trim()}
            className="btn-primary flex-1"
            aria-label="Generate image"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              'Generate'
            )}
          </button>

          {isSubmitting && (
            <button
              type="button"
              onClick={handleAbort}
              className="btn-secondary flex items-center gap-2"
              aria-label="Abort generation"
            >
              <StopCircle className="w-5 h-5" />
              Abort
            </button>
          )}
        </div>

        {retryCount > 0 && <p className="text-sm text-gray-600">Retry attempts: {retryCount}/3</p>}
      </form>
    </div>
  );
}
