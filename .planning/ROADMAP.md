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
- [ ] 01-01-PLAN.md — Set up Cloudflare Worker with Claude API for transcript parsing

---

### Phase 2: Web Interface

**Goal:** Users can view recipes as interactive checklists and track progress

**Requirements:** WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, DES-01, DES-02, DES-03, DES-04, DES-05

**Dependencies:** Phase 1 (needs parse API)

**Success Criteria:**
1. User can paste transcript on home page and submit to get interactive checklist
2. User can check off steps and see progress bar update (X of Y completed)
3. User can collapse/expand sections to reduce visual clutter
4. Checkbox state persists across page reloads via localStorage
5. UI is usable in kitchen: mobile-first, large tap targets, high contrast, readable at arm's length
6. Loading state shows while API processes transcript

**Technical Notes:**
- Next.js + Tailwind CSS
- Dark theme (#1a1a1a background, #f59e0b amber accents)
- localStorage for checkbox persistence
- Progressive enhancement (works without JavaScript for display)

---

### Phase 3: TRMNL Integration

**Goal:** Recipes can be pushed to TRMNL e-ink display via webhook

**Requirements:** API-04, API-05

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
| 1 - Foundation | Planned | 0/3 requirements | Ready for execution |
| 2 - Web Interface | Pending | 0/12 requirements | Blocked by Phase 1 |
| 3 - TRMNL Integration | Pending | 0/2 requirements | Blocked by Phase 1 |
| 4 - iOS Shortcut | Pending | 0/5 requirements | Blocked by Phases 1, 3 |

## Hackathon Sequencing

**Tonight (Pre-hackathon):**
- Phase 1: Foundation (API core)
- Phase 2 partial: Web UI scaffold and basic display

**Tomorrow (Hackathon Day):**
- Phase 2 complete: Polish UI, add persistence
- Phase 3: TRMNL integration
- Phase 4: iOS Shortcut

**Critical Path:** Phase 1 → Phase 2 → Demo-ready. Phases 3 and 4 are enhancements.

---

*Roadmap created: 2026-01-28*
*Last updated: 2026-01-28 (Phase 1 planned)*
