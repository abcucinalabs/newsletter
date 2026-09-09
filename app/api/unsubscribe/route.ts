import { NextRequest, NextResponse } from "next/server"
import { getResend, setContactTopicPreferences } from "@/lib/resend"
import { verifyUnsubscribeToken } from "@/lib/footer"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email, token, exp, daily, weekly } = await req.json()

    if (!email || !token) {
      return NextResponse.json({ error: "Missing email or token" }, { status: 400 })
    }

    if (!verifyUnsubscribeToken(email, token, exp)) {
      return NextResponse.json({ error: "Invalid or expired unsubscribe token" }, { status: 403 })
    }

    const resend = getResend()
    await setContactTopicPreferences(resend, email, {
      daily: daily ?? false,
      weekly: weekly ?? false,
    })

    // Update Supabase if fully unsubscribed
    if (!daily && !weekly) {
      await getSupabase()
        .from("subscribers")
        .update({ status: "unsubscribed" })
        .eq("email", email.trim().toLowerCase())
    }

    const kept = [daily && "Daily Insights", weekly && "Weekly News"].filter(Boolean)
    const message = kept.length
      ? `Preferences updated. You'll still receive: ${kept.join(", ")}.`
      : "You've been fully unsubscribed."

    return NextResponse.json({ message })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
