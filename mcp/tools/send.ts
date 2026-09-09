import { GoogleGenerativeAI } from "@google/generative-ai"
import { getResend, resendRetry } from "../../lib/resend.js"
import { getSupabase } from "../../lib/supabase.js"
import { renderWeeklyNewsletter, buildNewsletterContext } from "../../lib/renderer.js"
import { getNewsletter, updateNewsletter } from "./newsletters.js"

export async function generateIntro(input: { newsletterId: string; customPrompt?: string }) {
  const { newsletterId, customPrompt } = input
  const supabase = getSupabase()
  const newsletter = await getNewsletter(newsletterId)
  if (!newsletter) throw new Error(`Newsletter not found: ${newsletterId}`)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is required")
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: savedReading }, { data: savedCooking }] = await Promise.all([
    supabase.from("saved_content").select("*").eq("type", "reading").gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(5),
    supabase.from("saved_content").select("*").eq("type", "cooking").order("created_at", { ascending: false }).limit(1),
  ])

  const weekOf = new Date(newsletter.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const newsCtx = ((newsletter.news_items ?? []) as any[]).map((i: any) => `- ${i.title}: ${i.summary ?? ""}`).join("\n") || "No news items yet"
  const readCtx = (savedReading ?? []).map((r: any) => `- ${r.title}: ${r.description ?? ""}`).join("\n") || "No reading items yet"
  const cookCtx = (savedCooking ?? []).map((c: any) => `- ${c.title}: ${c.description ?? ""}`).join("\n") || "No cooking experiments yet"

  const nlName = process.env.NEWSLETTER_NAME || "this newsletter"
  const nlAudience = process.env.NEWSLETTER_TAGLINE || ""
  const systemPrompt =
    newsletter.system_prompt ||
    `You are the editor of "${nlName}". ${nlAudience} Write clearly and specifically for that audience.`.trim()
  const userPrompt = customPrompt || `Write the editorial intro for the issue dated ${weekOf}. Return ONLY valid JSON: { "title": "optional short title", "body": "2-4 sentence intro" }.\n\nNEWS:\n${newsCtx}\n\nREADING:\n${readCtx}\n\nCOOKING:\n${cookCtx}\n\nKeep it warm, practical, plain-language.`

  const genAI = new GoogleGenerativeAI(apiKey)
  const result = await genAI.getGenerativeModel({ model }).generateContent(`${systemPrompt}\n\n${userPrompt}`)
  const text = result.response.text()

  let chefs = { title: null as string | null, body: text }
  try {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { const p = JSON.parse(m[0]); chefs = { title: p.title ?? null, body: p.body ?? p.intro ?? text } }
  } catch {}

  const updated = await updateNewsletter({ id: newsletterId, chefsTableTitle: chefs.title, chefsTableBody: chefs.body })
  return { success: true, newsletter: updated, generated: chefs }
}

export async function previewNewsletter(newsletterId: string, baseUrl?: string) {
  const supabase = getSupabase()
  const newsletter = await getNewsletter(newsletterId)
  if (!newsletter) throw new Error(`Newsletter not found: ${newsletterId}`)

  const [{ data: autoReading }, { data: autoCooking }, { data: selected }] = await Promise.all([
    supabase.from("saved_content").select("*").eq("type", "reading").order("created_at", { ascending: false }).limit(10),
    supabase.from("saved_content").select("*").eq("type", "cooking").order("created_at", { ascending: false }).limit(5),
    newsletter.recipe_ids?.length ? supabase.from("saved_content").select("*").in("id", newsletter.recipe_ids) : Promise.resolve({ data: [] }),
  ])

  const reading = (selected?.length ? selected : autoReading) ?? []
  const cooking = (Array.isArray(newsletter.cooking_items) && newsletter.cooking_items.length ? newsletter.cooking_items as any[] : autoCooking) ?? []
  const context = buildNewsletterContext({ weekStart: new Date(newsletter.week_start), chefsTableTitle: newsletter.chefs_table_title, chefsTableBody: newsletter.chefs_table_body, newsItems: newsletter.news_items ?? [] }, reading, cooking, baseUrl)
  return { html: renderWeeklyNewsletter(context), context }
}

export async function sendNewsletter(input: { newsletterId: string; testEmail?: string; baseUrl?: string }) {
  const { newsletterId, testEmail, baseUrl: rawBase } = input
  const baseUrl = (rawBase || process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")
  const newsletter = await getNewsletter(newsletterId)
  if (!newsletter) throw new Error(`Newsletter not found: ${newsletterId}`)

  const { html } = await previewNewsletter(newsletterId, baseUrl)
  const now = new Date()
  const start = new Date(now.getTime() - 7 * 86_400_000)
  const end = new Date(now.getTime() - 86_400_000)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const nlDisplayName = process.env.NEWSLETTER_NAME || "Newsletter"
  const subject = `${nlDisplayName} - Week of ${fmt(start)} to ${fmt(end)}`
  const fromAddress = process.env.RESEND_FROM_EMAIL
  if (!fromAddress) throw new Error("RESEND_FROM_EMAIL is not configured")
  const from = `${process.env.RESEND_FROM_NAME || nlDisplayName} <${fromAddress}>`
  const resend = getResend()

  if (testEmail) {
    const r = await resend.emails.send({ from, to: testEmail, subject: `[TEST] ${subject}`, html, headers: { "List-Unsubscribe": `<${baseUrl}/unsubscribe?email=${encodeURIComponent(testEmail)}>` } })
    return { success: true, type: "test" as const, emailId: (r as any).data?.id ?? null, to: testEmail }
  }

  if (!newsletter.audience_id) throw new Error("No audience_id set — call update_newsletter first")
  const bc = await resendRetry(() => resend.broadcasts.create({ audienceId: newsletter.audience_id!, from, subject, html }), "broadcasts.create")
  if (bc?.error) throw new Error(`Create broadcast: ${bc.error.message}`)
  const sent = await resendRetry(() => resend.broadcasts.send(bc.data.id), "broadcasts.send")

  await getSupabase().from("weekly_newsletters").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", newsletterId)
  return { success: true, type: "broadcast" as const, broadcastId: (sent as any).data?.id ?? bc.data.id, audienceId: newsletter.audience_id, subject }
}

export async function getEmailStats(input: { broadcastId?: string; eventType?: string; since?: string; limit?: number } = {}) {
  const { broadcastId, eventType, since, limit = 100 } = input
  const supabase = getSupabase()
  let q = supabase.from("email_events").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(limit)
  if (broadcastId) q = q.eq("broadcast_id", broadcastId)
  if (eventType) q = q.eq("event_type", eventType)
  if (since) q = q.gte("created_at", since)
  const { data, error, count } = await q
  if (error) throw new Error(`Failed to get stats: ${error.message}`)
  const summary: Record<string, number> = {}
  for (const e of data ?? []) { const t = (e as any).event_type || "unknown"; summary[t] = (summary[t] ?? 0) + 1 }
  return { events: data ?? [], summary, total: count ?? 0 }
}
