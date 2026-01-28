import { parseTranscript } from './claude';
import { Env } from './types';

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

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error parsing recipe:', error);

    // Check for rate limit errors
    if (error instanceof Error && error.message.includes('429')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for transcript too long
    if (error instanceof Error && error.message.includes('too complex')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to parse recipe. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
