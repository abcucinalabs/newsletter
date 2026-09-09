import crypto from "crypto"
import { getResend, resendRetry, setContactTopicPreferences, getTopicIds } from "../../lib/resend.js"
import { getSupabase, type SubscriberRow } from "../../lib/supabase.js"
import { appendCanspaFooter } from "../../lib/footer.js"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function subscribeUser(input: {
  email: string; dailyInsights?: boolean; weeklyUpdates?: boolean; sendWelcomeEmail?: boolean
}) {
  const { email, dailyInsights = true, weeklyUpdates = true, sendWelcomeEmail = true } = input
  if (!dailyInsights && !weeklyUpdates) throw new Error("At least one topic must be selected")

  const resend = getResend()
  const supabase = getSupabase()

  const contactResult = await resendRetry(() => (resend.contacts as any).create({ email }), "contacts.create")
  const alreadyExists = /already|exists|duplicate/i.test(contactResult?.error?.message ?? "")
  if (contactResult?.error && !alreadyExists) throw new Error(`contacts.create: ${contactResult.error.message}`)

  await setContactTopicPreferences(resend, email, { daily: dailyInsights, weekly: weeklyUpdates })

  await supabase.from("subscribers").upsert(
    { email: email.trim().toLowerCase(), status: "active", daily_enabled: dailyInsights, weekly_enabled: weeklyUpdates, updated_at: new Date().toISOString() },
    { onConflict: "email" }
  )

  let welcomeEmailSent = false, welcomeEmailError: string | null = null
  if (sendWelcomeEmail) {
    const { data: templates } = await supabase.from("email_templates").select("*").eq("type", "welcome").eq("enabled", true).limit(1)
    const tpl = templates?.[0]
    if (tpl?.html) {
      const base = (process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")
      const newsletterName = process.env.NEWSLETTER_NAME || "Newsletter"
      const fromName = process.env.RESEND_FROM_NAME || newsletterName
      const fromEmail = process.env.RESEND_FROM_EMAIL
      if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured")
      const html = appendCanspaFooter(tpl.html, email, base)
      try {
        const r = await resend.emails.send({ from: `${fromName} <${fromEmail}>`, to: email, subject: tpl.subject || `Welcome to ${newsletterName}`, html, headers: { "List-Unsubscribe": `<${base}/unsubscribe?email=${encodeURIComponent(email)}>` } })
        if ((r as any)?.error) { welcomeEmailError = (r as any).error.message } else { welcomeEmailSent = true }
      } catch (e) { welcomeEmailError = e instanceof Error ? e.message : String(e) }
    }
  }
  return { success: true, email, alreadyExisted: alreadyExists, dailyInsights, weeklyUpdates, welcomeEmailSent, welcomeEmailError }
}

export async function unsubscribeUser(input: { email: string; daily?: boolean; weekly?: boolean; token?: string; exp?: string }) {
  const { email, daily = true, weekly = true, token, exp } = input
  if (!daily && !weekly) throw new Error("Select at least one topic to unsubscribe from")

  if (token) {
    const secret = process.env.UNSUBSCRIBE_SECRET || ""
    const norm = email.trim().toLowerCase()
    let expected: string
    if (exp) {
      if (Math.floor(Date.now() / 1000) > parseInt(exp, 10)) throw new Error("Link expired")
      expected = crypto.createHmac("sha256", secret).update(`${norm}:${exp}`).digest("hex")
    } else {
      expected = crypto.createHmac("sha256", secret).update(email).digest("hex")
    }
    if (token !== expected) throw new Error("Invalid token")
  }

  const resend = getResend()
  const supabase = getSupabase()
  const norm = email.trim().toLowerCase()
  const globalUnsub = daily && weekly

  await supabase.from("subscribers").upsert(
    { email: norm, status: globalUnsub ? "unsubscribed" : "active", daily_enabled: !daily, weekly_enabled: !weekly, updated_at: new Date().toISOString() },
    { onConflict: "email" }
  )

  await resendRetry(() => (resend.contacts as any).update({ email: norm, unsubscribed: globalUnsub }), "contacts.update")
  await sleep(600)
  const { dailyId, weeklyId } = await getTopicIds(resend)
  if (dailyId && weeklyId) {
    await sleep(600)
    await resendRetry(
      () => (resend.contacts as any).topics.update({ email: norm, topics: [{ id: dailyId, subscription: daily ? "opt_out" : "opt_in" }, { id: weeklyId, subscription: weekly ? "opt_out" : "opt_in" }] }),
      "contacts.topics.update"
    )
  }
  const stopped = [...(daily ? ["Daily Insights"] : []), ...(weekly ? ["Weekly Updates"] : [])]
  return { success: true, email: norm, unsubscribedFrom: stopped, globallyUnsubscribed: globalUnsub }
}

export async function listSubscribers(input: { status?: "active" | "unsubscribed" | "all"; limit?: number; offset?: number } = {}) {
  const { status = "all", limit = 50, offset = 0 } = input
  const supabase = getSupabase()
  let q = supabase.from("subscribers").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1)
  if (status !== "all") q = q.eq("status", status)
  const { data, error, count } = await q
  if (error) throw new Error(`Failed to list subscribers: ${error.message}`)
  return { subscribers: (data ?? []) as SubscriberRow[], total: count ?? 0, limit, offset }
}

export async function getSubscriber(email: string): Promise<SubscriberRow | null> {
  const { data, error } = await getSupabase().from("subscribers").select("*").eq("email", email.trim().toLowerCase()).maybeSingle()
  if (error) throw new Error(`Failed to get subscriber: ${error.message}`)
  return data as SubscriberRow | null
}
