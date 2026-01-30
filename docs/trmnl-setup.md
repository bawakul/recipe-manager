# TRMNL Setup Guide

## 1. Create Private Plugin

1. Go to TRMNL dashboard → Plugins → Private Plugins → Create
2. Name: `Recipe` (or whatever you prefer)
3. Strategy: **Webhook**
4. Save to generate your webhook URL

## 2. Add Liquid Template

In the plugin settings, click **Edit Markup** and paste:

```liquid
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
            {% if truncated %} • Display truncated to fit{% endif %}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Save the template.

## 3. Configure Worker

Copy your webhook URL and add it to the Cloudflare Worker:

**Local development (`.dev.vars`):**
```
TRMNL_WEBHOOK_URL=https://trmnl.com/api/custom_plugins/YOUR-UUID
```

**Production:**
```bash
wrangler secret put TRMNL_WEBHOOK_URL
```

## 4. Test

Submit a transcript via the web UI. The recipe should appear on your TRMNL device.

## Payload Format

The Worker sends this structure:

```json
{
  "merge_variables": {
    "recipe_title": "Scrambled Eggs",
    "sections": [
      {
        "name": "Prep",
        "steps": ["Crack eggs into bowl", "Whisk until combined"]
      },
      {
        "name": "Cook",
        "steps": ["Melt butter in pan", "Pour in eggs and stir"]
      }
    ],
    "step_count": 4,
    "truncated": false
  }
}
```

Note: `steps` is an array of **strings**, not objects. The template uses `{{ step }}` directly.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| HTTP 404 | Wrong webhook URL | Copy URL exactly from TRMNL dashboard |
| Steps not showing | Template uses `step.text` | Use `{{ step }}` instead |
| HTTP 429 | Rate limit (12/hour) | Wait for hourly reset, or enable Debug Logs |
| Payload too large | Recipe has many steps | Worker auto-compresses to <2kb |
