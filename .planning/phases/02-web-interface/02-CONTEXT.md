# Phase 2: Web Interface - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive checklist UI for viewing and tracking recipe progress. Users paste transcripts, see parsed recipes as checklists, and track completion. Input refinement via conversational adjustment. Creating/editing recipes (beyond adjustment) and recipe storage are separate concerns.

</domain>

<decisions>
## Implementation Decisions

### Input experience
- Chat-style input UX — compact text area like a message bar, not a large prominent textarea
- Auto-grow textarea as content increases
- Both submit button and Enter-to-submit (Shift+Enter for newlines)
- Instructional placeholder: "Paste or dictate your recipe here..."
- Full-page transition to loading screen on submit
- Inline error display below input on parsing failures
- "Adjust" button opens side panel showing original transcript + new chat input for corrections/additions
- "Start over" button to clear and begin fresh

### Checklist interaction
- All sections (Prep, Cook, Assemble) expanded by default — scroll through
- Checked steps show checkmark only (no strikethrough, no fade, no collapse)
- Progress indicator at top of page: "X of Y steps complete"
- Ingredients shown as reference list, not checkable

### Kitchen usability
- Primary device: tablet on counter
- Viewing distance: arm's length (2-4 ft) — larger text, scannable layout
- One-handed tap not critical — can use clean hands
- Well-lit kitchen — standard contrast sufficient

### Visual design
- Dark theme: #1a1a1a background
- Accent color: bright neon/lime green (~#39FF6D) from reference image
- Flat sections — spacing and headers separate sections, no card borders/shadows
- Loading state: centered spinner with "Parsing your recipe..." message

### Claude's Discretion
- Exact typography and font sizes (readable at arm's length)
- Spacing and layout details
- Exact adjustment panel implementation
- Progress bar visual style
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Chat input UX inspired by messaging apps — familiar, low-friction
- Adjustment flow is conversational: see original transcript, add corrections, re-parse
- Reference image for green accent: collage with bright neon green circles against black/grey

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-web-interface*
*Context gathered: 2026-01-29*
