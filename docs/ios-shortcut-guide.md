# iOS Shortcut Build Guide: Recipe

This guide provides step-by-step instructions for building the "Recipe" iOS Shortcut that transforms voice recordings into interactive recipe checklists.

## Overview

**What this shortcut does:**
1. Takes a voice recording (Voice Memo) as input
2. Transcribes the audio to text using iOS built-in transcription
3. Sends the transcript to your Cloudflare Worker API
4. Receives a structured recipe back
5. Opens the recipe checklist in Safari (and optionally pushes to TRMNL)

**Prerequisites:**
- iOS 16+ (for Shortcuts with transcription support)
- Deployed Cloudflare Worker (your `/api/recipe/parse` endpoint)
- Deployed Vercel frontend (your recipe checklist web app)
- Both URLs accessible from your iPhone

**Expected flow time:** Under 30 seconds from sharing Voice Memo to viewing recipe

---

## Shortcut Settings

Before adding actions, configure these settings:

1. **Name:** Recipe
2. **Show in Share Sheet:** ON (toggle enabled)
3. **Share Sheet Types:** Audio
   - In "Share Sheet Types", tap "Select Types"
   - Choose "Media" category
   - Enable "Audio"
   - This allows sharing from Voice Memos, Music, Files, etc.

---

## Actions (Build These in Order)

### Action 1: Receive Shortcut Input
**Type:** `Receive [Shortcut Input] input from [Share Sheet or Siri]`

This action is automatically added when you enable "Show in Share Sheet". It receives the audio file from the app you're sharing from.

**Configuration:**
- Input: Shortcut Input
- From: Share Sheet

---

### Action 2: Transcribe Audio
**Search for:** "Transcribe Audio"

This action converts the audio recording to text using iOS built-in speech recognition.

**Configuration:**
- Input: Tap "Shortcut Input" (magic variable from Action 1)
- Language: Default (or select your preferred language)

**Output variable:** Transcribed Text

---

### Action 3: URL
**Search for:** "URL"

This action stores your Cloudflare Worker API endpoint.

**Configuration:**
- URL: `https://[WORKER_URL]/api/recipe/parse`

**Replace [WORKER_URL]:** Your deployed Cloudflare Worker domain (e.g., `recipe-worker.username.workers.dev`)

---

### Action 4: Get Contents of URL
**Search for:** "Get Contents of URL"

This action sends the transcript to your API and receives the structured recipe.

**Configuration:**
- URL: Tap to select "URL" (magic variable from Action 3)
- Method: POST
- Headers:
  - Add header: `Content-Type` = `application/json`
- Request Body: JSON
- JSON body:
  ```json
  {
    "transcript": "Transcribed Text"
  }
  ```
  - When typing the JSON, tap "Transcribed Text" in the magic variable picker to insert the actual transcription

**Output variable:** Contents of URL

---

### Action 5: Get Dictionary from Input
**Search for:** "Get Dictionary from Input"

This action parses the JSON response into a dictionary you can work with.

**Configuration:**
- Input: Tap to select "Contents of URL" (magic variable from Action 4)

**Output variable:** Dictionary

---

### Action 6: If
**Search for:** "If"

This action checks if the API returned an error.

**Configuration:**
- Input: Tap to select "Dictionary" (magic variable from Action 5)
- Condition: has any value
- Key: `error`

This creates an If/Otherwise block for error handling.

---

### Action 7: Show Alert (Error Path)
**Search for:** "Show Alert"

**IMPORTANT:** Add this INSIDE the "If" block (before the "Otherwise" appears).

This action displays an error message if something went wrong with the API.

**Configuration:**
- Title: `Recipe Error`
- Message: Tap "Dictionary" magic variable, then select "error" key
  - Or manually type and select "Get value for error from Dictionary"
- Show Cancel Button: OFF

---

### Action 8: Otherwise (Success Path)
**This is automatically added** after Action 7.

The following actions go INSIDE the "Otherwise" block (success path).

---

### Action 9: Text
**Search for:** "Text"

**IMPORTANT:** Add this INSIDE the "Otherwise" block.

This action prepares the full recipe JSON for encoding.

**Configuration:**
- Text: Tap to select "Contents of URL" (magic variable from Action 4)
  - This preserves the full JSON response as text

---

### Action 10: Base64 Encode
**Search for:** "Base64 Encode"

**IMPORTANT:** This action must be INSIDE the "Otherwise" block.

This action encodes the recipe JSON for safe URL transmission.

**Configuration:**
- Input: Tap to select "Text" (magic variable from Action 9)
- Mode: Encode
- Line Breaks: None (IMPORTANT: must be None, not "Every 64 Characters")

**Output variable:** Base64 Encoded

---

### Action 11: Text
**Search for:** "Text"

**IMPORTANT:** This action must be INSIDE the "Otherwise" block.

This action builds the complete URL with the encoded recipe.

**Configuration:**
- Text: `https://[VERCEL_URL]?recipe=[Base64 Encoded]`

**Replace [VERCEL_URL]:** Your deployed Vercel app domain (e.g., `recipe-manager.vercel.app`)

When typing, tap "Base64 Encoded" in the magic variable picker to insert the encoded recipe data.

**Example final URL:**
```
https://recipe-manager.vercel.app?recipe=eyJ0aXRsZSI6...
```

---

### Action 12: Show Notification
**Search for:** "Show Notification"

**IMPORTANT:** This action must be INSIDE the "Otherwise" block.

This action confirms the recipe was sent successfully.

**Configuration:**
- Title: `Recipe sent!`
- Body: `Opening recipe...`
- Sound: Default (or choose preferred notification sound)

---

### Action 13: Open URL
**Search for:** "Open URL"

**IMPORTANT:** This action must be INSIDE the "Otherwise" block.

This action opens Safari with your recipe checklist.

**Configuration:**
- URL: Tap to select "Text" (magic variable from Action 11 - the complete URL)

---

### Action 14: End If
**This is automatically added** to close the If/Otherwise block.

No configuration needed.

---

## Final Action Structure

Your completed shortcut should have this structure:

```
1. Receive Shortcut Input
2. Transcribe Audio
3. URL
4. Get Contents of URL
5. Get Dictionary from Input
6. If [Dictionary has any value for "error"]
   7. Show Alert (error message)
   Otherwise
   9. Text (Contents of URL)
   10. Base64 Encode
   11. Text (build URL with recipe param)
   12. Show Notification
   13. Open URL
   End If
```

---

## Testing the Shortcut

### Test Recording
Record a short Voice Memo describing a simple recipe:

**Example script:**
> "I want to make scrambled eggs. I'll need 2 eggs, some butter, and salt. First crack the eggs into a bowl and whisk them. Then melt butter in a pan, pour in the eggs, and stir until cooked."

### Test Steps
1. Open Voice Memos app
2. Find your test recording
3. Tap the Share button (up arrow in square)
4. Scroll down and select "Recipe"
5. Wait for processing (10-30 seconds depending on audio length)
6. You should see:
   - "Recipe sent!" notification
   - Safari automatically opens
   - Recipe checklist displayed with ingredients and steps

### What Happens Behind the Scenes
1. iOS transcribes the audio (may take 5-15 seconds)
2. Shortcut sends transcript to your Worker API
3. Claude parses the transcript into structured recipe (2-5 seconds)
4. If TRMNL webhook configured, recipe is pushed to display
5. Recipe encoded as base64 and added to URL parameter
6. Safari opens with the recipe checklist
7. Frontend decodes recipe and loads into localStorage

---

## Troubleshooting

### "Could not transcribe audio"
- Try a shorter recording (under 2 minutes works best)
- Speak more clearly with less background noise
- Check that iOS language matches your spoken language
- Ensure you have an internet connection (transcription may use server)

### "Recipe Error" alert appears
- Check that [WORKER_URL] in Action 3 is correct
- Verify Worker is deployed and accessible
- Try visiting `https://[WORKER_URL]/api/recipe/parse` in Safari
- Check Worker logs in Cloudflare dashboard
- Ensure ANTHROPIC_API_KEY is configured in Worker secrets

### Safari doesn't open
- Check that [VERCEL_URL] in Action 11 is correct
- Verify Vercel app is deployed and accessible
- Try visiting your Vercel URL directly in Safari

### No TRMNL update
- TRMNL_WEBHOOK_URL may not be configured in Worker secrets
- Check Worker environment variables in Cloudflare dashboard
- Verify webhook URL is correct in TRMNL dashboard
- This is non-blocking - recipe will still work without TRMNL

### Recipe looks wrong
- Check your voice recording for clarity
- Claude may misinterpret ambiguous instructions
- Try recording with more explicit structure (ingredients first, then steps)
- Use the "Adjust" feature in the web app to fix and re-parse

### Shortcut runs but nothing happens
- Check iPhone notifications - may see error message
- Try running shortcut from Shortcuts app directly (not share sheet)
- Check action order matches guide exactly
- Verify magic variables are connected correctly (blue pill-shaped buttons)

---

## URLs to Configure

Before testing, you need to replace these placeholders in your shortcut:

**Action 3 - API Endpoint:**
- Find: `[WORKER_URL]`
- Replace with: Your Cloudflare Worker domain
- Example: `recipe-worker.yourusername.workers.dev`
- Full URL: `https://recipe-worker.yourusername.workers.dev/api/recipe/parse`

**Action 11 - Frontend URL:**
- Find: `[VERCEL_URL]`
- Replace with: Your Vercel deployment domain
- Example: `recipe-manager.vercel.app`
- Full URL: `https://recipe-manager.vercel.app?recipe=`

**How to find your URLs:**
- **Worker URL:** Cloudflare Dashboard → Workers & Pages → recipe-worker → Settings
- **Vercel URL:** Vercel Dashboard → recipe-manager → Domains

---

## Next Steps

After building and testing the shortcut:

1. Try it with a real recipe from your daily cooking
2. Adjust the recipe using the web interface if needed
3. If you have a TRMNL device, verify the display updates
4. Share your experience or report issues

**Deployment checklist:**
- [ ] Cloudflare Worker deployed with ANTHROPIC_API_KEY
- [ ] Vercel frontend deployed and accessible
- [ ] TRMNL_WEBHOOK_URL configured (optional)
- [ ] iOS Shortcut built with correct URLs
- [ ] Test recording successful
- [ ] Recipe displays correctly in Safari
- [ ] TRMNL updates (if configured)

---

## Tips for Best Results

**Voice recording tips:**
- Speak clearly at normal pace
- Structure your description: name → ingredients → steps
- Use phrases like "I'll need" for ingredients, "First" / "Then" for steps
- Keep recordings under 2 minutes for faster transcription

**Recipe parsing tips:**
- Be explicit about quantities and units
- Mention cooking times and temperatures
- Use action verbs (chop, mix, bake, boil)
- Claude handles messy speech well - don't overthink it

**Kitchen usage tips:**
- Large checkboxes work well with messy hands
- Dark theme reduces screen glare
- Progress persists across page reloads
- Use "Adjust" feature to fix any parsing errors
