import { Recipe } from './types';
import { Env } from './types';

// TRMNL payload structure with merge_variables wrapper
interface TrmnlPayload {
  merge_variables: {
    recipe_title: string;
    sections: Array<{
      name: string;
      steps: string[];
    }>;
    step_count: number;
    truncated: boolean;
  };
}

// Payload measurement result
interface PayloadMeasurement {
  serialized: string;
  bytes: number;
}

// Result of TRMNL push operation
interface TrmnlResult {
  success: true;
  trmnl_pushed?: boolean;
  warnings?: string[];
}

/**
 * Format recipe for TRMNL display
 * - Removes ingredients (implied in steps per CONTEXT.md)
 * - Truncates title to 40 chars
 * - Truncates each step to 80 chars
 * - Returns merge_variables structure for Liquid templates
 */
export function formatForTrmnl(recipe: Recipe): TrmnlPayload {
  const payload: TrmnlPayload = {
    merge_variables: {
      recipe_title: recipe.title.substring(0, 40),
      sections: recipe.sections.map(section => ({
        name: section.name,
        steps: section.steps.map(step => step.text.substring(0, 80))
      })),
      step_count: recipe.sections.reduce((sum, section) => sum + section.steps.length, 0),
      truncated: false
    }
  };

  return payload;
}

/**
 * Measure payload size in bytes using TextEncoder for accurate UTF-8 count
 * (Not string.length which counts UTF-16 characters)
 */
export function measurePayload(obj: unknown): PayloadMeasurement {
  const serialized = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(serialized).length;
  return { serialized, bytes };
}

/**
 * Compress payload to fit within 2kb limit
 * Progressive truncation strategy:
 * 1. Shorten step text to 60 chars
 * 2. Reduce to 8 steps total
 * 3. Reduce to 6 steps total
 * Sets truncated flag when compression applied
 */
export function compressPayload(payload: TrmnlPayload): TrmnlPayload {
  const { bytes: initialBytes } = measurePayload(payload);

  if (initialBytes <= 2048) {
    return payload;
  }

  console.log(`Payload size ${initialBytes} bytes, compressing...`);

  // Strategy 1: Shorten step text to 60 chars
  payload.merge_variables.sections = payload.merge_variables.sections.map(section => ({
    ...section,
    steps: section.steps.map(step => step.substring(0, 60))
  }));
  payload.merge_variables.truncated = true;

  let { bytes } = measurePayload(payload);

  if (bytes <= 2048) {
    console.log(`Compressed to ${bytes} bytes (shortened steps)`);
    return payload;
  }

  // Strategy 2: Reduce to 8 steps total
  let stepCount = 0;
  payload.merge_variables.sections = payload.merge_variables.sections
    .map(section => {
      const remainingSteps = 8 - stepCount;
      if (remainingSteps <= 0) return null;

      const steps = section.steps.slice(0, remainingSteps);
      stepCount += steps.length;

      return steps.length > 0 ? { ...section, steps } : null;
    })
    .filter((section): section is { name: string; steps: string[] } => section !== null);

  payload.merge_variables.step_count = stepCount;
  bytes = measurePayload(payload).bytes;

  if (bytes <= 2048) {
    console.log(`Compressed to ${bytes} bytes (8 steps)`);
    return payload;
  }

  // Strategy 3: Reduce to 6 steps total
  stepCount = 0;
  payload.merge_variables.sections = payload.merge_variables.sections
    .map(section => {
      const remainingSteps = 6 - stepCount;
      if (remainingSteps <= 0) return null;

      const steps = section.steps.slice(0, remainingSteps);
      stepCount += steps.length;

      return steps.length > 0 ? { ...section, steps } : null;
    })
    .filter((section): section is { name: string; steps: string[] } => section !== null);

  payload.merge_variables.step_count = stepCount;
  bytes = measurePayload(payload).bytes;

  console.log(`Compressed to ${bytes} bytes (6 steps)`);
  return payload;
}

/**
 * Push recipe to TRMNL display via webhook
 * - Formats and compresses payload
 * - POSTs to TRMNL_WEBHOOK_URL
 * - Never throws - always returns success with optional warnings
 * - Handles missing webhook URL gracefully
 * - Catches 429 rate limit errors
 */
export async function pushToTrmnl(recipe: Recipe, env: Env): Promise<TrmnlResult> {
  // Handle missing webhook URL
  if (!env.TRMNL_WEBHOOK_URL) {
    return {
      success: true,
      warnings: ['TRMNL webhook URL not configured. Recipe parsed successfully but not pushed to display.']
    };
  }

  try {
    // Format and compress payload
    let payload = formatForTrmnl(recipe);
    payload = compressPayload(payload);

    // POST to TRMNL webhook
    const response = await fetch(env.TRMNL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Handle rate limit (429)
    if (response.status === 429) {
      return {
        success: true,
        warnings: ['TRMNL rate limit reached (12/hour). Display will update after hourly reset.']
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      return {
        success: true,
        warnings: [`TRMNL push failed (HTTP ${response.status}). Recipe parsed successfully.`]
      };
    }

    // Success
    return {
      success: true,
      trmnl_pushed: true
    };

  } catch (error) {
    // Handle network errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: true,
      warnings: [`TRMNL push failed (${errorMessage}). Recipe parsed successfully.`]
    };
  }
}
