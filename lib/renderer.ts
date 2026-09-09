/**
 * Weekly newsletter HTML renderer (Handlebars).
 * Shared between Next.js API routes and the MCP server.
 */

import Handlebars from "handlebars"

const nlName = () => process.env.NEWSLETTER_NAME || "Newsletter"
const nlColor = () => process.env.NEWSLETTER_COLOR || "#4f46e5"

export interface WeeklyNewsletterData {
  weekOf: string
  chefsTable: { title?: string; body: string }
  news: Array<{ title: string; url: string; summary: string; source?: string }>
  reading: Array<{ title: string; url?: string; description: string; source?: string }>
  cooking: Array<{ title: string; description: string; url?: string }>
  unsubscribeUrl: string
  preferencesUrl: string
  bannerUrl: string
}

const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{newsletterName}} - {{weekOf}}</title>
  <style>
    @media only screen and (max-width:600px){.mc{padding:24px 16px!important}.mh{padding:24px 16px 28px!important}.mf{padding:20px 16px 28px!important}}
  </style>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.7;color:#0d0d0d;background:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:20px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;">

            <tr><td style="background-image:url('{{bannerUrl}}');background-size:cover;background-position:center;border-radius:20px 20px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td bgcolor="#0d0d0d" class="mh" style="padding:32px 40px 36px;background-color:rgba(13,13,13,0.55);">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:11px;font-weight:600;color:{{accentColor}};text-transform:uppercase;letter-spacing:.1em;">{{newsletterName}}</td>
                      <td align="right" style="font-size:12px;color:rgba(255,255,255,0.7);">Week of {{weekOf}}</td>
                    </tr>
                  </table>
                  <h1 style="margin:24px 0 0;font-size:32px;font-weight:600;color:#fff;line-height:1.15;letter-spacing:-.03em;">{{weeklyTitle}}</h1>
                </td></tr>
              </table>
            </td></tr>

            <tr><td class="mc" style="padding:36px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:24px;background:rgba(0,0,0,0.02);border-radius:16px;border-left:4px solid {{accentColor}};">
                  <div style="font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{{accentColor}};margin-bottom:12px;">{{editorialLabel}}</div>
                  {{#if chefsTable.title}}<h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#0d0d0d;line-height:1.3;">{{chefsTable.title}}</h2>{{/if}}
                  <p style="margin:0;font-size:15px;color:rgba(13,13,13,0.75);line-height:1.7;">{{{nl2br chefsTable.body}}}</p>
                </td></tr>
              </table>
            </td></tr>

            {{#if news.length}}
            <tr><td class="mc" style="padding:32px 40px 0;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{{accentColor}};margin-bottom:16px;">News</div>
              {{#each news}}
              <div style="padding-bottom:{{#unless @last}}20px{{else}}0{{/unless}};margin-bottom:{{#unless @last}}20px{{else}}0{{/unless}};border-bottom:{{#unless @last}}1px solid rgba(0,0,0,0.06){{else}}none{{/unless}};">
                <span style="display:inline-block;background:{{accentColor}};color:#fff;width:24px;height:24px;text-align:center;line-height:24px;border-radius:6px;font-size:12px;font-weight:700;margin-right:12px;">{{math @index "+" 1}}</span>
                <strong style="font-size:16px;">{{#if url}}<a href="{{url}}" style="color:#0d0d0d;text-decoration:none;">{{title}}</a>{{else}}{{title}}{{/if}}</strong>
                {{#if source}}<p style="margin:4px 0 6px;font-size:11px;color:rgba(13,13,13,0.5);text-transform:uppercase;">{{source}}</p>{{/if}}
                <p style="margin:0;font-size:14px;color:rgba(13,13,13,0.7);">{{summary}}</p>
              </div>
              {{/each}}
            </td></tr>
            {{/if}}

            {{#if reading.length}}
            <tr><td class="mc" style="padding:32px 40px 0;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{{accentColor}};margin-bottom:16px;">What We're Reading</div>
              {{#each reading}}
              <div style="padding:16px 18px;margin-bottom:{{#unless @last}}12px{{else}}0{{/unless}};background:#fafafa;border-radius:12px;border:1px solid rgba(0,0,0,0.04);">
                <h4 style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0d0d0d;">{{#if url}}<a href="{{url}}" style="color:#0d0d0d;text-decoration:none;">{{title}}</a>{{else}}{{title}}{{/if}}</h4>
                {{#if source}}<span style="display:inline-block;background:rgba(0,0,0,0.05);color:{{accentColor}};padding:2px 8px;font-size:10px;border-radius:4px;margin-bottom:8px;font-weight:600;text-transform:uppercase;">{{source}}</span>{{/if}}
                <p style="margin:0;font-size:14px;color:rgba(13,13,13,0.7);">{{{nl2br description}}}</p>
              </div>
              {{/each}}
            </td></tr>
            {{/if}}

            {{#if cooking.length}}
            <tr><td class="mc" style="padding:32px 40px 0;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{{accentColor}};margin-bottom:16px;">What We're Cooking</div>
              {{#each cooking}}
              <div style="padding:18px 20px;margin-bottom:{{#unless @last}}12px{{else}}0{{/unless}};background:rgba(0,0,0,0.02);border-radius:12px;border:1px solid rgba(0,0,0,0.06);">
                <h4 style="margin:0 0 8px;font-size:15px;font-weight:600;">{{#if url}}<a href="{{url}}" style="color:{{accentColor}};text-decoration:none;">{{title}}</a>{{else}}{{title}}{{/if}}</h4>
                <p style="margin:0;font-size:14px;color:rgba(13,13,13,0.7);">{{{nl2br description}}}</p>
                {{#if url}}<a href="{{url}}" style="display:inline-block;margin-top:10px;color:{{accentColor}};text-decoration:none;font-weight:600;font-size:13px;">Check it out →</a>{{/if}}
              </div>
              {{/each}}
            </td></tr>
            {{/if}}

            <tr><td class="mf" style="padding:36px 40px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(13,13,13,0.6);font-size:13px;">You are receiving this because you subscribed to <strong>{{newsletterName}}</strong>.</p>
              <p style="margin:0 0 16px;">
                <a href="{{preferencesUrl}}" style="color:rgba(13,13,13,0.5);font-size:12px;text-decoration:underline;">Update preferences</a>
                &nbsp;·&nbsp;
                <a href="{{unsubscribeUrl}}" style="color:rgba(13,13,13,0.5);font-size:12px;text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0;color:rgba(13,13,13,0.4);font-size:11px;">&copy; {{currentYear}} {{newsletterName}}</p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

Handlebars.registerHelper("nl2br", function (text: string) {
  if (!text) return ""
  const escaped = Handlebars.Utils.escapeExpression(text)
  return new Handlebars.SafeString(escaped.replace(/\n/g, "<br>"))
})
Handlebars.registerHelper("math", function (a: number, op: string, b: number) {
  const [l, r] = [Number(a), Number(b)]
  if (op === "+") return l + r
  if (op === "-") return l - r
  return l
})

const compiledTemplate = Handlebars.compile(TEMPLATE)

export function renderWeeklyNewsletter(data: WeeklyNewsletterData): string {
  const name = nlName()
  return compiledTemplate({
    ...data,
    currentYear: new Date().getFullYear(),
    newsletterName: name,
    accentColor: nlColor(),
    editorialLabel: "From the Editor",
    weeklyTitle: `${name} — Week of ${data.weekOf}`,
  })
}

const sortDesc = <T extends { createdAt?: string | null }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bt - at
  })

const withinDays = (iso: string | undefined, days: number): boolean => {
  if (!iso) return false
  const d = new Date(iso)
  return !isNaN(d.getTime()) && d >= new Date(Date.now() - days * 86_400_000)
}

export function buildNewsletterContext(
  newsletter: {
    weekStart: Date
    chefsTableTitle?: string | null
    chefsTableBody?: string | null
    newsItems?: unknown[] | null
  },
  savedReading: Array<{ title: string; url?: string | null; description?: string | null; source?: string | null; createdAt?: string | null }>,
  savedCooking: Array<{ title: string; url?: string | null; description?: string | null; createdAt?: string | null }>,
  baseUrl?: string
): WeeklyNewsletterData {
  const base = (baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")
  const weekOf = newsletter.weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const recentReading = sortDesc(savedReading).filter((r) => withinDays(r.createdAt ?? undefined, 7))

  return {
    weekOf,
    chefsTable: {
      title: newsletter.chefsTableTitle ?? undefined,
      body: newsletter.chefsTableBody || `Here's this week's briefing from ${nlName()}.`,
    },
    news: ((newsletter.newsItems ?? []) as any[]).slice(0, 3).map((item: any) => ({
      title: item.title || "",
      url: item.url || "",
      summary: item.summary || item.Description || "",
      source: item.source || undefined,
    })),
    reading: recentReading.slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url ?? undefined,
      description: r.description ?? "",
      source: r.source ?? undefined,
    })),
    cooking: sortDesc(savedCooking).slice(0, 1).map((c) => ({
      title: c.title,
      description: c.description ?? "",
      url: c.url ?? undefined,
    })),
    unsubscribeUrl: `${base}/unsubscribe`,
    preferencesUrl: `${base}/preferences`,
    bannerUrl: process.env.NEWSLETTER_BANNER_URL || "",
  }
}
