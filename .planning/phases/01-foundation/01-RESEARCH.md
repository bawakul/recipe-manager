# Phase 1: Foundation - Research

**Researched:** 2026-01-28
**Domain:** Cloudflare Workers API + Claude API integration for voice transcript parsing
**Confidence:** HIGH

## Summary

Phase 1 requires building a Cloudflare Worker that accepts rambling voice transcripts and returns structured recipe JSON using Claude API's structured outputs feature. The research confirms this is a well-supported, production-ready approach with clear implementation patterns.

**Key findings:**
- Claude API's structured outputs (beta since Dec 2025) guarantees valid JSON matching your schema without prompt engineering gymnastics
- Cloudflare Workers provides a mature edge computing platform with strong TypeScript/JavaScript support
- The @anthropic-ai/sdk TypeScript SDK includes Zod integration for type-safe schema definitions
- JSON schema validation in Workers requires eval-free libraries (Cabidela or @cfworker/json-schema)
- Secrets management through Wrangler provides secure API key handling

The standard approach is: Worker receives POST → calls Claude API with structured output schema → validates response → returns JSON. No custom parsers, no brittle regex, no retry loops for malformed JSON.

**Primary recommendation:** Use Claude Sonnet 4.5 with structured outputs (`output_format` with JSON schema) via @anthropic-ai/sdk, deployed as a Cloudflare Worker with Wrangler CLI. This provides guaranteed-valid JSON responses with minimal code.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | Latest (2026) | Claude API client | Official SDK with structured outputs support, Zod integration |
| wrangler | 3.x | Cloudflare Workers CLI | Official CLI for development, testing, deployment |
| zod | 3.x | Schema validation | Industry standard for TypeScript runtime validation, native SDK support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cloudflare/cabidela | Latest | JSON schema validation | Response validation in Worker (eval-free, Workers-compatible) |
| hono | 4.x | Web framework for Workers | If building multiple endpoints (optional for single endpoint) |
| @cloudflare/vitest-pool-workers | Latest | Testing framework | Unit/integration testing before deployment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude structured outputs | Prompt engineering + JSON.parse | Fragile, requires retry logic, no guarantees |
| Cloudflare Workers | AWS Lambda / Vercel Functions | Slower cold starts, different deployment model |
| Cabidela | @cfworker/json-schema | More features but slightly slower for single validations |
| Zod | Raw JSON Schema | No TypeScript integration, manual type definitions |

**Installation:**
```bash
npm install @anthropic-ai/sdk zod
npm install -D wrangler @cloudflare/vitest-pool-workers
```

## Architecture Patterns

### Recommended Project Structure
```
/
├── src/
│   ├── index.ts              # Worker entry point (fetch handler)
│   ├── claude.ts             # Claude API client and schema
│   └── types.ts              # TypeScript types and Zod schemas
├── wrangler.toml             # Worker configuration
├── .dev.vars                 # Local secrets (gitignored)
└── package.json
```

### Pattern 1: Structured Output with Zod Schema

**What:** Define your recipe structure using Zod, transform to Claude-compatible schema
**When to use:** Always - provides TypeScript type safety + runtime validation + API schema in one definition

**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

const RecipeSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    name: z.enum(['Prep', 'Marinate', 'Cook', 'Assemble']),
    steps: z.array(z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean().default(false)
    }))
  })),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional()
  }))
});

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const response = await client.beta.messages.parse({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  betas: ["structured-outputs-2025-11-13"],
  messages: [{
    role: "user",
    content: `Parse this voice transcript into a recipe: ${transcript}`
  }],
  output_format: betaZodOutputFormat(RecipeSchema)
});

// response.parsed_output is typed and validated
return response.parsed_output;
```

### Pattern 2: Worker Fetch Handler with Error Handling

**What:** Standard Cloudflare Worker entry point with proper error boundaries
**When to use:** Every Worker - handles request/response lifecycle

**Example:**
```typescript
// Source: https://developers.cloudflare.com/workers/examples/
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { transcript } = await request.json();

      if (!transcript || typeof transcript !== 'string') {
        return new Response('Invalid request: transcript required', { status: 400 });
      }

      const recipe = await parseRecipe(transcript, env);

      return new Response(JSON.stringify(recipe), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error parsing recipe:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
```

### Pattern 3: Secrets Management for API Keys

**What:** Store Claude API key as Worker secret, access via env parameter
**When to use:** Always for sensitive credentials

**Example:**
```bash
# Source: https://developers.cloudflare.com/workers/configuration/secrets/
# Add secret via Wrangler
npx wrangler secret put ANTHROPIC_API_KEY

# Local development: .dev.vars file (gitignored)
ANTHROPIC_API_KEY="sk-ant-..."

# Access in Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    // ...
  }
};
```

### Pattern 4: Prompt Engineering for Rambling Input

**What:** Use XML tags and clear instructions to handle messy voice transcripts
**When to use:** When structured outputs alone need help understanding unstructured input

**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
const systemPrompt = `You are a recipe parser. Extract structured recipe data from rambling voice transcripts.

Handle:
- Filler words ("um", "uh", "like")
- Self-corrections ("actually no, wait")
- Non-linear ordering (ingredients mentioned during steps)
- Transcription errors (context-based correction)

Extract sections in this order: Prep, Marinate (if applicable), Cook, Assemble`;

const response = await client.beta.messages.parse({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  betas: ["structured-outputs-2025-11-13"],
  system: systemPrompt,
  messages: [{
    role: "user",
    content: `<transcript>${transcript}</transcript>`
  }],
  output_format: betaZodOutputFormat(RecipeSchema)
});
```

### Anti-Patterns to Avoid

- **Storing mutable state in global scope:** Workers isolates can be evicted; use env bindings or external storage
- **Using eval-based JSON validators:** Cloudflare Workers don't support eval/new Function - use Cabidela or @cfworker/json-schema
- **Hardcoding API keys:** Always use secrets via wrangler secret put, never commit keys to git
- **Ignoring rate limits:** Implement exponential backoff with retry-after header for 429 responses
- **Over-prompting without structured outputs:** Use `output_format` instead of relying on prompt engineering alone

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom validators | Cabidela / @cfworker/json-schema | Workers don't support eval; these are optimized for edge runtime |
| Rate limit handling | setTimeout retries | Exponential backoff with retry-after header | Claude API includes retry-after in 429 responses |
| Recipe structure inference | Custom NLP/regex | Claude structured outputs | Guaranteed valid JSON, no parsing errors, no retries |
| API key management | Environment variables | Wrangler secrets | Encrypted at rest, not visible in dashboard after creation |
| Voice transcript cleaning | Text preprocessing | Claude's prompt handling | Claude handles filler words, corrections, transcription errors natively |

**Key insight:** Claude's structured outputs eliminate an entire class of problems (malformed JSON, missing fields, type errors) that would otherwise require complex validation and retry logic. This is the single biggest win for this phase.

## Common Pitfalls

### Pitfall 1: Exceeding Worker Memory Limits

**What goes wrong:** Workers hit 128 MB memory limit when processing large transcripts or accumulating data
**Why it happens:** Trying to load too much into memory, storing state globally, or processing extremely long transcripts
**How to avoid:**
- Keep transcripts under reasonable size (Claude has context limits anyway)
- Stream responses if handling multiple requests
- Don't store state in Worker memory - use external storage if needed
**Warning signs:** "Out of memory" errors during testing with realistic transcript sizes

### Pitfall 2: Rate Limit 429 Errors Without Backoff

**What goes wrong:** API returns 429 errors during normal operation, breaking user experience
**Why it happens:** Not implementing exponential backoff or ignoring retry-after headers
**How to avoid:**
- Check response.headers['retry-after'] on 429
- Implement exponential backoff: wait, retry with increasing delays
- Use prompt caching to reduce token consumption (cached tokens don't count toward ITPM)
**Warning signs:** 429 errors in production logs, especially during peak usage

### Pitfall 3: Schema Compilation Latency on First Request

**What goes wrong:** First request with a new schema takes significantly longer (cold start)
**Why it happens:** Structured outputs compile grammar artifacts on first use, then cache for 24 hours
**How to avoid:**
- Accept the first-request latency (happens once per day per schema)
- Don't change schema structure frequently
- Consider "warming" the Worker with a test request after deployment
**Warning signs:** Inconsistent response times, first request after deployment is slow

### Pitfall 4: Using Unsupported JSON Schema Features

**What goes wrong:** 400 error from Claude API with "unsupported schema feature" message
**Why it happens:** Using recursive schemas, minimum/maximum constraints, complex regex patterns
**How to avoid:**
- Use Zod SDK transformation (automatically removes unsupported features)
- Stick to basic types, enums, required fields, and simple patterns
- Test schema validation locally before deploying
**Warning signs:** 400 errors with schema-related messages during development

### Pitfall 5: Not Handling max_tokens Cutoff

**What goes wrong:** Response is truncated mid-JSON, but still returns 200 status
**Why it happens:** Setting max_tokens too low for complex recipes
**How to avoid:**
- Set max_tokens generously (4096+ for recipes with many steps)
- Check response.stop_reason for "max_tokens" and handle accordingly
- Monitor token usage in development to calibrate limits
**Warning signs:** Incomplete recipes, JSON ending abruptly, stop_reason: "max_tokens"

### Pitfall 6: Committing .dev.vars to Git

**What goes wrong:** API keys exposed in git history, security breach
**Why it happens:** Forgetting to add .dev.vars to .gitignore
**How to avoid:**
- Immediately add .dev.vars and .env* to .gitignore on project init
- Use git hooks to prevent commits with secrets
- Rotate API keys if accidentally committed
**Warning signs:** .dev.vars visible in git status, GitHub security alerts

## Code Examples

Verified patterns from official sources:

### Complete Worker Implementation

```typescript
// Source: Synthesized from https://developers.cloudflare.com/workers/examples/
// and https://platform.claude.com/docs/en/build-with-claude/structured-outputs

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

// Define recipe structure with Zod
const RecipeSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    name: z.enum(['Prep', 'Marinate', 'Cook', 'Assemble']),
    steps: z.array(z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean().default(false)
    }))
  })),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional(),
    notes: z.string().optional()
  }))
});

interface Env {
  ANTHROPIC_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers for web app integration
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Parse request body
      const body = await request.json() as { transcript: string };

      if (!body.transcript || typeof body.transcript !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid request: transcript required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Initialize Claude client
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

      // System prompt for handling rambling input
      const systemPrompt = `You are a recipe parser. Extract structured recipe data from rambling voice transcripts.

Handle gracefully:
- Filler words (um, uh, like, you know)
- Self-corrections (no wait, actually, I mean)
- Non-linear ordering (ingredients mentioned mid-step)
- Transcription errors (use context to infer correct words)
- Incomplete thoughts (fill in reasonable defaults)

Extract sections in order: Prep, Marinate (if applicable), Cook, Assemble.
Generate sequential step IDs (step-1, step-2, etc.).`;

      // Call Claude with structured outputs
      const response = await client.beta.messages.parse({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        betas: ["structured-outputs-2025-11-13"],
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `<transcript>${body.transcript}</transcript>`
        }],
        output_format: betaZodOutputFormat(RecipeSchema)
      });

      // Check for max_tokens cutoff
      if (response.stop_reason === 'max_tokens') {
        return new Response(
          JSON.stringify({ error: 'Recipe too complex, transcript too long' }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return validated, typed recipe
      return new Response(JSON.stringify(response.parsed_output), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error parsing recipe:', error);

      // Handle rate limits
      if (error instanceof Anthropic.APIError && error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] || '60';
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', retry_after: retryAfter }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': retryAfter
            }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};
```

### Wrangler Configuration

```toml
# Source: https://developers.cloudflare.com/workers/wrangler/configuration/

name = "recipe-parser"
main = "src/index.ts"
compatibility_date = "2026-01-28"

[env.production]
name = "recipe-parser"

[env.staging]
name = "recipe-parser-staging"
```

### Local Development Setup

```bash
# Source: https://developers.cloudflare.com/workers/development-testing/

# Install dependencies
npm install

# Add API key for local dev (creates .dev.vars)
echo 'ANTHROPIC_API_KEY="sk-ant-..."' > .dev.vars

# Start local development server
npx wrangler dev

# Test endpoint
curl -X POST http://localhost:8787/api/recipe/parse \
  -H "Content-Type: application/json" \
  -d '{"transcript": "okay so I am making chicken wraps..."}'
```

### Deployment

```bash
# Source: https://developers.cloudflare.com/workers/get-started/guide/

# Add production secret
npx wrangler secret put ANTHROPIC_API_KEY

# Deploy to Cloudflare
npx wrangler deploy

# Deploy to staging environment
npx wrangler deploy --env staging
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt engineering for JSON | Structured outputs with JSON schema | Dec 2025 | Eliminates parsing errors, retries, validation logic |
| Manual JSON Schema | Zod with SDK transformation | Dec 2025 | Type safety + runtime validation in single definition |
| Build-time Ajv compilation | Runtime Cabidela validation | 2024 | No build step needed, Workers-compatible |
| Fixed rate limit handling | Exponential backoff with retry-after header | Ongoing | Respects API-provided timing, faster recovery |

**Deprecated/outdated:**
- **Ajv for runtime validation in Workers:** Requires eval/new Function which Workers don't support - use Cabidela or @cfworker/json-schema instead
- **JSON mode without schema:** Old approach was `response_format: {type: "json"}` with prompt engineering - now use `output_format` with explicit schema
- **Environment variables for secrets:** Old docs suggested env vars - current best practice is wrangler secrets (encrypted, not visible)

## Open Questions

Things that couldn't be fully resolved:

1. **TRMNL webhook integration timing**
   - What we know: TRMNL has 12 req/hour rate limit, 2kb payload limit
   - What's unclear: Whether Worker should trigger TRMNL webhook or if that's handled elsewhere (Phase 3 decision)
   - Recommendation: Keep Phase 1 focused on parse API only, defer webhook integration to Phase 3

2. **Optimal max_tokens value for recipes**
   - What we know: Longer recipes need more tokens, cutoff returns stop_reason: "max_tokens"
   - What's unclear: What's a reasonable upper bound for voice transcript recipes?
   - Recommendation: Start with 4096, monitor actual usage in development, adjust if needed

3. **Prompt caching effectiveness**
   - What we know: Cached tokens don't count toward rate limits, cache lasts 24 hours
   - What's unclear: Whether system prompt is large enough to benefit from caching
   - Recommendation: Implement basic version first, add prompt caching if rate limits become an issue

4. **Sample voice transcript availability**
   - What we know: Real messy transcript exists from chicken wraps cooking session
   - What's unclear: Where this transcript is located for testing
   - Recommendation: Locate sample transcript and add to test fixtures during planning phase

## Sources

### Primary (HIGH confidence)

- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - Official API documentation for JSON schema outputs
- [Cloudflare Workers Examples](https://developers.cloudflare.com/workers/examples/) - Official patterns for API endpoints
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) - Official secrets management guide
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/) - Official deployment and testing guide
- [Cabidela GitHub](https://github.com/cloudflare/cabidela) - Official JSON schema validator for Workers

### Secondary (MEDIUM confidence)

- [Claude API Rate Limits Guide 2026](https://www.aifreeapi.com/en/posts/fix-claude-api-429-rate-limit-error) - Comprehensive rate limit handling strategies (verified against official docs)
- [Cloudflare Workers Best Practices 2026](https://medium.com/@calebrocca/the-ultimate-guide-to-cloudflare-workers-edge-computing-made-easy-da2469af7bc0) - Community patterns (aligned with official docs)
- [@cfworker/json-schema npm](https://www.npmjs.com/package/@cfworker/json-schema) - Alternative to Cabidela (official package docs)

### Tertiary (LOW confidence - marked for validation)

- None - all critical findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries from official sources, current as of Jan 2026
- Architecture: HIGH - Patterns from official Cloudflare and Anthropic documentation
- Pitfalls: HIGH - Memory limits, rate limits, schema limitations documented in official sources
- Code examples: HIGH - Synthesized from official examples and verified patterns

**Research date:** 2026-01-28
**Valid until:** ~60 days (stable technologies, but Claude structured outputs still in beta - monitor for GA release)

**Notes for planner:**
- This is a hackathon build with tight timeline - prioritize getting working version over optimization
- Core validation already done (user tested concept with Claude phone app)
- Sample voice transcript exists somewhere - locate during planning
- Phase 3 will handle TRMNL integration - keep Phase 1 focused on parse API only
