'use client';

import { useState } from 'react';
import { RecipeInput } from '@/components/RecipeInput';
import { LoadingState } from '@/components/LoadingState';
import { parseRecipe } from '@/lib/api';
import type { Recipe } from '@/lib/types';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (text: string) => {
    setTranscript(text);
    setIsLoading(true);
    setError(null);

    try {
      const parsedRecipe = await parseRecipe(text);
      setRecipe(parsedRecipe);
      console.log('Recipe parsed successfully:', parsedRecipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Parsing your recipe..." />;
  }

  // Show recipe (placeholder until Plan 03)
  if (recipe) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Recipe loaded!</h1>
          <p className="text-gray-300 text-lg mb-8">{recipe.title}</p>
          <button
            onClick={() => setRecipe(null)}
            className="rounded-xl bg-[#39FF6D] px-6 py-3 text-black font-semibold hover:bg-[#2dd15f] transition-colors"
          >
            Parse Another Recipe
          </button>
        </div>
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
