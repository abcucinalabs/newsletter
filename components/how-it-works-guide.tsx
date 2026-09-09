"use client"

import { useState } from "react"

type Actor = "you" | "agent" | "both"

interface Stage {
  id: string
  label: string
  short: string
  headline: string
  body: string
  actor: Actor
  tools: string[]
  prompt?: string
  where?: string
  code?: { lang: string; lines: string[] }
}

const STAGES: Stage[] = [
  {
    id: "collect",
    label: "Collect",
    short: "Content accrues all week",
    headline: "Content lands before anyone writes an issue",
    body:
      "Nothing here starts with a blank editor. News items attach to the week's draft, while longer reads and project notes go into a saved_content table that the next issue picks up on its own — anything added in the last 7 days is pulled in automatically.",
    actor: "both",
    tools: ["add_news_item"],
    prompt: "Add the three biggest AI stories from this week to the current issue, with a one-line summary each.",
    where: "Manage → Newsletters → an issue → News tab",
  },
  {
    id: "draft",
    label: "Draft",
    short: "One issue per week",
    headline: "A draft exists for every week, created on demand",
    body:
      "Issues are keyed by the Monday of their week, and creation is idempotent — asking twice returns the same draft instead of making a duplicate. An agent can just ask for 'the current issue' and get one whether or not it existed a second ago.",
    actor: "both",
    tools: ["create_newsletter", "get_current_newsletter", "list_newsletters"],
    prompt: "Start next Monday's issue.",
    where: "Manage → Newsletters → New issue",
  },
  {
    id: "write",
    label: "Write",
    short: "By hand or by model",
    headline: "The intro writes itself from the week's material",
    body:
      "Gemini reads everything already collected — news items, saved reading, project notes — and returns a title and body that ties them together, rather than inventing from nothing. You can accept it, edit it, or ignore it and write your own.",
    actor: "both",
    tools: ["generate_intro", "update_newsletter"],
    prompt: "Write the intro for this week and connect the stories to a single theme.",
    where: "Manage → Newsletters → an issue → Editorial tab",
  },
  {
    id: "preview",
    label: "Preview",
    short: "Exactly what ships",
    headline: "Preview renders the real email, not an approximation",
    body:
      "The preview, the test send, the broadcast, and the public archive page all run through one renderer. What you see in preview is byte-for-byte what lands in an inbox.",
    actor: "both",
    tools: ["preview_newsletter"],
    prompt: "Show me what this week's issue looks like.",
    where: "Manage → Newsletters → an issue → Preview",
  },
  {
    id: "send",
    label: "Send",
    short: "Test, then broadcast",
    headline: "A proof to yourself, then the list",
    body:
      "Passing a test address sends a single copy so you can check it in a real client. Omitting it broadcasts through Resend to everyone subscribed to the weekly topic, marks the issue sent, and records the broadcast id for stats later.",
    actor: "both",
    tools: ["send_newsletter"],
    prompt: "Send me a test first. If I say it looks good, broadcast it to everyone.",
    where: "Manage → Newsletters → an issue → Send tab",
  },
  {
    id: "measure",
    label: "Measure",
    short: "Opens, clicks, bounces",
    headline: "Delivery events flow back in",
    body:
      "Point a Resend webhook at the app and every open, click, bounce, and complaint is logged to email_events. Agents can query it directly, so 'how did last week do?' is a question your assistant can actually answer.",
    actor: "both",
    tools: ["get_email_stats"],
    prompt: "How did last week's issue perform compared to the one before?",
    where: "Resend webhook → /api/resend/webhook",
  },
  {
    id: "audience",
    label: "Audience",
    short: "Subscribers and topics",
    headline: "Two topics, one contact record",
    body:
      "A subscriber is created in Resend, opted into the topics they chose, and mirrored into Supabase so you can query the list without an API call. Preferences are per-topic, so someone can drop the daily and keep the weekly.",
    actor: "both",
    tools: ["subscribe_user", "unsubscribe_user", "list_subscribers", "get_subscriber"],
    prompt: "How many active subscribers do we have, and how many joined this month?",
    where: "Manage → Subscribers",
  },
]

const CONTENT_ROUTES = [
  {
    id: "editor",
    label: "In the editor",
    blurb: "Type it in. Best for the handful of items you're curating yourself.",
    code: {
      lang: "",
      lines: [
        "Manage → Newsletters → this week's issue → News tab",
        "",
        "  + Add news item",
        "      Title    Anthropic ships a new model",
        "      Source   The Verge",
        "      URL      https://…",
        "      Summary  What it means for people building products",
        "",
        "  Save news",
      ],
    },
  },
  {
    id: "agent",
    label: "Through an agent",
    blurb: "Paste links into a chat and let the agent structure and file them.",
    code: {
      lang: "",
      lines: [
        "You:",
        "  Add these to this week's issue and write the summaries:",
        "  https://example.com/post-one",
        "  https://example.com/post-two",
        "",
        "Agent:",
        "  → add_news_item { newsletterId, title, url, summary, source }",
        "  → add_news_item { newsletterId, title, url, summary, source }",
        "  Added 2 items to the issue dated Mar 3.",
      ],
    },
  },
  {
    id: "database",
    label: "From any tool",
    blurb:
      "Write a row and it shows up. A scraper, a bookmarklet, Zapier, a cron job, a second agent — anything that can reach Postgres can feed the newsletter.",
    code: {
      lang: "sql",
      lines: [
        "insert into saved_content (type, title, url, description, source)",
        "values (",
        "  'reading',",
        "  'The piece worth your afternoon',",
        "  'https://example.com/essay',",
        "  'Why it changed how we think about evals',",
        "  'Ars Technica'",
        ");",
        "",
        "-- Anything inserted in the last 7 days appears in the",
        "-- next issue's \"What We're Reading\" automatically.",
      ],
    },
  },
]

const TOOL_GROUPS = [
  {
    group: "Subscribers",
    tools: [
      ["subscribe_user", "Create a contact, set topic preferences, optionally send a welcome email"],
      ["unsubscribe_user", "Opt out of one topic or all of them"],
      ["list_subscribers", "List with status filter and pagination"],
      ["get_subscriber", "Look one up by email"],
    ],
  },
  {
    group: "Issues",
    tools: [
      ["create_newsletter", "Create a draft for a given week — idempotent"],
      ["get_current_newsletter", "Get or create this week's draft"],
      ["get_newsletter", "Fetch one by id"],
      ["list_newsletters", "List, optionally filtered by draft or sent"],
      ["update_newsletter", "Update intro, news items, status, audience"],
      ["add_news_item", "Append a single news item"],
      ["delete_newsletter", "Remove a draft"],
    ],
  },
  {
    group: "Publishing",
    tools: [
      ["generate_intro", "Write the editorial intro from the week's collected material"],
      ["preview_newsletter", "Render the issue to HTML"],
      ["send_newsletter", "Send a test, or broadcast to the list"],
      ["get_email_stats", "Opens, clicks, bounces from the webhook log"],
    ],
  },
]

const ACTOR_LABEL: Record<Actor, string> = {
  you: "You",
  agent: "Agent",
  both: "You or an agent",
}

export default function HowItWorksGuide({ color }: { color: string }) {
  const [active, setActive] = useState(0)
  const [route, setRoute] = useState(0)
  const [openGroup, setOpenGroup] = useState<string | null>("Issues")

  const stage = STAGES[active]
  const current = CONTENT_ROUTES[route]

  return (
    <div>
      {/* ── Pipeline ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#0d0d0d]/30 mb-4">
          The weekly loop
        </h2>

        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {STAGES.map((s, i) => {
            const on = i === active
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className="flex-shrink-0 text-left rounded-xl border px-3.5 py-2.5 transition-all"
                style={{
                  borderColor: on ? color : "rgba(0,0,0,0.07)",
                  backgroundColor: on ? `${color}0d` : "#fff",
                  boxShadow: on ? `inset 0 0 0 1px ${color}` : "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: on ? color : "rgba(0,0,0,0.06)",
                      color: on ? "#fff" : "rgba(13,13,13,0.4)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-sm font-medium whitespace-nowrap"
                    style={{ color: on ? color : "rgba(13,13,13,0.6)" }}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="text-[11px] text-[#0d0d0d]/35 mt-1 whitespace-nowrap">{s.short}</p>
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-7 mt-3">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <h3 className="text-xl font-semibold leading-snug flex-1 min-w-[260px]">{stage.headline}</h3>
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${color}14`, color }}
            >
              {ACTOR_LABEL[stage.actor]}
            </span>
          </div>

          <p className="text-[#0d0d0d]/60 leading-relaxed mb-6">{stage.body}</p>

          {stage.prompt && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#0d0d0d]/30 mb-2">
                Say this to your agent
              </p>
              <div
                className="rounded-xl px-4 py-3 text-sm leading-relaxed border"
                style={{ backgroundColor: `${color}08`, borderColor: `${color}20` }}
              >
                &ldquo;{stage.prompt}&rdquo;
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-x-8 gap-y-4 pt-5 border-t border-black/[0.06]">
            <div className="min-w-[200px]">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#0d0d0d]/30 mb-2">
                MCP tools
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stage.tools.map((t) => (
                  <code
                    key={t}
                    className="font-mono text-[11px] rounded-lg px-2 py-1 border border-black/[0.07] bg-black/[0.02] text-[#0d0d0d]/60"
                  >
                    {t}
                  </code>
                ))}
              </div>
            </div>
            {stage.where && (
              <div className="min-w-[200px]">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#0d0d0d]/30 mb-2">
                  Or do it yourself
                </p>
                <p className="text-xs text-[#0d0d0d]/50">{stage.where}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Bring your own content ───────────────────────────── */}
      <section className="mb-16">
        <div className="mb-5">
          <span
            className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ backgroundColor: `${color}14`, color }}
          >
            What makes this different
          </span>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Your content, from wherever it lives</h2>
          <p className="text-[#0d0d0d]/55 leading-relaxed max-w-2xl">
            Most newsletter tools make their editor the only door in. Here the content store is an ordinary
            table, so anything that can write a row can fill an issue — and all three routes below feed the
            same newsletter.
          </p>
        </div>

        <div className="flex gap-1 mb-3 bg-black/[0.04] p-1 rounded-xl w-fit">
          {CONTENT_ROUTES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setRoute(i)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: i === route ? "#fff" : "transparent",
                color: i === route ? "#0d0d0d" : "rgba(13,13,13,0.5)",
                boxShadow: i === route ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <p className="text-sm text-[#0d0d0d]/55 leading-relaxed mb-4">{current.blurb}</p>
          <div className="bg-[#0d0d0d] rounded-xl p-5 overflow-x-auto">
            <pre className="font-mono text-xs leading-[1.9] text-white/70 whitespace-pre">
{current.code.lines.join("\n")}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Handled for you ──────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Handled without asking</h2>
        <p className="text-[#0d0d0d]/55 leading-relaxed mb-5 max-w-2xl">
          The parts that are easy to get wrong, and legally awkward when you do.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              t: "Signed unsubscribe links",
              d: "Every footer link carries an HMAC-signed token scoped to that address and expiring in 90 days, so links can't be forged or replayed against other subscribers.",
            },
            {
              t: "CAN-SPAM footer",
              d: "Sender identity, preference link, and unsubscribe link are injected into every send. There is no path that skips it.",
            },
            {
              t: "Per-topic preferences",
              d: "Unsubscribing from the weekly doesn't silently kill the daily. Choices map to Resend topics and are honored at send time.",
            },
            {
              t: "Service-role isolation",
              d: "All database access runs server-side with the service-role key. RLS is on with no public policies, so browsers reach nothing directly.",
            },
          ].map((c) => (
            <div key={c.t} className="bg-white rounded-2xl border border-black/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-1.5">{c.t}</h3>
              <p className="text-sm text-[#0d0d0d]/55 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tool reference ───────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Everything an agent can do</h2>
        <p className="text-[#0d0d0d]/55 leading-relaxed mb-5 max-w-2xl">
          Fifteen tools over MCP. Any client that speaks the protocol gets all of them.
        </p>

        <div className="space-y-2">
          {TOOL_GROUPS.map((g) => {
            const open = openGroup === g.group
            return (
              <div key={g.group} className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
                <button
                  onClick={() => setOpenGroup(open ? null : g.group)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.015] transition-colors"
                >
                  <span className="font-semibold text-sm">{g.group}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-[#0d0d0d]/35">{g.tools.length} tools</span>
                    <span
                      className="text-[#0d0d0d]/25 transition-transform"
                      style={{ transform: open ? "rotate(90deg)" : "none" }}
                    >
                      ›
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="border-t border-black/[0.06] divide-y divide-black/[0.04]">
                    {g.tools.map(([name, desc]) => (
                      <div key={name} className="px-5 py-3 flex gap-4 items-baseline flex-wrap">
                        <code
                          className="font-mono text-[11px] rounded-lg px-2 py-1 flex-shrink-0"
                          style={{ backgroundColor: `${color}0f`, color }}
                        >
                          {name}
                        </code>
                        <span className="text-sm text-[#0d0d0d]/55 flex-1 min-w-[220px]">{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
