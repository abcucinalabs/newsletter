import { NextRequest, NextResponse } from "next/server"
import { getResend, resendRetry, setContactTopicPreferences } from "@/lib/resend"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const resend = getResend()

    // Create contact in Resend (global, no audience)
    const createResult = await resendRetry(
      () => (resend.contacts as any).create({ email: normalizedEmail }),
      "contacts.create"
    )
    if (createResult?.error && !/already exists/i.test(createResult.error.message ?? "")) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    // Subscribe to both topics by default
    await setContactTopicPreferences(resend, normalizedEmail, { daily: true, weekly: true })

    // Upsert into Supabase subscribers table
    const supabase = getSupabase()
    await supabase.from("subscribers").upsert(
      { email: normalizedEmail, status: "active" },
      { onConflict: "email" }
    )

    return NextResponse.json({ message: "You're subscribed! Check your inbox for a welcome email." })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
