"use client"

import { useState } from "react"

export default function SubscribeForm({ color = "#4f46e5" }: { color?: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("done")
        setMessage(data.message || "You're subscribed!")
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error — please try again.")
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 py-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}22` }}
        >
          <span className="text-sm font-semibold" style={{ color }}>✓</span>
        </div>
        <p className="text-sm font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-[#f5f5f5] border border-black/[0.06] rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{ outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}18` }}
          onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = "" }}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
    </div>
  )
}
