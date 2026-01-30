# Recipe Checklist

Ramble about what you're cooking, get a checklist.

## Try it

https://recipe-displayer.vercel.app

Paste a voice transcript (or just type). Get a structured recipe with checkable steps.

## How it works

1. You paste a messy transcript: "ok so I'm gonna make eggs, need like 2 eggs, some butter, wait actually 3 eggs, and then I'll whisk them and..."
2. Claude parses it into structured steps
3. You get a checklist you can actually follow

Optionally pushes to a TRMNL e-ink display if you have one.

## Self-host

**API (Cloudflare Worker):**
```bash
cd recipe-manager
npm install
cp .dev.vars.example .dev.vars
# Add your ANTHROPIC_API_KEY to .dev.vars
npx wrangler deploy
```

**Frontend (Vercel):**
```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your worker URL
```

**TRMNL (optional):**
See `docs/trmnl-setup.md`

## Tech

- Cloudflare Workers (API)
- Next.js + Tailwind (frontend)
- Claude API (parsing)

## Why

Cooking while scattered. Brain full of ingredients and half-formed steps. Need to get it out of your head before you forget, into something persistent you can follow.
