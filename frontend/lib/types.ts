// Recipe types mirrored from Cloudflare Worker (src/types.ts)
// Keep in sync manually - these must match the API response schema

export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export interface Ingredient {
  name: string;
  quantity?: string;
  notes?: string;
}

export type SectionName = 'Prep' | 'Marinate' | 'Cook' | 'Assemble';

export interface Section {
  name: SectionName;
  steps: Step[];
}

export interface Recipe {
  title: string;
  sections: Section[];
  ingredients: Ingredient[];
}
