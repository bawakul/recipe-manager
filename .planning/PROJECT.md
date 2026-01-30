# Recipe Checklist

## What This Is

A voice-to-checklist tool for improvised cooking. Ramble about what you're making, get a structured checklist. Works on web and pushes to TRMNL e-ink display.

## Core Value

**Externalize the messy recipe in your head into a format you can actually follow.**

## Current State

**Version:** v1.0 (shipped 2026-01-30)

**Deployed:**
- Web: https://recipe-displayer.vercel.app
- API: https://recipe-parser.bawas-lab.workers.dev
- GitHub: https://github.com/bawakul/recipe-manager

**Tech stack:** Cloudflare Workers (API), Next.js + Tailwind (web), Claude API (parsing)

**LOC:** ~1,500 TypeScript

## Requirements

### Validated

- [x] Voice transcript parsing via Claude API — v1.0
- [x] Structured JSON output with sections and checkable steps — v1.0
- [x] Web UI with checklist and progress tracking — v1.0
- [x] TRMNL webhook integration — v1.0
- [x] LocalStorage persistence for checkbox state — v1.0
- [x] Mobile-first, kitchen-friendly design — v1.0

### Deferred

- iOS Shortcut integration (documented, not tested)
- Recipe adaptation (appliances, dietary)
- URL recipe extraction

### Out of Scope

- Database persistence
- User accounts
- Recipe discovery/search
- Voice recording in browser

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| iOS Shortcut for transcription | Leverage built-in iOS transcription | Documented, not tested |
| LocalStorage over database | Simplest path for hackathon | ✓ Works well |
| Cloudflare Workers for API | Edge deployment, fast cold starts | ✓ Good choice |
| TRMNL steps as plain strings | Simpler payload, template uses `{{ step }}` | ✓ Fixed after debugging |
| Fire-and-forget TRMNL push | Parse always succeeds, TRMNL is secondary | ✓ Good resilience |

---
*Last updated: 2026-01-30 after v1.0 milestone*
