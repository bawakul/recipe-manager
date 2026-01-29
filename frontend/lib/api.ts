import type { Recipe } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export class RecipeAPIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'RecipeAPIError';
    this.status = status;
  }
}

export async function parseRecipe(transcript: string): Promise<Recipe> {
  const response = await fetch(`${API_URL}/api/recipe/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    let message = 'Failed to parse recipe';
    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch {
      // Use default message if JSON parsing fails
    }
    throw new RecipeAPIError(response.status, message);
  }

  return response.json();
}
