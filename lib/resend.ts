/**
 * Resend v6 client — shared between Next.js API routes and the MCP server.
 * Uses process.env directly (compatible with both runtimes).
 */

import { Resend } from "resend"

let _client: Resend | null = null

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY env var is required")
  if (!_client) _client = new Resend(key)
  return _client
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function resendRetry(fn: () => Promise<any>, label: string): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i < 5; i++) {
    if (i > 0) await sleep(700 * i)
    try {
      const result = await fn()
      const errMsg: string = result?.error?.message ?? ""
      if (errMsg && /too many|rate limit|429/i.test(errMsg) && i < 4) {
        lastErr = result.error
        continue
      }
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (/too many|rate limit|429/i.test(msg) && i < 4) { lastErr = e; continue }
      throw new Error(`${label} failed: ${msg}`)
    } finally {
      await sleep(550)
    }
  }
  throw new Error(`${label} exhausted retries: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`)
}

// ── Topic helpers ─────────────────────────────────────────────────────────────

export const TOPIC_NAMES = { daily: "Daily Insights", weekly: "Weekly News" } as const

export async function getOrCreateTopicId(resend: Resend, topicName: string): Promise<string> {
  const topics = (resend as any).topics
  const list = await resendRetry(() => topics.list(), "topics.list")
  if (list.error) throw new Error(list.error.message ?? "Failed to list topics")
  const existing = (list.data?.data ?? []).find(
    (t: any) => t.name?.trim().toLowerCase() === topicName.trim().toLowerCase()
  )
  if (existing?.id) return existing.id as string
  const created = await resendRetry(
    () => topics.create({ name: topicName, defaultSubscription: "opt_in" }),
    "topics.create"
  )
  if (created.error) throw new Error(created.error.message ?? `Failed to create topic: ${topicName}`)
  if (!created.data?.id) throw new Error("Failed to create topic: no id returned")
  return created.data.id
}

export async function getTopicIds(resend: Resend): Promise<{ dailyId: string | null; weeklyId: string | null }> {
  const topics = (resend as any).topics
  const list = await resendRetry(() => topics.list(), "topics.list")
  if (list.error) return { dailyId: null, weeklyId: null }
  const data: any[] = list.data?.data ?? []
  const daily = data.find((t: any) => t.name?.trim().toLowerCase() === TOPIC_NAMES.daily.toLowerCase())
  const weekly = data.find((t: any) => t.name?.trim().toLowerCase() === TOPIC_NAMES.weekly.toLowerCase())
  return { dailyId: (daily?.id as string) ?? null, weeklyId: (weekly?.id as string) ?? null }
}

export async function setContactTopicPreferences(
  resend: Resend,
  email: string,
  opts: { daily: boolean; weekly: boolean }
): Promise<void> {
  const dailyId = await getOrCreateTopicId(resend, TOPIC_NAMES.daily)
  await sleep(550)
  const weeklyId = await getOrCreateTopicId(resend, TOPIC_NAMES.weekly)
  await sleep(550)
  const result: any = await resendRetry(
    () => (resend.contacts as any).topics.update({
      email,
      topics: [
        { id: dailyId, subscription: opts.daily ? "opt_in" : "opt_out" },
        { id: weeklyId, subscription: opts.weekly ? "opt_in" : "opt_out" },
      ],
    }),
    "contacts.topics.update"
  )
  if (result?.error) throw new Error(`Topic update failed: ${String(result.error.message)}`)
}
