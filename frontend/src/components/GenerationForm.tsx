import { useState, FormEvent, ChangeEvent } from "react";
import { generationService } from "../services/api.service";
import type { Generation } from "../types";
import { Upload, X } from "lucide-react";

interface GenerationFormProps {
  onGenerationCreated: (generation: Generation) => void;
}

export default function GenerationForm({
  onGenerationCreated,
}: GenerationFormProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!image) {
      setError("Please select an image");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    try {
      const { generation } = await generationService.create({
        image,
        prompt: prompt.trim(),
      });

      onGenerationCreated(generation);

      setImage(null);
      setImagePreview(null);
      setPrompt("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create generation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Create Generation
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>

          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WEBP (Max 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
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
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
          />
          <p className="mt-1 text-sm text-gray-500">
            {prompt.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !image || !prompt.trim()}
          className="btn-primary w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </span>
          ) : (
            "Generate"
          )}
        </button>
      </form>
    </div>
  );
}
