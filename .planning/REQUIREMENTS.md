# Requirements: Recipe Checklist

**Defined:** 2026-01-28
**Core Value:** Externalize the messy recipe in your head into a format you can actually follow.

## v1 Requirements

Requirements for hackathon demo. Each maps to roadmap phases.

### API

- [ ] **API-01**: POST /api/recipe/parse accepts transcript text and returns structured recipe JSON
- [ ] **API-02**: Claude prompt handles rambling input: corrections, filler words, transcription errors, non-linear ordering
- [ ] **API-03**: Output includes sections (Prep, Marinate, Cook, Assemble), steps with IDs, and extracted ingredients
- [ ] **API-04**: POST /api/trmnl/webhook formats recipe JSON and pushes to TRMNL webhook URL
- [ ] **API-05**: TRMNL payload stays under 2kb limit with merge_variables format

### Web UI

- [ ] **WEB-01**: Home page with text input for pasting transcript
- [ ] **WEB-02**: Submit button triggers parse API and displays result
- [ ] **WEB-03**: Recipe renders as interactive checklist with checkable steps
- [ ] **WEB-04**: Progress bar shows completion (X of Y steps)
- [ ] **WEB-05**: Sections are collapsible to reduce visual overwhelm
- [ ] **WEB-06**: Checkbox state persists in localStorage across page reloads
- [ ] **WEB-07**: Loading state while API processes

### Design

- [ ] **DES-01**: Mobile-first layout (works on phone in kitchen)
- [ ] **DES-02**: Large tap targets for messy/wet hands
- [ ] **DES-03**: High contrast text (readable at arm's length)
- [ ] **DES-04**: Dark theme with dark grays (#1a1a1a, #2d2d2d) and amber accents (#f59e0b)
- [ ] **DES-05**: Minimal chrome, focus on content

### iOS Shortcut

- [ ] **IOS-01**: Shortcut receives shared audio file
- [ ] **IOS-02**: Shortcut transcribes audio using iOS built-in transcription
- [ ] **IOS-03**: Shortcut POSTs transcript to Cloudflare worker API
- [ ] **IOS-04**: Shortcut receives recipe JSON response
- [ ] **IOS-05**: Shortcut triggers TRMNL webhook (directly or via API)

## v2 Requirements

Deferred to post-hackathon. Tracked but not in current roadmap.

### Recipe Adaptation

- **ADAPT-01**: User can configure appliances they have/don't have
- **ADAPT-02**: User can set dietary preferences (vegetarian, vegan, gluten-free)
- **ADAPT-03**: API adapts recipe based on user context (substitute techniques, ingredients)
- **ADAPT-04**: Adapted steps show original text for comparison

### URL Extraction

- **URL-01**: POST /api/recipe/from-url fetches and parses recipe from URL
- **URL-02**: Parser handles common recipe site formats and cruft (life stories, ads)

### Settings

- **SET-01**: Settings page to configure appliances
- **SET-02**: Settings page to configure dietary preferences
- **SET-03**: Settings saved to localStorage

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Database persistence | LocalStorage sufficient for hackathon, no backend complexity |
| User accounts/auth | No need for multi-user yet |
| Voice recording in browser | iOS Shortcut handles transcription |
| Recipe discovery/search | This solves execution, not discovery |
| Recipe sharing | Personal tool first |
| Real-time collaboration | Single-user use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| WEB-01 | Phase 2 | Pending |
| WEB-02 | Phase 2 | Pending |
| WEB-03 | Phase 2 | Pending |
| WEB-04 | Phase 2 | Pending |
| WEB-05 | Phase 2 | Pending |
| WEB-06 | Phase 2 | Pending |
| WEB-07 | Phase 2 | Pending |
| DES-01 | Phase 2 | Pending |
| DES-02 | Phase 2 | Pending |
| DES-03 | Phase 2 | Pending |
| DES-04 | Phase 2 | Pending |
| DES-05 | Phase 2 | Pending |
| IOS-01 | Phase 4 | Pending |
| IOS-02 | Phase 4 | Pending |
| IOS-03 | Phase 4 | Pending |
| IOS-04 | Phase 4 | Pending |
| IOS-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22 (100%)
- Phase 1: 3 requirements (API core)
- Phase 2: 12 requirements (Web + Design)
- Phase 3: 2 requirements (TRMNL)
- Phase 4: 5 requirements (iOS)

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
