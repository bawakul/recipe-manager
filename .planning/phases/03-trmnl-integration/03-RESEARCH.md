# Phase 3: TRMNL Integration - Research

**Researched:** 2026-01-29
**Domain:** E-ink display webhook integration (TRMNL platform)
**Confidence:** HIGH

## Summary

TRMNL is an e-ink display platform (800x480 monochrome, 2-bit grayscale) designed for low-power dashboards and data displays. Integration is achieved through webhook-based "private plugins" that POST JSON payloads containing `merge_variables` which are rendered using Liquid templates.

The platform has strict constraints: standard accounts can send 12 requests/hour with 2kb payload limit (TRMNL+ allows 30/hour with 5kb). Rate limit violations return 429 status codes. The display is static (no buttons/interaction), requiring designs optimized for single-screen viewing.

Cloudflare Workers is well-suited for this integration, providing edge-deployed API endpoints that can format recipe data, validate payload size, POST to TRMNL webhooks, and handle errors gracefully. The key challenge is compressing recipe steps into <2kb while maintaining readability on a monochrome display.

**Primary recommendation:** Store TRMNL webhook URL as Cloudflare secret, measure payload size before sending, use Liquid `truncate` filter for compression, implement reactive 429 error handling with warning responses.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TRMNL Webhook API | v1 (2026) | POST merge_variables to device | Official integration method for private plugins |
| Liquid Templates | Shopify v5.6+ | Render dynamic content on display | TRMNL's official templating engine |
| Cloudflare Workers Fetch API | Native | POST to external webhook | Built-in Workers runtime API for HTTP requests |
| TextEncoder API | Native (Web Standards) | Measure payload size in bytes | Accurate UTF-8 byte measurement for size validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| trmnl-liquid | Latest (2026-01-28) | Custom Liquid filters/tags | For development/testing templates locally |
| Cloudflare Secrets | Native | Store webhook URL | Prevent URL exposure in logs/dashboard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Webhook (push) | Polling (pull) | Polling requires hosting JSON endpoint, loses auto-push convenience |
| Cloudflare Secrets | Environment variables | Env vars expose URL in dashboard, secrets hide value |
| Liquid templates | Pure HTML | Liquid provides filters (truncate, date formatting) for free |

**Installation:**
```bash
# No npm packages needed for Cloudflare Workers
# TRMNL integration uses native fetch API
# Secrets stored via wrangler CLI:
wrangler secret put TRMNL_WEBHOOK_URL
```

## Architecture Patterns

### Recommended Project Structure
```
workers/
├── trmnl-webhook.js     # Main handler
├── formatters/
│   ├── recipe-to-trmnl.js   # Transform recipe JSON to merge_variables
│   └── payload-validator.js # Measure size, truncate if needed
└── wrangler.toml        # Cloudflare config (no secrets!)
```

### Pattern 1: Webhook Payload Format
**What:** TRMNL requires `merge_variables` wrapper around data
**When to use:** Every POST to TRMNL webhook
**Example:**
```typescript
// Source: https://docs.trmnl.com/go/private-plugins/webhooks
const payload = {
  merge_variables: {
    recipe_title: "Spicy Thai Basil Chicken",
    sections: [
      { name: "Prep", steps: ["Dice chicken", "Chop basil"] },
      { name: "Cook", steps: ["Heat wok", "Stir fry 5min"] },
      { name: "Assemble", steps: ["Plate over rice", "Garnish"] }
    ],
    step_count: 6
  }
};

await fetch(env.TRMNL_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### Pattern 2: Payload Size Validation
**What:** Measure JSON size before sending, truncate if needed
**When to use:** Before every TRMNL POST
**Example:**
```typescript
// Source: https://zwbetz.com/get-the-approximate-size-of-a-js-object-in-bytes/
function measurePayload(obj) {
  const serialized = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(serialized).length;
  return { serialized, bytes };
}

const { serialized, bytes } = measurePayload(payload);
if (bytes > 2048) {
  // Truncate steps or remove data
  payload.merge_variables.truncated = true;
}
```

### Pattern 3: Reactive Rate Limit Handling
**What:** Catch 429 errors, return success with warning (don't fail the parse)
**When to use:** TRMNL webhook calls
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
try {
  const response = await fetch(trmnlWebhookUrl, { method: 'POST', body });

  if (response.status === 429) {
    return {
      success: true,
      recipe: parsedRecipe,
      warnings: ['TRMNL rate limit reached (12/hr). Display will update after reset.']
    };
  }

  if (!response.ok) {
    return {
      success: true,
      recipe: parsedRecipe,
      warnings: [`TRMNL push failed (${response.status}). Recipe parsed successfully.`]
    };
  }

  return { success: true, recipe: parsedRecipe, trmnl_pushed: true };
} catch (error) {
  return {
    success: true,
    recipe: parsedRecipe,
    warnings: ['TRMNL push failed (network error). Recipe parsed successfully.']
  };
}
```

### Pattern 4: Liquid Template for Static Display
**What:** Use TRMNL's layout classes and Liquid syntax for e-ink rendering
**When to use:** Creating private plugin template in TRMNL dashboard
**Example:**
```liquid
<!-- Source: https://docs.trmnl.com/go/private-plugins/templates -->
<div class="screen">
  <div class="view view--full">
    <div class="layout">
      <div class="columns">
        <div class="column">
          <h1 class="title">{{ recipe_title | truncate: 40 }}</h1>

          {% for section in sections %}
            <h2 class="label">{{ section.name }}</h2>
            <ul>
              {% for step in section.steps %}
                <li>☐ {{ step | truncate: 80, "" }}</li>
              {% endfor %}
            </ul>
          {% endfor %}

          <p class="content">{{ step_count }} steps</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Proactive rate limit tracking:** Don't count requests yourself - catch 429 errors reactively (12/hr limit may change, debug mode increases it)
- **Failing parse on TRMNL error:** Parse API should always succeed if recipe parsed correctly - TRMNL push is secondary
- **Storing webhook URL in code:** Use Cloudflare secrets (env.TRMNL_WEBHOOK_URL) to prevent exposure
- **Using string.length for size:** JavaScript string.length counts UTF-16 characters, not UTF-8 bytes - use TextEncoder
- **Deep nesting in merge_variables:** Keep structure flat for easier template access and smaller payload

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Measure JSON size | Custom byte counter | TextEncoder().encode(str).length | Accurate UTF-8 byte count (matches network/API behavior) |
| Truncate text in display | Custom string cutting | Liquid truncate filter | Built into TRMNL templates, handles ellipsis automatically |
| Retry logic for 429 | Custom retry queue | Reactive catch + warning | TRMNL limit is hourly reset, retrying wastes time |
| Template rendering | Custom HTML builder | Liquid templates | TRMNL provides filters (truncate, date, number) for free |
| Payload compression | gzip/brotli | Shorter field names + truncation | HTTP compression not supported in merge_variables JSON |

**Key insight:** TRMNL's webhook API is intentionally simple (POST JSON, done). Don't over-engineer with retry queues, compression libraries, or custom templating. The constraint (2kb, 12/hr) encourages minimal, focused displays - embrace it.

## Common Pitfalls

### Pitfall 1: Webhook URL Exposure in Environment Variables
**What goes wrong:** Storing TRMNL webhook URL in plaintext `vars` exposes it in Cloudflare dashboard and wrangler.toml
**Why it happens:** Environment variables feel convenient, but Cloudflare treats them as non-sensitive
**How to avoid:** Use `wrangler secret put TRMNL_WEBHOOK_URL` - values are encrypted and hidden from dashboard
**Warning signs:** If you can see the webhook URL in Cloudflare dashboard > Settings > Variables, it's not a secret

### Pitfall 2: Payload Size Measured After Sending
**What goes wrong:** You POST to TRMNL, get error/rejection, but don't know why
**Why it happens:** Assuming JSON.stringify() output is <2kb without measuring
**How to avoid:** Measure with TextEncoder before sending, truncate if >2048 bytes
**Warning signs:** Intermittent TRMNL push failures with no clear pattern (recipe length varies)

### Pitfall 3: Missing Content-Type Header
**What goes wrong:** TRMNL webhook silently fails or returns 400 error
**Why it happens:** Fetch defaults to no Content-Type, TRMNL expects JSON
**How to avoid:** Always include `headers: { 'Content-Type': 'application/json' }` in webhook POST
**Warning signs:** Webhook returns error but payload/URL are correct

### Pitfall 4: Using merge_variables Structure in Template
**What goes wrong:** Template tries to access `{{ merge_variables.recipe_title }}` instead of `{{ recipe_title }}`
**Why it happens:** `merge_variables` is the webhook format, but Liquid templates get direct variable access
**How to avoid:** Webhook POST uses `{ merge_variables: { title: "X" } }`, template uses `{{ title }}`
**Warning signs:** TRMNL display shows blank/missing data despite successful webhook POST

### Pitfall 5: Treating 429 Rate Limit as Fatal Error
**What goes wrong:** Parse API returns error to iOS Shortcut, user thinks parsing failed
**Why it happens:** Conflating TRMNL push failure with recipe parse failure
**How to avoid:** Return success response with warning when rate limited - recipe still parsed correctly
**Warning signs:** User retries voice input multiple times because they think it "didn't work"

### Pitfall 6: Forgetting to Create Plugin Instance First
**What goes wrong:** No webhook URL available, can't send data
**Why it happens:** TRMNL generates UUID only after you "save" plugin instance in dashboard
**How to avoid:** Go to TRMNL dashboard > Private Plugins > Create > Save to get webhook URL
**Warning signs:** Documentation mentions webhook URL but you don't have one yet

### Pitfall 7: Testing with Production Rate Limits
**What goes wrong:** Development iterations hit 12/hr limit quickly
**Why it happens:** Each test POST counts against hourly limit
**How to avoid:** Enable "Debug Logs" in TRMNL plugin settings to temporarily increase limit during development
**Warning signs:** Getting 429 errors during development/testing phase

## Code Examples

Verified patterns from official sources:

### Minimal TRMNL Webhook Handler (Cloudflare Workers)
```typescript
// Source: Cloudflare Workers fetch API + TRMNL webhook docs
export default {
  async fetch(request, env) {
    // Parse incoming recipe
    const { recipe } = await request.json();

    // Transform to TRMNL format
    const payload = {
      merge_variables: {
        recipe_title: recipe.title,
        sections: recipe.sections.map(s => ({
          name: s.name,
          steps: s.steps.slice(0, 3) // Max 3 steps per section for space
        })),
        step_count: recipe.sections.reduce((sum, s) => sum + s.steps.length, 0)
      }
    };

    // Measure and truncate if needed
    const serialized = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(serialized).length;

    if (bytes > 2048) {
      // Truncate by removing last section's steps
      payload.merge_variables.truncated = true;
      payload.merge_variables.sections.pop();
    }

    // POST to TRMNL
    try {
      const response = await fetch(env.TRMNL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return Response.json({
          success: true,
          recipe,
          warnings: ['TRMNL rate limit reached. Display will update after hourly reset.']
        });
      }

      return Response.json({ success: true, recipe, trmnl_pushed: true });
    } catch (error) {
      return Response.json({
        success: true,
        recipe,
        warnings: ['TRMNL push failed. Recipe parsed successfully.']
      });
    }
  }
};
```

### TRMNL Template with Checkboxes and Step Count
```liquid
<!-- Source: TRMNL template docs + community examples -->
<div class="screen">
  <div class="view view--full">
    <div class="layout">
      <div class="columns">
        <div class="column">
          <div class="title_bar">
            <h1>{{ recipe_title | truncate: 35, "..." }}</h1>
          </div>

          {% for section in sections %}
            <div style="margin-top: 12px;">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
                {{ section.name }}
              </h2>
              {% for step in section.steps %}
                <div style="display: flex; margin-bottom: 6px;">
                  <span style="margin-right: 8px;">☐</span>
                  <span style="font-size: 14px;">{{ step | truncate: 70, "" }}</span>
                </div>
              {% endfor %}
            </div>
          {% endfor %}

          <div style="margin-top: 16px; text-align: center; font-size: 12px; color: #666;">
            {{ step_count }} steps total
            {% if truncated %}• Display truncated to fit{% endif %}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Payload Compression Strategy
```typescript
// Source: Baeldung JSON reduction + TRMNL best practices
function compressRecipePayload(recipe) {
  // Strategy 1: Shorten field names (72.5% of original size)
  const payload = {
    merge_variables: {
      t: recipe.title.substring(0, 40),  // title -> t
      s: recipe.sections.map(section => ({
        n: section.name,                  // name -> n
        st: section.steps.map(step =>     // steps -> st
          step.substring(0, 80)           // truncate each step
        ).slice(0, 3)                     // max 3 steps per section
      })),
      c: recipe.sections.reduce((sum, s) => sum + s.steps.length, 0), // count -> c
      tr: false                           // truncated -> tr
    }
  };

  // Strategy 2: Measure and remove sections if still too large
  let serialized = JSON.stringify(payload);
  let bytes = new TextEncoder().encode(serialized).length;

  while (bytes > 2048 && payload.merge_variables.s.length > 1) {
    payload.merge_variables.s.pop();
    payload.merge_variables.tr = true;
    serialized = JSON.stringify(payload);
    bytes = new TextEncoder().encode(serialized).length;
  }

  return { payload, bytes, truncated: payload.merge_variables.tr };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling strategy | Webhook strategy | 2024 (TRMNL v1) | Push-based updates are immediate, no hosting JSON endpoint |
| Global Liquid registration | Environment-based registration | Liquid v5.6.0 (2023) | Safer isolation, no global pollution |
| Plain text env vars | Cloudflare Secrets | 2021 | Webhook URLs hidden from dashboard/logs |
| Manual retry logic | Reactive 429 handling | Current best practice | Hourly reset makes retry queues wasteful |

**Deprecated/outdated:**
- **usetrmnl.com domain**: Redirects to trmnl.com (docs updated 2026)
- **Global Liquid.register_filter()**: Use TRMNL::Liquid.build_environment instead (safer)
- **Assuming 5kb limit**: Free tier is 2kb, TRMNL+ is 5kb (check account type)

## Open Questions

Things that couldn't be fully resolved:

1. **Exact TRMNL display font sizing**
   - What we know: 800x480 monochrome display, example code uses 24px font, Inter font family recommended
   - What's unclear: Optimal font size for recipe steps (readable but fits ~10 steps)
   - Recommendation: Start with 14px body text, 18px section headers, 24px title - adjust after seeing device

2. **Rate limit reset timing**
   - What we know: 12 requests/hour limit, 429 response when exceeded
   - What's unclear: Does "hour" mean rolling 60min window or top-of-hour reset?
   - Recommendation: Treat as rolling window (safer assumption), rely on Retry-After header if provided

3. **Webhook timeout behavior**
   - What we know: Cloudflare Workers fetch API supports timeouts
   - What's unclear: Does TRMNL webhook have its own timeout? What's acceptable latency?
   - Recommendation: Set 10s timeout on Worker side, fail gracefully if exceeded

4. **Template CSS specificity**
   - What we know: TRMNL provides plugins.css framework
   - What's unclear: Can inline styles override framework? What's the cascade order?
   - Recommendation: Use framework classes (.title, .content, .label) first, inline styles for fine-tuning

## Sources

### Primary (HIGH confidence)
- [TRMNL Webhooks API Docs](https://docs.trmnl.com/go/private-plugins/webhooks) - Webhook format, rate limits, payload size, merge_variables structure
- [TRMNL Screen Templating Docs](https://docs.trmnl.com/go/private-plugins/templates) - Liquid syntax, display specs (800x480, 2-bit grayscale), layout classes
- [Cloudflare Workers Fetch API](https://developers.cloudflare.com/workers/runtime-apis/fetch/) - POST requests, async execution context
- [Cloudflare Workers Error Handling](https://developers.cloudflare.com/workers/observability/errors/) - try-catch patterns, waitUntil(), passThroughOnException()
- [Cloudflare Secrets Docs](https://developers.cloudflare.com/workers/configuration/secrets/) - Secret storage, .dev.vars, wrangler secret put
- [Shopify Liquid truncate filter](https://shopify.github.io/liquid/filters/truncate/) - Text truncation with custom ellipsis

### Secondary (MEDIUM confidence)
- [TRMNL + Cloudflare Workers Example](https://danielbeck.io/posts/home-eink-display-trmnl-cloudflare-workers/) - Real-world implementation, development time estimate (30min)
- [TRMNL trmnl-liquid gem](https://github.com/usetrmnl/trmnl-liquid) - Custom Liquid filters (number_with_delimiter, template tag)
- [TRMNL RTM Plugin Example](https://github.com/sejtenik/trmnl-rtm-plugin) - Task list rendering patterns, environment variable usage
- [Baeldung JSON Size Reduction](https://www.baeldung.com/json-reduce-data-size) - Shorter field names (72.5% size), array serialization (53.1%)
- [TextEncoder for Payload Measurement](https://zwbetz.com/get-the-approximate-size-of-a-js-object-in-bytes/) - Accurate UTF-8 byte counting

### Tertiary (LOW confidence)
- WebSearch: E-ink todo list patterns - checkbox UI examples (24px font reference from Adafruit)
- WebSearch: Rate limit best practices - exponential backoff with jitter (not needed for TRMNL's hourly reset)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official TRMNL docs, Cloudflare Workers docs, Liquid docs verified
- Architecture: HIGH - Patterns verified with TRMNL API docs and community examples
- Pitfalls: HIGH - Extracted from official docs (webhook format, secrets, rate limits) and verified examples

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable platform, official docs)
