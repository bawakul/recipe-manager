---
date: 2026-01-30
project: recipe-manager
type: session
tags: [session, deployment, debugging, trmnl]
---

# TRMNL Integration Debug & Production Deploy

## Summary

Received TRMNL device, debugged integration issues, deployed to production. Project shipped.

## What Happened

### TRMNL Setup & Debugging

1. **Created TRMNL Private Plugin** in dashboard
   - Strategy: Webhook
   - Generated webhook URL

2. **Added Liquid template** for e-ink display
   - Initial template from research docs had bug: used `{{ step.text }}` but Worker sends plain strings
   - Fixed to `{{ step }}` — steps now display correctly

3. **Configured Worker secrets**
   - Added `TRMNL_WEBHOOK_URL` to `.dev.vars`
   - Initial 404 error due to malformed URL (copy/paste issue)
   - Fixed URL, webhook now returns 200

4. **Verified end-to-end flow**
   - Pasted transcript in web UI
   - Recipe parsed successfully
   - TRMNL device updated with recipe display

### Production Deployment

1. **Deployed Cloudflare Worker**
   ```
   npx wrangler deploy
   ```
   - Registered workers.dev subdomain: `bawas-lab.workers.dev`
   - API live at: https://recipe-parser.bawas-lab.workers.dev

2. **Set production secrets**
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put TRMNL_WEBHOOK_URL
   ```

3. **Deployed frontend to Vercel**
   ```
   npx vercel --prod
   ```
   - App live at: https://recipe-displayer.vercel.app
   - Set `NEXT_PUBLIC_API_URL` environment variable

4. **Tested production**
   - Initial network error (needed hard refresh for env var)
   - After refresh: full flow working

## Key Findings

### TRMNL Payload Format
Worker sends steps as plain strings, not objects:
```json
{
  "merge_variables": {
    "sections": [
      {
        "name": "Prep",
        "steps": ["Crack eggs", "Whisk"]  // strings, not {text: "..."}
      }
    ]
  }
}
```

Template must use `{{ step }}` not `{{ step.text }}`.

### TRMNL Dashboard UX
User noted: "The UX of the TRMNL plugin+dashboard is TERRIBLE though."

## Files Changed

- `.planning/STATE.md` — Added decision about step format
- `docs/trmnl-setup.md` — Created setup guide with correct template

## Deployment URLs

| Component | URL |
|-----------|-----|
| Web App | https://recipe-displayer.vercel.app |
| API | https://recipe-parser.bawas-lab.workers.dev |

## Outcome

Project shipped and working. Used it to parse a recipe for dinner.

## Context Note

Original hackathon deadline passed — user ended up doing a different project for the hackathon. This project was completed afterwards for personal use.
