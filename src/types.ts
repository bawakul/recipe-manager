import { z } from 'zod';

// Step in a recipe section
export const StepSchema = z.object({
  id: z.string().describe('Unique step ID like "step-1"'),
  text: z.string().describe('The instruction text'),
  completed: z.boolean().default(false)
});

// Ingredient with optional quantity
export const IngredientSchema = z.object({
  name: z.string().describe('Ingredient name'),
  quantity: z.string().optional().describe('Amount needed'),
  notes: z.string().optional().describe('Prep notes like "diced" or "room temperature"')
});

// Section of a recipe (Prep, Marinate, Cook, Assemble)
export const SectionSchema = z.object({
  name: z.enum(['Prep', 'Marinate', 'Cook', 'Assemble']).describe('Section type'),
  steps: z.array(StepSchema).describe('Steps in this section')
});

// Complete recipe structure
export const RecipeSchema = z.object({
  title: z.string().describe('Recipe name derived from transcript'),
  sections: z.array(SectionSchema).describe('Recipe sections in execution order'),
  ingredients: z.array(IngredientSchema).describe('All ingredients extracted from transcript')
});

// TypeScript types derived from Zod schemas
export type Step = z.infer<typeof StepSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;

// Worker environment type
export interface Env {
  ANTHROPIC_API_KEY: string;
  TRMNL_WEBHOOK_URL?: string; // Optional - not all deployments need TRMNL integration
}
