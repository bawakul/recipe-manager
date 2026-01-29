# Phase 4: iOS Shortcut - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end flow from voice recording to displayed recipe via iOS Shortcuts app. User shares audio from Voice Memos, Shortcut transcribes and parses, pushes to TRMNL, and opens web UI with recipe.

</domain>

<decisions>
## Implementation Decisions

### Trigger method
- Share sheet from Voice Memos is the primary (and only) trigger
- Share sheet only — no standalone file picker mode
- Accept only .m4a files (Voice Memos format)
- Shortcut name: "Recipe" (short, easy to spot)

### Flow feedback
- iOS native spinner during processing (no custom progress notifications)
- Fully automatic — no confirmation step, no transcript preview
- Show "Still working..." notification if processing exceeds 10 seconds
- Simple "Recipe sent!" notification on success

### Output destination
- Push to TRMNL AND open web UI in Safari
- Use deployed Vercel URL (not localhost)
- Recipe data encoded in URL query params (stateless, no storage needed)
- Web UI opens even if TRMNL push fails (recipe still usable)

### Error handling
- Transcription failure: Show error, stop (user retries manually)
- API failure: Show error, stop (no auto-retry)
- TRMNL failure: Warn "TRMNL push failed" but continue to open web UI
- Error messages are technical (include status codes for debugging)

### Claude's Discretion
- Exact iOS Shortcuts action sequence
- Base64 vs URL-safe encoding for recipe data
- "Still working..." timeout threshold (around 10s)
- Notification wording

</decisions>

<specifics>
## Specific Ideas

- The flow should feel like magic: share audio → recipe appears on TRMNL and phone
- Technical error messages help debug during hackathon demo

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ios-shortcut*
*Context gathered: 2026-01-29*
