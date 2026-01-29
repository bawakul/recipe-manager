# Roadmap: Recipe Checklist

## Overview

**Project:** Voice-to-checklist tool for improvised cooking
**Timeline:** Hackathon (2-day sprint)
**Core Value:** Externalize the messy recipe in your head into a format you can actually follow

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Foundation | API accepts voice transcripts and returns structured recipes | API-01, API-02, API-03 |
| 2 | Web Interface | Users can view and track progress on interactive checklists | WEB-01 through WEB-07, DES-01 through DES-05 |
| 3 | TRMNL Integration | Recipes can be pushed to e-ink display | API-04, API-05 |
| 4 | iOS Shortcut | Users can go from voice recording to recipe in one flow | IOS-01 through IOS-05 |

**Total Requirements:** 22 mapped (100% coverage)

## Phases

### Phase 1: Foundation

**Goal:** API accepts rambling voice transcripts and returns structured recipe JSON

**Requirements:** API-01, API-02, API-03

**Plans:** 1 plan

**Dependencies:** None (first phase)

**Success Criteria:**
1. User can POST transcript text to `/api/recipe/parse` and receive structured JSON response
2. Parser handles messy input: filler words, corrections, transcription errors, non-linear ordering
3. Response includes sections (Prep, Marinate, Cook, Assemble) with checkable steps and extracted ingredients
4. Response structure is consistent and predictable for frontend consumption

**Technical Notes:**
- Cloudflare Worker endpoint
- Claude API integration for parsing
- Prompt engineering to handle rambling input gracefully
- JSON schema definition for recipe structure

Plans:
- [x] 01-01-PLAN.md — Set up Cloudflare Worker with Claude API for transcript parsing

---

### Phase 2: Web Interface

**Goal:** Users can view recipes as interactive checklists and track progress

**Requirements:** WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, DES-01, DES-02, DES-03, DES-04, DES-05

**Plans:** 4 plans

**Dependencies:** Phase 1 (needs parse API)

**Success Criteria:**
1. User can paste transcript on home page and submit to get interactive checklist
2. User can check off steps and see progress bar update (X of Y completed)
3. All sections expanded by default (collapsible removed per CONTEXT.md)
4. Checkbox state persists across page reloads via localStorage
5. UI is usable in kitchen: mobile-first, large tap targets, high contrast, readable at arm's length
6. Loading state shows while API processes transcript

**Technical Notes:**
- Next.js + Tailwind CSS
- Dark theme (#1a1a1a background, #39FF6D neon green accents)
- localStorage for checkbox persistence
- Chat-style auto-grow input UX
- Adjust panel for recipe refinement

Plans:
- [x] 02-01-PLAN.md — Project setup with Next.js, Tailwind, types, and API client
- [x] 02-02-PLAN.md — Input page with auto-grow textarea and loading state
- [x] 02-03-PLAN.md — Recipe checklist with progress tracking and localStorage
- [x] 02-04-PLAN.md — Complete flow integration with adjust panel

---

### Phase 3: TRMNL Integration

**Goal:** Recipes can be pushed to TRMNL e-ink display via webhook

**Requirements:** API-04, API-05

**Plans:** 1 plan

**Dependencies:** Phase 1 (needs recipe JSON structure)

**Success Criteria:**
1. User can trigger webhook that sends recipe to TRMNL device
2. Payload stays under 2kb limit with merge_variables format
3. Recipe renders correctly on 800x480 monochrome display
4. Webhook respects 12 requests/hour rate limit

**Technical Notes:**
- POST to TRMNL webhook URL with formatted payload
- Liquid template variables for e-ink rendering
- Compression/simplification logic to stay under 2kb
- Building blind (no device yet) - may need adjustment after hackathon if device received

Plans:
- [x] 03-01-PLAN.md — Add TRMNL webhook endpoint with payload formatting and auto-push

---

### Phase 4: iOS Shortcut

**Goal:** Users can go from voice recording to displayed recipe in one seamless flow

**Requirements:** IOS-01, IOS-02, IOS-03, IOS-04, IOS-05

**Dependencies:** Phase 1 (needs parse API), Phase 3 (TRMNL webhook)

**Success Criteria:**
1. User can share audio file to Shortcut from iOS share sheet
2. Shortcut transcribes audio using iOS built-in transcription
3. Shortcut POSTs transcript to Cloudflare worker and receives recipe JSON
4. Shortcut can trigger TRMNL webhook with recipe data
5. End-to-end flow takes under 30 seconds from voice recording to displayed recipe

**Technical Notes:**
- iOS Shortcuts app configuration
- Share sheet integration for audio files
- HTTP POST actions with JSON handling
- Optional: Direct TRMNL trigger vs API-mediated

---

## Progress Tracking

| Phase | Status | Progress | Blocking Issues |
|-------|--------|----------|-----------------|
| 1 - Foundation | Complete | 3/3 requirements | — |
| 2 - Web Interface | Complete | 12/12 requirements | — |
| 3 - TRMNL Integration | Complete | 2/2 requirements | — |
| 4 - iOS Shortcut | Ready | 0/5 requirements | — |

## Hackathon Sequencing

**Tonight (Pre-hackathon):**
- Phase 1: Foundation (API core)
- Phase 2 partial: Web UI scaffold and basic display

**Tomorrow (Hackathon Day):**
- Phase 2 complete: Polish UI, add persistence
- Phase 3: TRMNL integration
- Phase 4: iOS Shortcut

**Critical Path:** Phase 1 -> Phase 2 -> Demo-ready. Phases 3 and 4 are enhancements.

---

*Roadmap created: 2026-01-28*
*Last updated: 2026-01-29 (Phase 3 complete)*
