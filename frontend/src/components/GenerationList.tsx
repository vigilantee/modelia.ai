import { Generation } from '../types';
import { Loader2, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

interface GenerationListProps {
  generations: Generation[];
  onRestore?: (generation: Generation) => void;
}

export default function GenerationList({ generations, onRestore }: GenerationListProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">No generations yet</p>
        <p className="text-sm text-gray-500 mt-1">Create your first generation to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {generations.map((generation) => (
        <GenerationCard key={generation.id} generation={generation} onRestore={onRestore} />
      ))}
    </div>
  );
}

function GenerationCard({
  generation,
  onRestore,
}: {
  generation: Generation;
  onRestore?: (generation: Generation) => void;
}) {
  const getStatusIcon = () => {
    switch (generation.status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (generation.status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };

  const getStatusColor = () => {
    switch (generation.status) {
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onRestore?.(generation)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onRestore?.(generation);
        }
      }}
      aria-label={`Restore generation: ${generation.prompt}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {new Date(generation.createdAt).toLocaleString()}
          </span>
          {onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(generation);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Restore this generation"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2">
        <span className="text-xs font-medium text-gray-500">Style:</span>
        <span className="text-xs text-gray-700 ml-2 capitalize">{generation.style}</span>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{generation.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Input</p>
          <img
            src={`http://localhost:3001${generation.inputImageUrl}`}
            alt="Input"
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Output</p>
          {generation.status === 'processing' ? (
            <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : generation.status === 'completed' && generation.outputImageUrl ? (
            <img
              src={`http://localhost:3001${generation.outputImageUrl}`}
              alt="Output"
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {generation.status === 'failed' && generation.errorMessage && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {generation.errorMessage}
          {generation.retryCount > 0 && (
            <span className="ml-2">({generation.retryCount} retries)</span>
          )}
        </div>
      )}
    </div>
  );
}
