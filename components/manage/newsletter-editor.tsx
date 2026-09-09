"use client"

import { useState, useCallback } from "react"

interface NewsItem {
  title: string
  url: string
  summary: string
  source?: string
}

interface Newsletter {
  id: string
  week_start: string
  status: string
  chefs_table_title?: string | null
  chefs_table_body?: string | null
  news_items?: NewsItem[] | null
  sent_at?: string | null
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function NewsletterEditor({ newsletter: initial }: { newsletter: Newsletter }) {
  const [nl, setNl] = useState<Newsletter>(initial)
  const [tab, setTab] = useState<"content" | "news" | "send">("content")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sendEmail, setSendEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState("")
  const [sendErr, setSendErr] = useState("")
  const [saveMsg, setSaveMsg] = useState("")

  const isSent = nl.status === "sent"

  const save = useCallback(async (updates: Partial<Newsletter>) => {
    setSaving(true)
    setSaveMsg("")
    try {
      const res = await fetch(`/api/newsletters/${nl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) { setNl((prev) => ({ ...prev, ...data })); setSaveMsg("Saved") }
      else setSaveMsg("Error: " + (data.error || "Failed"))
    } catch { setSaveMsg("Network error") }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000) }
  }, [nl.id])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/newsletters/${nl.id}/generate`, { method: "POST" })
      const data = await res.json()
      if (res.ok) setNl((prev) => ({ ...prev, chefs_table_title: data.chefs_table_title, chefs_table_body: data.chefs_table_body }))
    } finally { setGenerating(false) }
  }

  const addNewsItem = () => {
    const items = [...(nl.news_items ?? []), { title: "", url: "", summary: "", source: "" }]
    setNl((prev) => ({ ...prev, news_items: items }))
  }

  const updateNewsItem = (i: number, field: keyof NewsItem, val: string) => {
    const items = (nl.news_items ?? []).map((item, idx) => idx === i ? { ...item, [field]: val } : item)
    setNl((prev) => ({ ...prev, news_items: items }))
  }

  const removeNewsItem = (i: number) => {
    setNl((prev) => ({ ...prev, news_items: (prev.news_items ?? []).filter((_, idx) => idx !== i) }))
  }

  const sendTest = async () => {
    if (!sendEmail.trim()) return
    setSending(true); setSendMsg(""); setSendErr("")
    try {
      const res = await fetch(`/api/newsletters/${nl.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_email: sendEmail }),
      })
      const data = await res.json()
      if (res.ok) setSendMsg(`Test email sent to ${sendEmail}`)
      else setSendErr(data.error || "Failed to send test")
    } catch { setSendErr("Network error") }
    finally { setSending(false) }
  }

  const sendLive = async () => {
    if (!confirm("This will send to all weekly subscribers. Continue?")) return
    setSending(true); setSendMsg(""); setSendErr("")
    try {
      const res = await fetch(`/api/newsletters/${nl.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) { setSendMsg("Broadcast sent!"); setNl((prev) => ({ ...prev, status: "sent", sent_at: new Date().toISOString() })) }
      else setSendErr(data.error || "Failed to send")
    } catch { setSendErr("Network error") }
    finally { setSending(false) }
  }

  const weekLabel = new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <a href="/manage/newsletters" className="text-xs text-[#0d0d0d]/40 hover:text-[#0d0d0d] transition-colors">← Newsletters</a>
          <h1 className="text-2xl font-semibold mt-2">
            {nl.chefs_table_title || `Week of ${weekLabel}`}
          </h1>
          <p className="text-sm text-[#0d0d0d]/40 mt-0.5">Week of {weekLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", isSent ? "bg-[#10b981]/12 text-[#047857]" : "bg-[#0d0d0d]/5 text-[#0d0d0d]/40")}>
            {nl.status}
          </span>
          {nl.sent_at && (
            <span className="text-xs text-[#0d0d0d]/30">
              Sent {new Date(nl.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          <a
            href={`/api/newsletters/${nl.id}/preview`}
            target="_blank"
            className="text-xs text-[#4f46e5] hover:underline"
          >
            Preview ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#0d0d0d]/[0.04] p-1 rounded-xl w-fit">
        {(["content", "news", "send"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              tab === t ? "bg-white text-[#0d0d0d] shadow-sm" : "text-[#0d0d0d]/50 hover:text-[#0d0d0d]"
            )}
          >
            {t === "send" ? "Send" : t === "content" ? "Editorial" : "News"}
          </button>
        ))}
      </div>

      {/* Editorial Tab */}
      {tab === "content" && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Editorial intro</h2>
            <button
              onClick={generate}
              disabled={generating || isSent}
              className="text-xs bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? "Generating…" : "✨ Generate with AI"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1.5 block">Title</label>
              <input
                type="text"
                value={nl.chefs_table_title ?? ""}
                onChange={(e) => setNl((p) => ({ ...p, chefs_table_title: e.target.value }))}
                disabled={isSent}
                placeholder="A punchy weekly title…"
                className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1.5 block">Body</label>
              <textarea
                value={nl.chefs_table_body ?? ""}
                onChange={(e) => setNl((p) => ({ ...p, chefs_table_body: e.target.value }))}
                disabled={isSent}
                rows={8}
                placeholder="This week in AI product…"
                className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {!isSent && (
            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-black/[0.06]">
              <button
                onClick={() => save({ chefs_table_title: nl.chefs_table_title, chefs_table_body: nl.chefs_table_body })}
                disabled={saving}
                className="bg-[#0d0d0d] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saveMsg && <span className="text-xs text-[#0d0d0d]/40">{saveMsg}</span>}
            </div>
          )}
        </div>
      )}

      {/* News Tab */}
      {tab === "news" && (
        <div>
          <div className="space-y-3 mb-4">
            {(nl.news_items ?? []).map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-6 h-6 bg-[#0d0d0d] text-white rounded-md text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  {!isSent && (
                    <button onClick={() => removeNewsItem(i)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1 block">Title</label>
                    <input
                      value={item.title}
                      onChange={(e) => updateNewsItem(i, "title", e.target.value)}
                      disabled={isSent}
                      placeholder="Article title"
                      className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1 block">Source</label>
                    <input
                      value={item.source ?? ""}
                      onChange={(e) => updateNewsItem(i, "source", e.target.value)}
                      disabled={isSent}
                      placeholder="e.g. TechCrunch"
                      className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1 block">URL</label>
                  <input
                    value={item.url}
                    onChange={(e) => updateNewsItem(i, "url", e.target.value)}
                    disabled={isSent}
                    placeholder="https://…"
                    className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide mb-1 block">Summary</label>
                  <textarea
                    value={item.summary}
                    onChange={(e) => updateNewsItem(i, "summary", e.target.value)}
                    disabled={isSent}
                    rows={2}
                    placeholder="One-sentence summary…"
                    className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] transition-all resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>

          {!isSent && (
            <div className="flex items-center gap-3">
              <button
                onClick={addNewsItem}
                className="text-sm border-2 border-dashed border-black/[0.1] rounded-xl px-4 py-3 text-[#0d0d0d]/40 hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors w-full"
              >
                + Add news item
              </button>
            </div>
          )}

          {!isSent && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => save({ news_items: nl.news_items })}
                disabled={saving}
                className="bg-[#0d0d0d] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save news"}
              </button>
              {saveMsg && <span className="text-xs text-[#0d0d0d]/40">{saveMsg}</span>}
            </div>
          )}
        </div>
      )}

      {/* Send Tab */}
      {tab === "send" && (
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-semibold mb-3">Preview</h2>
            <a
              href={`/api/newsletters/${nl.id}/preview`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm text-[#4f46e5] hover:underline"
            >
              Open email preview ↗
            </a>
          </div>

          {/* Test send */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-semibold mb-1">Send test email</h2>
            <p className="text-xs text-[#0d0d0d]/40 mb-4">Send to yourself before broadcasting to subscribers.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-[#f5f5f5] border border-black/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
              />
              <button
                onClick={sendTest}
                disabled={sending || !sendEmail.trim()}
                className="bg-[#0d0d0d] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {sending ? "Sending…" : "Send test"}
              </button>
            </div>
          </div>

          {/* Live broadcast */}
          {!isSent ? (
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <h2 className="font-semibold mb-1">Broadcast to subscribers</h2>
              <p className="text-xs text-[#0d0d0d]/40 mb-4">This sends to all active weekly subscribers via Resend. This action cannot be undone.</p>
              <button
                onClick={sendLive}
                disabled={sending}
                className="bg-[#4f46e5] text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Broadcasting…" : "🚀 Send to all subscribers"}
              </button>
            </div>
          ) : (
            <div className="bg-[#10b981]/8 rounded-2xl border border-[#10b981]/25 p-6">
              <h2 className="font-semibold text-[#047857] mb-1">✓ Sent</h2>
              <p className="text-sm text-[#0d0d0d]/60">
                This issue was broadcast on{" "}
                {nl.sent_at
                  ? new Date(nl.sent_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "an earlier date"}.
              </p>
            </div>
          )}

          {sendMsg && <p className="text-sm text-[#047857] font-medium">{sendMsg}</p>}
          {sendErr && <p className="text-sm text-red-500">{sendErr}</p>}
        </div>
      )}
    </div>
  )
}
