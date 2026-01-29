# Phase 3: TRMNL Integration - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Push structured recipes to TRMNL e-ink display via webhook. Handle 2kb payload limit, 800x480 monochrome display, and 12 requests/hour rate limit. Building blind (no device yet).

</domain>

<decisions>
## Implementation Decisions

### Payload strategy
- All sections included (Prep, Cook, Assemble) — remove ingredients (they're implied in steps)
- Max ~10 steps total — forces Claude to merge/combine during parsing
- Keep section headers for visual grouping
- If still too large after removing ingredients, Claude has discretion on further compression

### Display layout
- Balanced emphasis: medium title, comfortable step text
- Static design — all ~10 steps visible on single 800x480 screen (no pagination)
- Include checkboxes next to steps (visual only — user can mark with pen)
- Include simple step count (e.g., "3/10 steps") somewhere on display
- Optimize for static viewing — TRMNL has no buttons/interaction

### Trigger behavior
- API-mediated: iOS Shortcut → parse API → TRMNL webhook
- Auto-push after parse by default (voice → parse → TRMNL in one flow)
- Also expose separate manual trigger endpoint for flexibility
- Webhook URL storage: Claude's discretion (env var vs. request param)

### Error handling
- TRMNL webhook failure: return success with warning (recipe parsed, TRMNL push failed)
- Rate limit (12/hr): return success with warning (recipe parsed, TRMNL won't update until reset)
- Reactive rate limit handling only — catch 429 errors, don't proactively track
- Payload too large: truncate and push what fits, include truncation warning

### Claude's Discretion
- Exact Liquid template layout
- Compression algorithm for payload reduction
- Webhook URL storage mechanism (env var recommended)
- How to indicate truncation on display

</decisions>

<specifics>
## Specific Ideas

- TRMNL is display-only (no buttons) — design assumes single static view
- Checkboxes are for pen marking, not digital interaction
- The ~10 step limit also helps the web UI stay manageable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-trmnl-integration*
*Context gathered: 2026-01-29*
