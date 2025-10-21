import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { generationService } from '../services/api.service';
import GenerationForm from '../components/GenerationForm';
import GenerationList from '../components/GenerationList';
import type { Generation } from '../types';
import { Sparkles, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingGenerations, setPollingGenerations] = useState<Set<number>>(new Set());
  const [restoredGeneration, setRestoredGeneration] = useState<Generation | null>(null);

  const loadGenerations = async () => {
    try {
      const { generations: data } = await generationService.getRecent(5);
      setGenerations(data);

      const processing = data.filter((g) => g.status === 'processing').map((g) => g.id);
      if (processing.length > 0) {
        setPollingGenerations(new Set(processing));
      }
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGenerations();
  }, []);

  useEffect(() => {
    if (pollingGenerations.size === 0) return;

    // Fixed: Explicitly use window.setInterval to resolve 'no-undef' error (Line 39)
    const interval = window.setInterval(async () => {
      const updatedGenerations = [...generations];
      let hasChanges = false;

      for (const id of pollingGenerations) {
        try {
          const { generation } = await generationService.getById(id);
          const index = updatedGenerations.findIndex((g) => g.id === id);

          if (index !== -1) {
            updatedGenerations[index] = generation;

            if (generation.status !== 'processing') {
              pollingGenerations.delete(id);
              hasChanges = true;
            }
          }
        } catch (error) {
          console.error(`Failed to poll generation ${id}:`, error);
        }
      }

      if (hasChanges) {
        setGenerations(updatedGenerations);
        setPollingGenerations(new Set(pollingGenerations));
      }
    }, 2000);

    // Fixed: Explicitly use window.clearInterval to resolve 'no-undef' error (Line 67)
    return () => window.clearInterval(interval);
  }, [pollingGenerations, generations]);

  const handleGenerationCreated = (newGeneration: Generation) => {
    setGenerations((prev) => [newGeneration, ...prev].slice(0, 5));
    setPollingGenerations((prev) => new Set(prev).add(newGeneration.id));
  };

  const handleRestoreGeneration = (generation: Generation) => {
    setRestoredGeneration(generation);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <GenerationForm
              onGenerationCreated={handleGenerationCreated}
              restoredGeneration={restoredGeneration}
            />
          </div>

          <div>
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Generations</h2>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <GenerationList generations={generations} onRestore={handleRestoreGeneration} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
