"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewNewsletterPage() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => {
    // Default to next Monday
    const d = new Date()
    const day = d.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + daysUntilMonday)
    return d.toISOString().slice(0, 10)
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to create"); setCreating(false); return }
      router.push(`/manage/newsletters/${data.id}`)
    } catch {
      setError("Network error"); setCreating(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <a href="/manage/newsletters" className="text-xs text-[#0d0d0d]/40 hover:text-[#0d0d0d] transition-colors">← Back to newsletters</a>
        <h1 className="text-3xl font-semibold mt-3 mb-1">New issue</h1>
        <p className="text-[#0d0d0d]/50 text-sm">Start a new weekly newsletter draft.</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <label className="block mb-5">
          <span className="text-xs font-semibold text-[#0d0d0d]/50 uppercase tracking-wide mb-1.5 block">Week of (Monday)</span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full bg-[#f5f5f5] border border-black/[0.06] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
          />
        </label>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-[#0d0d0d] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? "Creating…" : "Create draft"}
        </button>
      </div>
    </div>
  )
}
