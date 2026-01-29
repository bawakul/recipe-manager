import { parseTranscript } from './claude';
import { pushToTrmnl } from './trmnl';
import { Env, Recipe } from './types';

// CORS headers for web app integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: POST /api/recipe/parse
    if (url.pathname === '/api/recipe/parse' && request.method === 'POST') {
      return handleParse(request, env);
    }

    // Route: POST /api/trmnl/push
    if (url.pathname === '/api/trmnl/push' && request.method === 'POST') {
      return handleTrmnlPush(request, env);
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function handleParse(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as { transcript?: string };

    if (!body.transcript || typeof body.transcript !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: transcript required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.transcript.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Transcript too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse transcript with Claude
    const recipe = await parseTranscript(body.transcript, env);

    // Auto-push to TRMNL after successful parse
    const trmnlResult = await pushToTrmnl(recipe, env);

    // Merge TRMNL result into response
    const response: Record<string, unknown> = {
      ...recipe
    };

    if (trmnlResult.trmnl_pushed) {
      response.trmnl_pushed = true;
    }

    if (trmnlResult.warnings) {
      response.warnings = trmnlResult.warnings;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error parsing recipe:', errorMessage, errorStack);

    // Check for rate limit errors
    if (errorMessage.includes('429')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for transcript too long
    if (errorMessage.includes('too complex')) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return actual error for debugging (remove in production)
    return new Response(
      JSON.stringify({ error: 'Failed to parse recipe', debug: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleTrmnlPush(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as { recipe?: Recipe };

    if (!body.recipe || typeof body.recipe !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: recipe object required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate recipe has required fields
    if (!body.recipe.title || !body.recipe.sections) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipe: title and sections required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Push to TRMNL
    const result = await pushToTrmnl(body.recipe, env);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error pushing to TRMNL:', errorMessage);

    return new Response(
      JSON.stringify({ error: 'Failed to push to TRMNL', debug: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
