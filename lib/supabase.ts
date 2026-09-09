/**
 * Supabase service-role client — shared between Next.js and MCP server.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  if (!_client) _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

// ── Typed row shapes ──────────────────────────────────────────────────────────

export type SubscriberRow = {
  id: string
  email: string
  status: string
  daily_enabled: boolean
  weekly_enabled: boolean
  created_at: string
  updated_at: string
}

export type WeeklyNewsletterRow = {
  id: string
  week_start: string
  week_end: string
  status: string
  chefs_table_title: string | null
  chefs_table_body: string | null
  news_items: unknown[] | null
  recipe_ids: string[]
  cooking_items: unknown[] | null
  system_prompt: string | null
  audience_id: string | null
  generated_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export type EmailEventRow = {
  id: string
  event_id: string | null
  event_type: string
  email_id: string | null
  broadcast_id: string | null
  recipient: string | null
  subject: string | null
  click_url: string | null
  payload: unknown
  created_at: string
}
