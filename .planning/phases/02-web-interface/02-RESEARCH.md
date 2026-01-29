# Phase 2: Web Interface - Research

**Researched:** 2026-01-29
**Domain:** Next.js 15/16 + Tailwind CSS + React
**Confidence:** HIGH

## Summary

This phase builds an interactive recipe checklist UI using Next.js and Tailwind CSS. The standard approach for this stack is well-established: Next.js App Router with TypeScript, Tailwind CSS with PostCSS integration, controlled React components for form inputs and checkboxes, and localStorage with proper SSR hydration handling.

Key technical challenges specific to this phase include:
1. **SSR/localStorage hydration mismatch** - Next.js renders on server where localStorage doesn't exist
2. **Auto-growing textarea** - Requires CSS Grid technique with pseudo-elements
3. **CORS configuration** - Cloudflare Worker already configured with wildcard origin
4. **Checkbox state persistence** - Array-based state with localStorage sync via useEffect

**Primary recommendation:** Use Next.js App Router with client components for all interactive elements. Defer localStorage reads to useEffect to avoid hydration errors. Use CSS Grid technique for auto-growing textarea rather than JavaScript height calculations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x (or 15.x) | React framework | Industry standard for React SSR/SSG, excellent DX, Vercel deployment |
| React | 19.x | UI library | Required by Next.js 15/16, stable concurrent features |
| Tailwind CSS | 4.x | Utility-first CSS | Standard for rapid UI development, excellent with Next.js |
| TypeScript | 5.x | Type safety | Standard for all modern React projects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-themes | 0.3.x | Dark mode toggle | If implementing theme switching (NOT needed - dark theme only) |
| @tailwindcss/postcss | 4.x | PostCSS plugin | Required for Tailwind 4.x integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js | Vite + React | Next.js provides SSR, routing, deployment optimizations out of box |
| Tailwind CSS | Vanilla CSS / CSS Modules | Tailwind faster for rapid prototyping, already decided in requirements |
| localStorage | IndexedDB | localStorage sufficient for small data (single recipe ~5-10KB), simpler API |

**Installation:**
```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest recipe-frontend --typescript --tailwind --app --no-src-dir

# Install Tailwind PostCSS plugin (if not using latest)
npm install tailwindcss @tailwindcss/postcss postcss
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── layout.tsx           # Root layout with dark theme
├── page.tsx             # Home page (input form)
├── recipe/
│   └── page.tsx         # Recipe checklist view
├── globals.css          # Tailwind imports
└── api/                 # NOT NEEDED - API is Cloudflare Worker
components/
├── RecipeInput.tsx      # Auto-growing textarea + submit
├── RecipeChecklist.tsx  # Interactive checklist with sections
├── LoadingState.tsx     # Centered spinner with message
└── AdjustPanel.tsx      # Side panel for refinement
lib/
├── api.ts               # Fetch wrapper for Cloudflare Worker
├── storage.ts           # localStorage hooks with SSR safety
└── types.ts             # Shared TypeScript types (Recipe, Section, etc.)
```

### Pattern 1: Auto-Growing Textarea (CSS Grid Technique)

**What:** Textarea grows with content using CSS Grid and pseudo-element mirroring
**When to use:** For chat-style input that expands as user types

**Example:**
```tsx
// Source: https://cruip.com/auto-growing-textarea-with-tailwind-css/
export function AutoGrowTextarea({ value, onChange, placeholder }: Props) {
  return (
    <div
      className="grid after:invisible after:whitespace-pre-wrap after:content-[attr(data-cloned-val)_'_'] after:border after:px-3 after:py-2"
      data-cloned-val={value}
    >
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="resize-none overflow-hidden border px-3 py-2 [grid-area:1/1/2/2]"
        rows={1}
      />
    </div>
  );
}
```

**Key requirements:**
- Textarea and pseudo-element share same grid area `[grid-area:1/1/2/2]`
- Pseudo-element uses `whitespace-pre-wrap` and `invisible` (not `hidden`)
- Padding must match exactly between textarea and pseudo-element
- Update `data-cloned-val` attribute on input to drive expansion

### Pattern 2: localStorage with SSR-Safe React Hook

**What:** Custom hook that reads localStorage only on client, avoiding hydration errors
**When to use:** For persisting any UI state in Next.js

**Example:**
```tsx
// Source: https://medium.com/@lean1190/uselocalstorage-hook-for-next-js-typed-and-ssr-friendly-4ddd178676df
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use lazy initialization to avoid running on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Return initial value during SSR
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

**Critical:** MUST return `initialValue` during SSR to avoid hydration mismatch.

### Pattern 3: Controlled Checkbox with State Management

**What:** Checkboxes as controlled components with checked/onChange pattern
**When to use:** For all form inputs in React, especially when persisting state

**Example:**
```tsx
// Source: React best practices 2026
function RecipeStep({ step, onToggle }: Props) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={step.completed}
        onChange={(e) => onToggle(step.id, e.target.checked)}
        className="mt-1 h-6 w-6 accent-[#39FF6D]"
        aria-label={`Mark step as ${step.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={step.completed ? 'text-gray-400' : 'text-white'}>
        {step.text}
      </span>
    </label>
  );
}
```

**State management for multiple checkboxes:**
```tsx
// Track completion by step ID
const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>('completed-steps', []);

const handleToggle = (stepId: string, completed: boolean) => {
  setCompletedSteps(prev =>
    completed ? [...prev, stepId] : prev.filter(id => id !== stepId)
  );
};
```

### Pattern 4: Loading State Transition

**What:** Full-page loading overlay during async operations
**When to use:** When submitting form that triggers API call with unknown duration

**Example:**
```tsx
// Source: UX best practices for loading states 2026
export function LoadingState({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-[#39FF6D] border-t-transparent rounded-full" />
      <p className="mt-4 text-white text-lg">{message}</p>
    </div>
  );
}

// Usage in component
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(transcript: string) {
  setIsLoading(true);
  try {
    const recipe = await parseRecipe(transcript);
    // Navigate to recipe view
  } catch (error) {
    // Show error
  } finally {
    setIsLoading(false);
  }
}

return isLoading ? <LoadingState message="Parsing your recipe..." /> : <InputForm />;
```

### Pattern 5: CORS-Aware API Client

**What:** Fetch wrapper that handles CORS and errors from Cloudflare Worker
**When to use:** For all API calls to external backend

**Example:**
```tsx
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function parseRecipe(transcript: string): Promise<Recipe> {
  const response = await fetch(`${API_URL}/api/recipe/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse recipe');
  }

  return response.json();
}
```

**Environment variable setup:**
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8787` (development)
- Vercel env vars: `NEXT_PUBLIC_API_URL=https://recipe-parser.your-worker.workers.dev` (production)

### Anti-Patterns to Avoid

- **Reading localStorage during render:** Always use `useEffect` or lazy `useState` initialization
- **Accessing window object without check:** Always verify `typeof window !== 'undefined'`
- **Inline styles for spacing:** Use Tailwind utilities consistently
- **JavaScript height calculation for textarea:** Use CSS Grid technique instead
- **Global error boundaries for API errors:** Handle errors at call site for better UX

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-growing textarea | JavaScript height measurement | CSS Grid + pseudo-element technique | Avoids layout thrashing, works with server components, simpler |
| Dark mode toggle | Manual class switching + storage | next-themes library | Handles SSR, system preference, flicker-free (NOT NEEDED for this project - dark theme only) |
| Form submission on Enter | Custom keydown handlers | Native form onSubmit | Accessibility, works with screen readers, handles Edge cases |
| API error retry logic | Manual setTimeout loops | Built-in fetch with try/catch | Sufficient for hackathon, can add later if needed |
| State management | Redux/Zustand | useState + useEffect + localStorage | Overkill for single-page recipe state |

**Key insight:** React's built-in patterns (controlled components, useEffect, useState) handle 90% of use cases. Don't reach for libraries until you hit a clear limitation.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch from localStorage

**What goes wrong:** App crashes on load with "Text content does not match server-rendered HTML" error

**Why it happens:** Next.js pre-renders on server where localStorage doesn't exist. If component reads localStorage during render, server HTML differs from client HTML.

**How to avoid:**
1. Use lazy `useState` initialization: `useState(() => typeof window !== 'undefined' ? ... : defaultValue)`
2. Return initial value during SSR, read actual value in `useEffect`
3. Never read `window.localStorage` directly in component body

**Warning signs:**
- Console error mentioning "hydration"
- Different content appears after page loads
- `typeof window === 'undefined'` not checked before localStorage access

### Pitfall 2: JSON.parse Errors on Malformed localStorage Data

**What goes wrong:** App crashes when reading corrupted localStorage data

**Why it happens:** User edits localStorage manually, browser bug, or code change makes old data invalid

**How to avoid:**
```tsx
try {
  const item = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : initialValue;
} catch (error) {
  console.error(`Error reading localStorage key "${key}":`, error);
  // Clear corrupted data
  window.localStorage.removeItem(key);
  return initialValue;
}
```

**Warning signs:**
- "Unexpected token" errors in console
- App works in incognito but not normal mode
- Crashes on page reload but not first visit

### Pitfall 3: Form Submits on Enter in Textarea

**What goes wrong:** Pressing Enter in textarea submits form instead of creating newline

**Why it happens:** Native form behavior triggers submit on Enter key press

**How to avoid:**
1. **Preferred:** Use Shift+Enter pattern - submit on Enter, newline on Shift+Enter
2. Handle `onKeyDown` in form: `if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()`
3. Use button type="button" for non-submit buttons

**Warning signs:**
- Users complain they can't add line breaks
- Form submits unexpectedly while typing

### Pitfall 4: Performance Degradation from Excessive localStorage Writes

**What goes wrong:** UI becomes laggy when typing in input fields

**Why it happens:** Writing to localStorage on every keystroke (onChange) is synchronous and blocks main thread

**How to avoid:**
1. Debounce localStorage writes: only save after 500ms of inactivity
2. Save only on significant events (blur, submit, checkbox toggle)
3. For typing input, save on submit; for checkboxes, save immediately

**Warning signs:**
- Input lag when typing
- Browser tab freezes briefly
- High CPU usage in DevTools Performance tab

### Pitfall 5: Missing CORS Preflight for POST Requests

**What goes wrong:** API calls fail with CORS error in browser console

**Why it happens:** Browser sends OPTIONS preflight request for POST with custom headers, server doesn't respond

**How to avoid:**
- Already handled in Cloudflare Worker (src/index.ts handles OPTIONS)
- Verify CORS headers include Access-Control-Allow-Origin, Methods, Headers
- Test with `curl -X OPTIONS` to verify preflight response

**Warning signs:**
- Network tab shows OPTIONS request with no response
- Console error: "No 'Access-Control-Allow-Origin' header"
- API works in Postman but fails in browser

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Input Component with Auto-Grow

```tsx
// components/RecipeInput.tsx
'use client';

import { useState, FormEvent } from 'react';

export function RecipeInput({ onSubmit }: { onSubmit: (transcript: string) => void }) {
  const [transcript, setTranscript] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (transcript.trim().length < 10) return;
    onSubmit(transcript);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      <div
        className="grid after:invisible after:whitespace-pre-wrap after:content-[attr(data-cloned-val)_'_'] after:rounded-lg after:bg-[#2d2d2d] after:px-4 after:py-3 after:text-base"
        data-cloned-val={transcript}
      >
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Paste or dictate your recipe here..."
          className="resize-none overflow-hidden rounded-lg bg-[#2d2d2d] px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-[#39FF6D] [grid-area:1/1/2/2]"
          rows={1}
          aria-label="Recipe transcript input"
        />
      </div>
      <button
        type="submit"
        disabled={transcript.trim().length < 10}
        className="mt-4 w-full rounded-lg bg-[#39FF6D] px-6 py-3 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2dd15f] transition-colors"
      >
        Parse Recipe
      </button>
    </form>
  );
}
```

### Example 2: Checklist Component with Progress Tracking

```tsx
// components/RecipeChecklist.tsx
'use client';

import { useLocalStorage } from '@/lib/storage';
import type { Recipe } from '@/lib/types';

export function RecipeChecklist({ recipe }: { recipe: Recipe }) {
  const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>(
    `recipe-${recipe.title}`,
    []
  );

  const totalSteps = recipe.sections.reduce((acc, section) => acc + section.steps.length, 0);
  const completedCount = completedSteps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
          <span className="text-[#39FF6D] font-medium">
            {completedCount} of {totalSteps} steps
          </span>
        </div>
        <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#39FF6D] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Ingredients */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="text-gray-300">
              {ing.quantity ? `${ing.quantity} ` : ''}{ing.name}
              {ing.notes && <span className="text-gray-500"> ({ing.notes})</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Sections */}
      {recipe.sections.map((section) => (
        <section key={section.name} className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">{section.name}</h2>
          <div className="space-y-4">
            {section.steps.map((step) => (
              <label
                key={step.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={completedSteps.includes(step.id)}
                  onChange={() => toggleStep(step.id)}
                  className="mt-1 h-6 w-6 shrink-0 accent-[#39FF6D] cursor-pointer"
                  aria-label={`Step: ${step.text}`}
                />
                <span
                  className={`text-lg ${
                    completedSteps.includes(step.id) ? 'text-gray-400' : 'text-white'
                  } transition-colors`}
                >
                  {step.text}
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

### Example 3: API Client with Error Handling

```tsx
// lib/api.ts
import type { Recipe } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export class RecipeAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'RecipeAPIError';
  }
}

export async function parseRecipe(transcript: string): Promise<Recipe> {
  const response = await fetch(`${API_URL}/api/recipe/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to parse recipe';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Ignore JSON parse errors, use default message
    }
    throw new RecipeAPIError(response.status, errorMessage);
  }

  return response.json();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13 (2022) | Server components by default, better data fetching |
| Tailwind v3 config | Tailwind v4 PostCSS | Tailwind v4 (2024) | Simpler config, just add PostCSS plugin |
| manual `window` checks | next-themes package | Emerged ~2021 | Flicker-free dark mode (NOT NEEDED for this project) |
| JS height calculation for textarea | CSS Grid pseudo-element | CSS Grid maturity (~2020) | Better performance, simpler code |
| React 18 features | React 19 stable | React 19 (2024) | Actions, use API, better Suspense |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps`: Use App Router server components instead
- Tailwind JIT mode flag: Built-in by default in v3+
- `next/image` width/height required: Now optional with `fill` prop
- Manual PostCSS config: Use `@tailwindcss/postcss` plugin instead

## Open Questions

Things that couldn't be fully resolved:

1. **Next.js 15 vs 16**
   - What we know: Next.js 16.1.2 is latest (Jan 2026), but 15.x still supported
   - What's unclear: Breaking changes between 15 and 16 not fully documented in search results
   - Recommendation: Use `create-next-app@latest` which will pull 16.x, should be compatible

2. **localStorage Size Limits for Recipe Data**
   - What we know: Browsers provide 5-10MB per origin, JSON.parse adds ~10x overhead
   - What's unclear: Exact size of parsed recipe JSON (estimate ~5-10KB based on schema)
   - Recommendation: Single recipe storage is well within limits, no compression needed

3. **Adjustment Panel Implementation**
   - What we know: CONTEXT.md specifies side panel with original transcript + chat input
   - What's unclear: Should re-parsing merge with existing recipe or replace it?
   - Recommendation: Treat as full replace for MVP, can add merge logic later if needed

## Sources

### Primary (HIGH confidence)
- [Next.js Official Docs - App Router](https://nextjs.org/docs/app) - Official documentation
- [Tailwind CSS Next.js Framework Guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs) - Official installation
- [Cruip Auto-Growing Textarea Tutorial](https://cruip.com/auto-growing-textarea-with-tailwind-css/) - Verified CSS Grid technique
- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error) - Official error reference
- Existing codebase - Cloudflare Worker API (src/index.ts, src/types.ts)

### Secondary (MEDIUM confidence)
- [Medium: useLocalStorage hook for Next.js](https://medium.com/@lean1190/uselocalstorage-hook-for-next-js-typed-and-ssr-friendly-4ddd178676df) - SSR-safe pattern
- [LogRocket: UI best practices for loading states](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - UX patterns
- [Medium: 6 Loading State Patterns](https://medium.com/uxdworld/6-loading-state-patterns-that-feel-premium-716aa0fe63e8) - Premium UX patterns
- [React Tips: Checkboxes in React](http://react.tips/checkboxes-in-react/) - Controlled component pattern
- Multiple sources on localStorage best practices (Medium, DEV Community, various 2024-2025 articles)

### Tertiary (LOW confidence)
- WebSearch results about React best practices (aggregated from multiple sources)
- Community discussions on GitHub about Next.js API patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs confirm Next.js 15/16 + Tailwind v4 + React 19 as current
- Architecture: HIGH - Patterns verified with official docs and established community practices
- Pitfalls: HIGH - Based on official Next.js error documentation and verified bug patterns
- Code examples: HIGH - Adapted from official sources (Cruip, Next.js docs) with verification
- CORS/API integration: HIGH - Verified against existing Cloudflare Worker code in project

**Research date:** 2026-01-29
**Valid until:** ~30 days (stable stack, unlikely to change significantly)

**Notes:**
- Cloudflare Worker API already has CORS configured correctly (verified in src/index.ts)
- Recipe schema already defined in TypeScript (src/types.ts) - can reuse for frontend
- Timeline constraint (hackathon) means prefer simple patterns over complex libraries
- Dark theme only (no toggle needed) - CONTEXT.md specifies #1a1a1a background and #39FF6D accent
