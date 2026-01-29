'use client';

import { useLocalStorage } from '@/lib/storage';
import { Recipe } from '@/lib/types';
import { ProgressBar } from './ProgressBar';

interface RecipeChecklistProps {
  recipe: Recipe;
}

export function RecipeChecklist({ recipe }: RecipeChecklistProps) {
  const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>(
    `recipe-${recipe.title}`,
    []
  );

  // Calculate progress
  const totalSteps = recipe.sections.reduce(
    (acc, section) => acc + section.steps.length,
    0
  );
  const completedCount = completedSteps.length;

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) {
        return prev.filter((id) => id !== stepId);
      }
      return [...prev, stepId];
    });
  };

  const formatIngredient = (ingredient: {
    name: string;
    quantity?: string;
    notes?: string;
  }) => {
    let text = '';
    // Filter out placeholder values like <UNKNOWN>
    if (ingredient.quantity && !ingredient.quantity.includes('UNKNOWN')) {
      text += ingredient.quantity + ' ';
    }
    text += ingredient.name;
    if (ingredient.notes) {
      text += ` (${ingredient.notes})`;
    }
    return text;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Progress bar */}
      <div className="mb-8">
        <ProgressBar completed={completedCount} total={totalSteps} />
      </div>

      {/* Ingredients section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="text-gray-300 text-lg">
              {formatIngredient(ingredient)}
            </li>
          ))}
        </ul>
      </section>

      {/* Sections (Prep, Cook, etc.) */}
      {recipe.sections.map((section) => (
        <section key={section.name}>
          <h2 className="text-xl font-semibold text-white mb-4 mt-8">
            {section.name}
          </h2>
          <div className="space-y-4">
            {section.steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              return (
                <label
                  key={step.id}
                  className="flex items-start gap-4 cursor-pointer py-2"
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleStep(step.id)}
                    className="h-7 w-7 shrink-0 accent-[#39FF6D] cursor-pointer mt-1"
                    aria-label={`Mark step as ${isCompleted ? 'incomplete' : 'complete'}: ${step.text}`}
                  />
                  <span
                    className={`text-lg md:text-xl transition-colors ${
                      isCompleted ? 'text-gray-400' : 'text-white'
                    }`}
                  >
                    {step.text}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
