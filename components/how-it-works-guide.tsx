"use client"

import { useState, type ReactNode } from "react"

type Actor = "you" | "agent" | "both"

type ChatTurn =
  | { role: "user"; text: string }
  | { role: "agent"; text: string }
  | { role: "tool"; tool: string; args?: string }

interface Stage {
  id: string
  label: string
  short: string
  headline: string
  actor: Actor
  path: string
  ui: (color: string) => ReactNode
  chat: ChatTurn[]
}

// ── Shared mock chrome ──────────────────────────────────────────────────────

function AppFrame({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-black/[0.06] bg-[#fafafa]">
        <span className="w-2 h-2 rounded-full bg-black/10" />
        <span className="w-2 h-2 rounded-full bg-black/10" />
        <span className="w-2 h-2 rounded-full bg-black/10" />
        <span className="ml-2 text-[10px] text-[#0d0d0d]/35 font-mono truncate">{path}</span>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  )
}

function ChatPanel({ turns, color }: { turns: ChatTurn[]; color: string }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-[#fafafa] h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-black/[0.06] bg-white">
        <span
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] text-[#0d0d0d]/35 font-mono">chat with your agent</span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        {turns.map((t, i) => {
          if (t.role === "tool") {
            return (
              <div key={i} className="flex justify-start">
                <code
                  className="font-mono text-[10.5px] rounded-lg px-2.5 py-1.5 border"
                  style={{ backgroundColor: `${color}0d`, borderColor: `${color}25`, color }}
                >
                  → {t.tool}
                  {t.args ? <span className="opacity-60">({t.args})</span> : null}
                </code>
              </div>
            )
          }
          const isUser = t.role === "user"
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] text-[12.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl"
                style={
                  isUser
                    ? { backgroundColor: "#0d0d0d", color: "#fff", borderBottomRightRadius: 4 }
                    : {
                        backgroundColor: "#fff",
                        color: "#0d0d0d",
                        border: "1px solid rgba(0,0,0,0.07)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {t.text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tiny UI atoms reused across mocks ────────────────────────────────────────

function MockLabel({ children }: { children: ReactNode }) {
  return <p className="text-[9px] font-semibold tracking-wide uppercase text-[#0d0d0d]/30 mb-1">{children}</p>
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <MockLabel>{label}</MockLabel>
      <div className="text-[11.5px] bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-[#0d0d0d]/80 truncate">
        {value}
      </div>
    </div>
  )
}

function MockButton({ children, color, primary = true }: { children: ReactNode; color: string; primary?: boolean }) {
  return (
    <span
      className="inline-block text-[11px] font-medium rounded-lg px-3 py-1.5"
      style={
        primary
          ? { backgroundColor: color, color: "#fff" }
          : { border: "1px solid rgba(0,0,0,0.1)", color: "#0d0d0d" }
      }
    >
      {children}
    </span>
  )
}

// ── Stages ────────────────────────────────────────────────────────────────

const STAGES: Stage[] = [
  {
    id: "collect",
    label: "Collect",
    short: "Content accrues all week",
    headline: "Content lands before anyone writes an issue",
    actor: "both",
    path: "Manage → Newsletters → this issue → News",
    ui: (color) => (
      <AppFrame path="Manage → Newsletters → this issue → News">
        <div className="flex items-center justify-between mb-3">
          <span
            className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            1
          </span>
          <span className="text-[10px] text-red-400/70">Remove</span>
        </div>
        <MockField label="Title" value="Anthropic ships a new model" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <MockField label="Source" value="The Verge" />
          <MockField label="URL" value="https://…" />
        </div>
        <MockField label="Summary" value="What it means for people building products" />
        <div className="mt-3 border border-dashed border-black/10 rounded-lg py-2 text-center text-[10px] text-[#0d0d0d]/35">
          + Add news item
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "Add the three biggest AI stories from this week to the current issue, with a one-line summary each." },
      { role: "tool", tool: "add_news_item", args: "Anthropic ships…" },
      { role: "tool", tool: "add_news_item", args: "OpenAI announces…" },
      { role: "tool", tool: "add_news_item", args: "Google releases…" },
      { role: "agent", text: "Added 3 items to the issue dated Mar 9." },
    ],
  },
  {
    id: "draft",
    label: "Draft",
    short: "One issue per week",
    headline: "A draft exists for every week, created on demand",
    actor: "both",
    path: "Manage → Newsletters → New issue",
    ui: (color) => (
      <AppFrame path="Manage → Newsletters → New issue">
        <MockLabel>Week of (Monday)</MockLabel>
        <div className="text-[11.5px] bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-[#0d0d0d]/80 mb-4">
          March 9, 2026
        </div>
        <MockButton color={color}>Create draft</MockButton>
        <div className="mt-5 pt-4 border-t border-black/[0.06]">
          <MockLabel>Existing issues</MockLabel>
          <div className="flex items-center justify-between text-[11px] text-[#0d0d0d]/45 py-1">
            <span>Week of March 2, 2026</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/[0.05] text-[9px]">sent</span>
          </div>
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "Start next Monday's issue." },
      { role: "tool", tool: "create_newsletter", args: "weekStart: 2026-03-09" },
      { role: "agent", text: "Created the draft for the week of March 9. It's empty and ready for content." },
    ],
  },
  {
    id: "write",
    label: "Write",
    short: "By hand or by model",
    headline: "The intro writes itself from the week's material",
    actor: "both",
    path: "Manage → Newsletters → this issue → Editorial",
    ui: (color) => (
      <AppFrame path="Manage → Newsletters → this issue → Editorial">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold">Editorial intro</span>
          <MockButton color={color}>✨ Generate with AI</MockButton>
        </div>
        <MockField label="Title" value="Three ways teams shipped faster this week" />
        <MockLabel>Body</MockLabel>
        <div className="text-[11px] bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-2.5 py-2 text-[#0d0d0d]/70 leading-relaxed">
          This week's releases share a theme: less setup, more judgment calls handed to the model itself…
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "Write the intro for this week and connect the stories to a single theme." },
      { role: "tool", tool: "generate_intro" },
      {
        role: "agent",
        text: "Drafted it — titled \"Three ways teams shipped faster this week.\" It ties this week's three items to a single thread: less setup, more judgment handed to the model. Want any edits?",
      },
    ],
  },
  {
    id: "preview",
    label: "Preview",
    short: "Exactly what ships",
    headline: "Preview renders the real email, not an approximation",
    actor: "both",
    path: "Manage → Newsletters → this issue → Preview",
    ui: (color) => (
      <AppFrame path="Manage → Newsletters → this issue → Preview">
        <div className="rounded-lg overflow-hidden border border-black/[0.06]">
          <div className="px-3 py-3" style={{ backgroundColor: "#0d0d0d" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color }}>Newsletter</p>
            <p className="text-white text-[12px] font-semibold mt-1">Week of March 9, 2026</p>
          </div>
          <div className="p-3">
            <div
              className="rounded-md px-2.5 py-2 mb-2 border-l-2"
              style={{ backgroundColor: `${color}0a`, borderColor: color }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color }}>From the Editor</p>
              <p className="text-[10.5px] text-[#0d0d0d]/60 leading-snug">
                Three ways teams shipped faster this week…
              </p>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color }}>News</p>
            <p className="text-[10.5px] text-[#0d0d0d]/60">1. Anthropic ships a new model</p>
          </div>
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "Show me what this week's issue looks like." },
      { role: "tool", tool: "preview_newsletter" },
      { role: "agent", text: "Here's the rendered issue — this is exactly what a subscriber will open." },
    ],
  },
  {
    id: "send",
    label: "Send",
    short: "Test, then broadcast",
    headline: "A proof to yourself, then the list",
    actor: "both",
    path: "Manage → Newsletters → this issue → Send",
    ui: (color) => (
      <AppFrame path="Manage → Newsletters → this issue → Send">
        <MockLabel>Send test email</MockLabel>
        <div className="flex gap-1.5 mb-4">
          <div className="flex-1 text-[11px] bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-2 py-1.5 text-[#0d0d0d]/60">
            you@example.com
          </div>
          <MockButton color={color}>Send test</MockButton>
        </div>
        <div className="pt-3 border-t border-black/[0.06]">
          <MockLabel>Broadcast to subscribers</MockLabel>
          <p className="text-[10px] text-[#0d0d0d]/40 mb-2">This cannot be undone.</p>
          <MockButton color={color}>🚀 Send to all subscribers</MockButton>
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "Send me a test first. If I say it looks good, broadcast it to everyone." },
      { role: "tool", tool: "send_newsletter", args: "testEmail" },
      { role: "agent", text: "Test sent to you@example.com. Let me know when to broadcast." },
      { role: "user", text: "Looks good, send it." },
      { role: "tool", tool: "send_newsletter" },
      { role: "agent", text: "Broadcast sent to 1,204 subscribers." },
    ],
  },
  {
    id: "measure",
    label: "Measure",
    short: "Opens, clicks, bounces",
    headline: "Delivery events flow back in",
    actor: "both",
    path: "Resend webhook → email_events",
    ui: (color) => (
      <AppFrame path="Manage → Dashboard">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Opens", "612"],
            ["Clicks", "148"],
            ["Bounces", "3"],
          ].map(([label, val]) => (
            <div key={label} className="rounded-lg border border-black/[0.06] px-2 py-2.5 text-center">
              <p className="text-[15px] font-semibold">{val}</p>
              <p className="text-[9px] text-[#0d0d0d]/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-black/[0.06] space-y-1">
          <p className="text-[10px] text-[#0d0d0d]/40 flex justify-between">
            <span>open · a.k@example.com</span>
            <span style={{ color }}>2m ago</span>
          </p>
          <p className="text-[10px] text-[#0d0d0d]/40 flex justify-between">
            <span>click · j.d@example.com</span>
            <span style={{ color }}>5m ago</span>
          </p>
        </div>
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "How did last week's issue perform compared to the one before?" },
      { role: "tool", tool: "get_email_stats", args: "broadcastId: prev" },
      { role: "tool", tool: "get_email_stats", args: "broadcastId: last" },
      { role: "agent", text: "612 opens and 148 clicks last week, up from 540 opens and 121 clicks the week before — opens grew 13%." },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    short: "Subscribers and topics",
    headline: "Two topics, one contact record",
    actor: "both",
    path: "Manage → Subscribers",
    ui: (color) => (
      <AppFrame path="Manage → Subscribers">
        <div className="flex text-[9px] font-semibold uppercase tracking-wide text-[#0d0d0d]/30 pb-1.5 border-b border-black/[0.06] mb-1.5">
          <span className="flex-1">Email</span>
          <span className="w-16">Status</span>
        </div>
        {[
          ["a.k@example.com", "active"],
          ["j.d@example.com", "active"],
          ["m.r@example.com", "unsubscribed"],
        ].map(([email, status]) => (
          <div key={email} className="flex items-center py-1 text-[10.5px]">
            <span className="flex-1 font-mono text-[#0d0d0d]/70 truncate">{email}</span>
            <span
              className="w-16 text-[9px] px-1.5 py-0.5 rounded-full text-center"
              style={
                status === "active"
                  ? { backgroundColor: `${color}14`, color }
                  : { backgroundColor: "rgba(0,0,0,0.05)", color: "rgba(13,13,13,0.4)" }
              }
            >
              {status}
            </span>
          </div>
        ))}
      </AppFrame>
    ),
    chat: [
      { role: "user", text: "How many active subscribers do we have, and how many joined this month?" },
      { role: "tool", tool: "list_subscribers", args: "status: active" },
      { role: "agent", text: "1,204 active subscribers. 86 of them joined this month." },
    ],
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

        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-7 mt-3">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <h3 className="text-xl font-semibold leading-snug flex-1 min-w-[260px]">{stage.headline}</h3>
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${color}14`, color }}
            >
              {ACTOR_LABEL[stage.actor]}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#0d0d0d]/30 mb-2">
                In the UI
              </p>
              {stage.ui(color)}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#0d0d0d]/30 mb-2">
                In a chat with your agent
              </p>
              <ChatPanel turns={stage.chat} color={color} />
            </div>
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
