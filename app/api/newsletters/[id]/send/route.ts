import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { getResend, resendRetry, getOrCreateTopicId, TOPIC_NAMES } from "@/lib/resend"
import { renderWeeklyNewsletter, buildNewsletterContext } from "@/lib/renderer"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const { test_email } = await req.json().catch(() => ({}))

    const { data: nl, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !nl) return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })
    if (!nl.chefs_table_body && !nl.chefs_table_title) {
      return NextResponse.json({ error: "Newsletter needs an editorial intro before sending" }, { status: 400 })
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3001"
    const ctx = buildNewsletterContext(
      { weekStart: new Date(nl.week_start), chefsTableTitle: nl.chefs_table_title, chefsTableBody: nl.chefs_table_body, newsItems: nl.news_items },
      [], [], baseUrl
    )
    const html = renderWeeklyNewsletter(ctx)

    const newsletterName = process.env.NEWSLETTER_NAME || "Newsletter"
    const fromName = process.env.RESEND_FROM_NAME || newsletterName
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!fromEmail) {
      return NextResponse.json({ error: "RESEND_FROM_EMAIL is not configured" }, { status: 503 })
    }
    const weekLabel = new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const subject = nl.chefs_table_title ? `${nl.chefs_table_title} — Week of ${weekLabel}` : `${newsletterName} — Week of ${weekLabel}`

    const resend = getResend()

    // Test mode: send only to the provided email
    if (test_email) {
      const result = await resendRetry(
        () => resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: test_email,
          subject: `[TEST] ${subject}`,
          html,
        }),
        "emails.send (test)"
      )
      if (result?.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
      return NextResponse.json({ sent: true, test: true, emailId: result.data?.id })
    }

    // Live: broadcast to weekly topic subscribers
    const weeklyTopicId = await getOrCreateTopicId(resend, TOPIC_NAMES.weekly)

    const broadcasts = (resend as any).broadcasts
    const createResult = await resendRetry(
      () => broadcasts.create({
        name: subject,
        subject,
        from: `${fromName} <${fromEmail}>`,
        html,
        audience_id: weeklyTopicId, // topic-based broadcast
      }),
      "broadcasts.create"
    )
    if (createResult?.error) return NextResponse.json({ error: createResult.error.message }, { status: 500 })

    const broadcastId: string = createResult.data?.id
    const sendResult = await resendRetry(
      () => broadcasts.send({ broadcastId }),
      "broadcasts.send"
    )
    if (sendResult?.error) return NextResponse.json({ error: sendResult.error.message }, { status: 500 })

    // Mark as sent in Supabase
    await getSupabase()
      .from("weekly_newsletters")
      .update({ status: "sent", sent_at: new Date().toISOString(), broadcast_id: broadcastId })
      .eq("id", id)

    return NextResponse.json({ sent: true, broadcastId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
