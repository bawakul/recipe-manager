# Recipe Checklist

## What This Is

A voice-to-checklist tool for improvised cooking. You ramble about what you're making — ingredients you have, rough steps in your head — and it comes back as a structured, followable checklist. Built for the TRMNL hackathon, targeting an e-ink display for hands-free kitchen use. First project for "Apps for Friends" — malleable software that gives people agency over their tools.

## Core Value

**Externalize the messy recipe in your head into a format you can actually follow.**

Most recipe apps solve discovery ("what should I cook?"). This solves execution — you already know what you're making, you just need the structure. Especially valuable when ADHD or otherwise scattered: voice dump → structured steps → persistent UI you can't lose.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Voice transcript parsing via Claude API (handles rambling, corrections, transcription errors)
- [ ] Structured JSON output with sections (Prep, Cook, Assemble) and checkable steps
- [ ] Web UI that renders checklist with progress tracking
- [ ] iOS Shortcut integration: share audio → transcribe → API → display
- [ ] TRMNL webhook integration: format and push data for e-ink display
- [ ] LocalStorage persistence for checkbox state
- [ ] Mobile-first, kitchen-friendly design (large text, high contrast)

### Out of Scope

- Recipe adaptation (appliances, dietary) — future milestone
- URL recipe extraction — future milestone
- Database persistence — localStorage is enough for hackathon
- User accounts — no auth needed
- Recipe discovery/search — this is about YOUR recipes, not finding new ones
- Voice recording in browser — iOS transcription handles this

## Context

**Origin:** TRMNL hackathon entry. The device is a 7.5" e-ink display (800x480, monochrome) that receives data via webhook and renders with Liquid templates. Rate limited to 12 requests/hour, 2kb payload limit.

**Validation:** Already tested the core concept — used Claude (phone app) to turn a voice note into an interactive artifact while cooking. It worked well. Now productizing that flow to be frictionless and reliable.

**User scenario:** Cooking while slightly high, brain scattered, improvising based on what's in the fridge. Need to get the plan out of your head and into a persistent format before you forget it or lose track.

**Sample input:** Real voice transcript from earlier today (chicken wraps) — contains thinking out loud, self-corrections, transcription errors, non-linear ordering, incomplete thoughts. The parser needs to handle all of this gracefully.

**Longer vision:**
- Recipe adaptation based on user context (appliances, dietary needs)
- Personal recipe memory ("Git for recipes" — fork, adapt, remember)
- Family sharing of recipe variants

## Constraints

- **Timeline**: Tonight (pre-hackathon prep) + tomorrow (hackathon day)
- **Tech stack**: Cloudflare Workers (API), Next.js + Tailwind (web), Claude API (LLM)
- **Deployment**: Cloudflare (worker), Vercel (frontend)
- **TRMNL limits**: 800x480px, monochrome, 2kb payload, 12 req/hour
- **No device yet**: Building TRMNL integration blind — won't have actual device until (hopefully) winning

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| iOS Shortcut for transcription | Leverage built-in iOS transcription, avoid building voice capture | — Pending |
| LocalStorage over database | Simplest path for hackathon, persistence not critical | — Pending |
| Cloudflare Workers over serverless | Edge deployment, fast cold starts, good DX | — Pending |
| Adaptation deferred to post-hackathon | Core flow first, don't overscope | — Pending |
| Sections in recipe structure | Recipes have natural phases (Prep, Cook, Assemble) — helps with progress tracking and ADHD focus | — Pending |

---
*Last updated: 2026-01-28 after initialization*
