'use client';

import { useState } from 'react';
import { RecipeInput } from '@/components/RecipeInput';
import { LoadingState } from '@/components/LoadingState';
import { RecipeChecklist } from '@/components/RecipeChecklist';
import { AdjustPanel } from '@/components/AdjustPanel';
import { parseRecipe } from '@/lib/api';
import type { Recipe } from '@/lib/types';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isAdjustPanelOpen, setIsAdjustPanelOpen] = useState(false);

  const handleSubmit = async (text: string) => {
    setTranscript(text);
    setIsLoading(true);
    setError(null);

    try {
      const parsedRecipe = await parseRecipe(text);
      setRecipe(parsedRecipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setRecipe(null);
    setTranscript('');
    setError(null);
    setIsAdjustPanelOpen(false);
  };

  const handleAdjust = (combinedTranscript: string) => {
    setIsAdjustPanelOpen(false);
    handleSubmit(combinedTranscript);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Parsing your recipe..." />;
  }

  // Show recipe checklist with adjust panel
  if (recipe) {
    return (
      <main className="min-h-screen">
        {/* Header bar with actions */}
        <header className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white truncate pr-4">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAdjustPanelOpen(true)}
                className="border border-[#39FF6D] text-[#39FF6D] px-4 py-2 rounded-lg hover:bg-[#39FF6D]/10 transition-colors text-sm font-medium"
              >
                Adjust
              </button>
              <button
                onClick={handleStartOver}
                className="text-gray-400 hover:text-white px-4 py-2 transition-colors text-sm"
              >
                Start over
              </button>
            </div>
          </div>
        </header>

        {/* Recipe checklist */}
        <RecipeChecklist recipe={recipe} />

        {/* Adjust panel */}
        <AdjustPanel
          isOpen={isAdjustPanelOpen}
          onClose={() => setIsAdjustPanelOpen(false)}
          originalTranscript={transcript}
          onAdjust={handleAdjust}
        />
      </main>
    );
  }

  // Show input form
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full px-4">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Recipe Checklist
          </h1>
          <RecipeInput
            onSubmit={handleSubmit}
            disabled={isLoading}
            error={error ?? undefined}
          />
        </div>
      </div>
    </main>
  );
}
