import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { RecipeSchema, Recipe, Env } from './types';

const SYSTEM_PROMPT = `You are a recipe parser. Extract structured recipe data from rambling voice transcripts.

Handle gracefully:
- Filler words (um, uh, like, you know)
- Self-corrections (no wait, actually, I mean)
- Non-linear ordering (ingredients mentioned mid-step)
- Transcription errors (use context to infer correct words)
- Incomplete thoughts (fill in reasonable defaults)

Extract sections in order: Prep (if applicable), Marinate (if applicable), Cook, Assemble (if applicable).
Not every recipe needs all sections - only include what's relevant.
Generate sequential step IDs (step-1, step-2, etc.) across all sections.
Extract ALL ingredients mentioned, even if scattered throughout the transcript.`;

export async function parseTranscript(
  transcript: string,
  env: Env
): Promise<Recipe> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Parse this voice transcript into a structured recipe:\n\n<transcript>${transcript}</transcript>`
    }],
    tools: [{
      name: 'recipe_output',
      description: 'Output the parsed recipe in structured format',
      input_schema: zodToJsonSchema(RecipeSchema) as Anthropic.Tool['input_schema']
    }],
    tool_choice: { type: 'tool', name: 'recipe_output' }
  });

  // Check for max_tokens cutoff
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Recipe too complex or transcript too long');
  }

  // Extract tool use result
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('Failed to parse recipe: no structured output returned');
  }

  // Validate and return the recipe
  const parsed = RecipeSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Invalid recipe structure: ${parsed.error.message}`);
  }

  return parsed.data;
}
