"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function UnsubscribeContent() {
  const params = useSearchParams()
  const email = params.get("email") || ""
  const token = params.get("token") || ""
  const exp = params.get("exp") || ""
  const [daily, setDaily] = useState(true)
  const [weekly, setWeekly] = useState(true)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async () => {
    setStatus("loading")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, exp, daily, weekly }),
      })
      const data = await res.json()
      if (res.ok) { setStatus("done"); setMessage(data.message || "You've been unsubscribed.") }
      else { setStatus("error"); setMessage(data.error || "Something went wrong.") }
    } catch {
      setStatus("error"); setMessage("Network error — please try again.")
    }
  }

  if (!email) return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <p className="text-[#0d0d0d]/50">Invalid unsubscribe link.</p>
    </div>
  )

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      {status === "done" ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0d0d0d] text-xl">✓</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Done</h1>
          <p className="text-[#0d0d0d]/60">{message}</p>
          <a href="/" className="inline-block mt-6 text-sm text-[#4f46e5] hover:underline">← Back to newsletter</a>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold mb-2">Unsubscribe</h1>
          <p className="text-[#0d0d0d]/60 mb-8 text-sm">Manage your email preferences for <strong>{email}</strong></p>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 space-y-4 mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-sm">Daily Insights</p>
                <p className="text-xs text-[#0d0d0d]/40">Curated AI news, weekdays</p>
              </div>
              <div onClick={() => setDaily(!daily)} className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${daily ? "bg-[#4f46e5]" : "bg-[#0d0d0d]/10"} relative`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${daily ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </label>
            <div className="border-t border-black/[0.04]" />
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-sm">Weekly Updates</p>
                <p className="text-xs text-[#0d0d0d]/40">The weekly menu, every Monday</p>
              </div>
              <div onClick={() => setWeekly(!weekly)} className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${weekly ? "bg-[#4f46e5]" : "bg-[#0d0d0d]/10"} relative`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${weekly ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </label>
          </div>

          {status === "error" && <p className="text-red-500 text-sm mb-4">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={status === "loading" || (!daily && !weekly)}
            className="w-full bg-[#0d0d0d] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? "Saving…" : "Save preferences"}
          </button>
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return <Suspense><UnsubscribeContent /></Suspense>
}
