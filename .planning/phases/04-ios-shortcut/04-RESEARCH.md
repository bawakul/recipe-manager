# Phase 4: iOS Shortcut - Research

**Researched:** 2026-01-29
**Domain:** iOS Shortcuts automation
**Confidence:** MEDIUM

## Summary

iOS Shortcuts is Apple's native automation platform for creating workflows that integrate system capabilities and third-party apps. For Phase 4, the key capabilities are: (1) accepting audio files via share sheet, (2) transcribing audio using built-in speech recognition, (3) making HTTP POST requests with JSON, and (4) opening URLs with query parameters.

iOS 26 (released September 2025) improved the "Transcribe Audio" action's performance and reliability, addressing historical issues with transcription quality. The platform uses a visual action-based editor with "Magic Variables" for data flow between actions.

**Primary recommendation:** Use the native "Transcribe Audio" action (improved in iOS 26) rather than external APIs. Follow the standard pattern: Share Sheet Input → Transcribe Audio → Get Contents of URL (POST) → conditional logic → Show Notification + Open URL.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| iOS Shortcuts | iOS 26+ | Native automation platform | Built into iOS, no additional installation |
| Transcribe Audio action | iOS 26 | Speech-to-text conversion | Performance improved in iOS 26, on-device processing |
| Get Contents of URL | iOS 26 | HTTP requests | Native HTTP client with JSON support |
| Open URL | iOS 26 | Launch Safari with URL | Standard browser launching mechanism |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Show Notification | iOS 26 | User feedback | Non-blocking progress/completion messages |
| Show Alert | iOS 26 | Error display | Blocking error messages (user must acknowledge) |
| If/Otherwise | iOS 26 | Conditional logic | Error handling and flow control |
| URL Encode | iOS 26 | Text encoding | Encode special characters for URL parameters |
| Get Dictionary Value | iOS 26 | JSON parsing | Extract values from API responses |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Transcribe Audio | External APIs (Whisper, etc.) | Better accuracy but requires API keys, costs, network dependency |
| Share Sheet trigger | Manual file picker | More flexible but worse UX, higher friction |
| Show Notification | Custom progress UI | More control but notifications are simpler and standard |

**Installation:**
None required - iOS Shortcuts is built into iOS 17+. Shortcut files (.shortcut) can be shared via iCloud links or AirDrop.

## Architecture Patterns

### Recommended Action Sequence
```
1. Share Sheet Input (audio file filter)
2. Transcribe Audio
3. Get Contents of URL (POST with JSON)
4. Get Dictionary Value (parse response)
5. If (check success)
   → Success path: Show Notification + Open URL
   → Error path: Show Alert
```

### Pattern 1: Share Sheet Integration
**What:** Configure shortcut to appear in share sheet for specific file types
**When to use:** Trigger shortcuts from other apps (Voice Memos, Files, etc.)
**Example:**
```
Shortcut Settings:
- Show in Share Sheet: ON
- Accept: Audio (Media category)
- Shortcut Name: "Recipe" (short, easy to spot)

First Action: Receive [Audio] from Share Sheet
```
**Source:** [Apple Support - Understanding input types](https://support.apple.com/guide/shortcuts/input-types-apd7644168e1/ios)

### Pattern 2: Magic Variables for Data Flow
**What:** Use automatic outputs from previous actions as inputs to subsequent actions
**When to use:** Always - prefer Magic Variables over manual variables
**Example:**
```
Action 1: Transcribe Audio [audio file]
  Output: Transcribed Text (magic variable)

Action 2: Get Contents of URL
  Request Body:
    {
      "transcript": [Transcribed Text]  ← Tap to insert magic variable
    }
```
**Source:** [Apple Support - Use variables](https://support.apple.com/guide/shortcuts/use-variables-apdd02c2780c/ios)

### Pattern 3: JSON Request/Response Handling
**What:** Make HTTP POST with JSON body and parse JSON response
**When to use:** API communication with structured data
**Example:**
```
Action 1: Text
  {
    "transcript": "[Transcribed Text]",
    "format": "json"
  }

Action 2: Get Contents of URL
  URL: https://api.example.com/parse
  Method: POST
  Request Body: JSON
  JSON: [Text from previous action]

Action 3: Get Dictionary from Input
  Dictionary: [Contents of URL]

Action 4: Get Dictionary Value
  Key: "recipe_name"
  Dictionary: [Dictionary]
```
**Source:** [Apple Support - Parsing JSON](https://support.apple.com/guide/shortcuts/parsing-json-apdde2dfe749/ios)

### Pattern 4: URL with Query Parameters
**What:** Open Safari with data encoded in URL query parameters
**When to use:** Stateless web UI without backend storage
**Example:**
```
Action 1: URL Encode
  Text: [Recipe JSON]

Action 2: Text
  https://recipe-app.com?recipe=[URL Encoded Text]

Action 3: Open URL
  URL: [Text]
```
**Source:** [Apple Support - URL schemes](https://support.apple.com/guide/shortcuts/intro-to-url-schemes-apd621a1ad7a/ios)

### Pattern 5: Error Handling with Conditionals
**What:** Check API response and branch on success/error
**When to use:** Provide different user feedback based on outcomes
**Example:**
```
Action 1: Get Dictionary Value
  Key: "error"
  Dictionary: [API Response]

Action 2: If [Dictionary Value] has any value
  Otherwise:
    Show Notification "Recipe sent!"
    Open URL [Web UI URL]
  If:
    Show Alert "API Error: [Dictionary Value]"
```
**Source:** [Apple Support - If actions](https://support.apple.com/guide/shortcuts/use-if-actions-apd83dcd1b51/ios)

### Anti-Patterns to Avoid
- **Using "Ask Each Time" for dates:** iOS has bugs with timezone handling (produces strange output in timezones east of GMT)
- **Modifying filter configuration after setup (iOS <17):** Can crash Shortcuts app and corrupt the shortcut
- **Using "is in the last" for date ranges:** Known bug causes filter failures
- **Hardcoding values instead of variables:** Makes shortcuts inflexible and harder to maintain
- **Complex nested logic:** Shortcuts' conditional UI gets confusing - keep branching shallow

**Sources:** [Things Support - Shortcuts Actions](https://culturedcode.com/things/support/articles/9596775/), community reports

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio transcription | Custom speech-to-text integration | Native "Transcribe Audio" action | On-device processing (privacy), no API costs, improved in iOS 26 |
| URL encoding | Manual percent-encoding logic | "URL Encode" action | Handles all edge cases (spaces, special chars, unicode) |
| JSON parsing | Text manipulation with "Split" | "Get Dictionary from Input" + "Get Dictionary Value" | Type-safe, handles nested structures, supports lists |
| HTTP requests | URL schemes to external apps | "Get Contents of URL" action | Native timeout handling, supports all HTTP methods, JSON/form/file bodies |
| Progress feedback | Custom notifications via external service | "Show Notification" action (non-blocking) | Instant, no dependencies, standard iOS appearance |

**Key insight:** iOS Shortcuts provides native actions for common automation tasks that are more reliable and privacy-preserving than external services. The platform prioritizes on-device processing where possible.

## Common Pitfalls

### Pitfall 1: Transcribe Audio Reliability (Pre-iOS 26)
**What goes wrong:** "Transcribe Audio" action was historically unreliable, only working on short clips
**Why it happens:** Earlier iOS versions had performance limitations with the transcription engine
**How to avoid:** Require iOS 26+ where performance was significantly improved
**Warning signs:** User reports "transcription failed" or shortcut times out on longer audio
**Source:** [Cult of Mac - iOS 26 Shortcuts](https://www.cultofmac.com/guide/13-mind-blowing-ios-26-shortcuts-with-apple-intelligence), [Beard.fm - Transcribe Podcasts](https://beard.fm/blog/transcribe-and-summarize-podcasts-with-apple-notes-shortcuts)

### Pitfall 2: HTTP Response Status Checking
**What goes wrong:** Cannot easily access HTTP status codes (200, 400, 500) from "Get Contents of URL"
**Why it happens:** Shortcuts doesn't expose response status as a magic variable
**How to avoid:** Check for presence of expected dictionary keys or error messages in response body
**Warning signs:** Cannot distinguish between different error types (client vs server errors)
**Source:** [GitHub Issue - Paperless-NGX](https://github.com/paperless-ngx/paperless-ngx/issues/2667), Apple Community discussions

### Pitfall 3: Dictionary Key Order Randomization
**What goes wrong:** Dictionary order changes randomly when shortcut is saved
**Why it happens:** iOS Shortcuts doesn't preserve dictionary insertion order
**How to avoid:** Always access dictionary values by key name, never by position
**Warning signs:** Shortcut behavior changes after editing and re-saving
**Source:** [Michael Sliwinski - JSON Dictionaries](https://michael.team/json/)

### Pitfall 4: Empty Text Field Interpretation (iOS 18+)
**What goes wrong:** Conditional logic for "blank" fields behaves differently in iOS 18+
**Why it happens:** iOS 18 changed how empty text fields are interpreted (now has value of "blank" rather than "no value")
**How to avoid:** Test conditionals with empty strings explicitly; use "has any value" checks
**Warning signs:** If statements that worked pre-iOS 18 now behave incorrectly
**Source:** [Michael Sliwinski - Blanks](https://michael.team/blanks/)

### Pitfall 5: Get Contents of URL in HomeKit Automations
**What goes wrong:** HTTP requests fail when triggered via HomeKit automation (iOS 18.3)
**Why it happens:** Known bug with network access in automation context
**How to avoid:** Trigger shortcut manually or from share sheet, not from HomeKit/time-based automations
**Warning signs:** Shortcut works when run manually but fails when automated
**Source:** [Apple Community - Get Contents of URL](https://discussions.apple.com/thread/251563782)

### Pitfall 6: Voice Memos File Format (.qta vs .m4a)
**What goes wrong:** Voice Memos recorded on iOS 26 use .qta format instead of .m4a
**Why it happens:** iOS 26 introduced new QuickTime Audio format for Spatial Audio support
**How to avoid:** Accept both .qta and .m4a in share sheet input type; test on iOS 26 devices
**Warning signs:** Shortcut doesn't appear in share sheet when sharing from Voice Memos
**Source:** [MacRumors - Export Voice Memos](https://forums.macrumors.com/threads/how-do-i-export-voice-memos-as-audio.2475559/)

## Code Examples

Verified patterns from official sources:

### Making a POST Request with JSON
```
# Source: https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios

Action 1: URL
  https://your-api.com/endpoint

Action 2: Get Contents of URL
  [URL]
  Method: POST
  Headers:
    - Content-Type: application/json
  Request Body: JSON
  JSON:
    {
      "key1": "value1",
      "key2": "value2"
    }
```

### Parsing JSON Response
```
# Source: https://support.apple.com/guide/shortcuts/parsing-json-apdde2dfe749/ios

Action 1: Get Dictionary from Input
  [Contents of URL from previous action]

Action 2: Get Dictionary Value
  Key: "recipe_name"
  Dictionary: [Dictionary]
  → Returns the value of "recipe_name" key
```

### URL Encoding for Query Parameters
```
# Source: https://matthewcassinelli.com/actions/url-encode/

Action 1: URL Encode
  [Recipe JSON text]
  → Converts special characters to percent-encoding

Action 2: Text
  https://example.com?data=[URL Encoded text]
```

### Show Notification (Non-blocking)
```
# Source: https://support.apple.com/guide/shortcuts/use-the-show-notification-action-apd2175adcab/ios

Action: Show Notification
  Title: "Recipe sent!"
  Body: "Opening recipe..."
  → Displays notification and continues to next action immediately
```

### Conditional Error Handling
```
# Source: https://support.apple.com/guide/shortcuts/use-if-actions-apd83dcd1b51/ios

Action 1: Get Dictionary Value
  Key: "success"
  Dictionary: [API Response]

Action 2: If [Dictionary Value] equals "true"
  Show Notification "Success!"
  Open URL [recipe URL]
Otherwise
  Show Alert "Error: [Get Dictionary Value for 'error_message']"
```

### Share Sheet Configuration
```
# Source: https://support.apple.com/guide/shortcuts/input-types-apd7644168e1/ios

Shortcut Settings:
  Details → Show in Share Sheet: ON
  Details → Share Sheet Types: Audio (from Media category)
  Details → Shortcut Name: "Recipe"

First Action: Receive [Audio] input from Share Sheet
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External transcription APIs | Native "Transcribe Audio" action | iOS 17 (improved iOS 26) | On-device processing, better privacy, no API costs |
| Manual variable creation | Magic Variables | iOS 13+ | Simpler workflow creation, less boilerplate |
| Dictionary position access | Key-based access | Always recommended | More reliable due to random order bug |
| .m4a audio files | .qta format support | iOS 26 (Sept 2025) | Spatial Audio recordings require new format |
| Simple text notifications | Rich media notifications | iOS 14+ | Can display images, maps in notifications |

**Deprecated/outdated:**
- **Manual variables for action outputs:** Use Magic Variables instead (blue tokens under each action)
- **Text manipulation for JSON parsing:** Use "Get Dictionary from Input" action (more reliable)
- **Third-party transcription shortcuts:** Native action is now reliable as of iOS 26

## Open Questions

Things that couldn't be fully resolved:

1. **Exact timeout for HTTP requests**
   - What we know: Default appears to be around 120 seconds based on community reports; Pushcut automation server uses 10-45 second timeouts
   - What's unclear: Official documentation doesn't specify "Get Contents of URL" timeout value
   - Recommendation: Assume 30-60 second timeout; optimize API to respond quickly; test with real network conditions
   - Source: [Pushcut - Automation Server](https://www.pushcut.io/support/automation-server)

2. **Notification display duration**
   - What we know: Show Notification action displays standard iOS notification banner
   - What's unclear: How long notification stays visible (likely follows system defaults: ~5 seconds on lock screen, varies in notification center)
   - Recommendation: Don't rely on notification for critical information; use Show Alert for must-read messages

3. **Base64 vs URL encoding for recipe data**
   - What we know: Both Base64 and URL encoding available; Base64 has 76-char line break default (can be set to "None")
   - What's unclear: Which is better for passing large JSON in URL parameters (query string length limits)
   - Recommendation: Test both approaches; URL encoding may be more readable for debugging; Base64 more compact
   - Source: [RoutineHub - Encode To Base64](https://routinehub.co/shortcut/9273/)

4. **Maximum audio file size for transcription**
   - What we know: Pre-iOS 26 had issues with long audio; iOS 26 improved performance
   - What's unclear: Official maximum duration or file size limits for "Transcribe Audio" action
   - Recommendation: Test with typical Voice Memo lengths (30-120 seconds expected for recipe dictation)

5. **Share sheet file type specificity**
   - What we know: Can filter by "Audio" (broad category) or specific types
   - What's unclear: Whether .qta format requires explicit type specification or is included in "Audio" category
   - Recommendation: Use broad "Audio" category rather than specific .m4a/.qta to maximize compatibility

## Sources

### Primary (HIGH confidence)
- [Apple Support - Request your first API](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) - Official HTTP request documentation
- [Apple Support - Parsing JSON](https://support.apple.com/guide/shortcuts/parsing-json-apdde2dfe749/ios) - Official JSON handling guide
- [Apple Support - Use variables](https://support.apple.com/guide/shortcuts/use-variables-apdd02c2780c/ios) - Official Magic Variables documentation
- [Apple Support - Input types](https://support.apple.com/guide/shortcuts/input-types-apd7644168e1/ios) - Official share sheet configuration
- [Apple Support - URL schemes](https://support.apple.com/guide/shortcuts/intro-to-url-schemes-apd621a1ad7a/ios) - Official URL handling documentation
- [Apple Support - Show Notification](https://support.apple.com/guide/shortcuts/use-the-show-notification-action-apd2175adcab/ios) - Official notification action docs
- [Apple Support - If actions](https://support.apple.com/guide/shortcuts/use-if-actions-apd83dcd1b51/ios) - Official conditional logic guide
- [Apple Support - What's new iOS 26](https://support.apple.com/en-us/125148) - Official iOS 26 Shortcuts features

### Secondary (MEDIUM confidence)
- [Blog.RoutineHub - How to send POST request](https://blog.routinehub.co/how-to-send-a-post-request-with-apple-shortcuts/) - Tutorial verified with official docs
- [Beard.fm - Transcribe Podcasts](https://beard.fm/blog/transcribe-and-summarize-podcasts-with-apple-notes-shortcuts) - Community verification of iOS 26 transcription improvements
- [Michael Sliwinski - JSON Dictionaries](https://michael.team/json/) - Dictionary order bug documentation
- [Michael Sliwinski - Blanks](https://michael.team/blanks/) - iOS 18 empty field behavior change
- [Matthew Cassinelli - URL Encode](https://matthewcassinelli.com/actions/url-encode/) - Expert Shortcuts developer reference

### Tertiary (LOW confidence - requires validation)
- Community reports about .qta format in iOS 26 (needs testing with actual iOS 26 device)
- HTTP timeout values from community experience (no official documentation found)
- "Get Contents of URL" HomeKit automation bug reports (specific to iOS 18.3, may be fixed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on official Apple documentation and current iOS 26 features
- Architecture: HIGH - Patterns verified with official Apple Support guides
- Pitfalls: MEDIUM - Mix of documented bugs and community reports; some need iOS 26 device validation
- Audio transcription: MEDIUM - Performance improvements confirmed in official iOS 26 changelog, but specific reliability claims based on community feedback

**Research date:** 2026-01-29
**Valid until:** 2026-09-01 (iOS 27 likely to be announced September 2026, may introduce changes)
