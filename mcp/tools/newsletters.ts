import { getSupabase, type WeeklyNewsletterRow } from "../../lib/supabase.js"
import { startOfWeek, endOfWeek, addDays } from "date-fns"

export async function createNewsletter(input: { weekStart?: string } = {}) {
  const supabase = getSupabase()
  const ws = input.weekStart ? new Date(input.weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = endOfWeek(ws, { weekStartsOn: 1 })
  const { data: existing } = await supabase.from("weekly_newsletters").select("*").gte("week_start", ws.toISOString()).lte("week_start", addDays(ws, 1).toISOString()).limit(1).maybeSingle()
  if (existing) return { created: false, newsletter: existing as WeeklyNewsletterRow }
  const { data, error } = await supabase.from("weekly_newsletters").insert({ week_start: ws.toISOString(), week_end: we.toISOString(), status: "draft", recipe_ids: [] }).select("*").single()
  if (error) throw new Error(`Failed to create newsletter: ${error.message}`)
  return { created: true, newsletter: data as WeeklyNewsletterRow }
}

export async function getNewsletter(id: string): Promise<WeeklyNewsletterRow | null> {
  const { data, error } = await getSupabase().from("weekly_newsletters").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(`Failed to get newsletter: ${error.message}`)
  return data as WeeklyNewsletterRow | null
}

export async function getCurrentNewsletter(): Promise<WeeklyNewsletterRow> {
  const supabase = getSupabase()
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = endOfWeek(new Date(), { weekStartsOn: 1 })
  const { data } = await supabase.from("weekly_newsletters").select("*").gte("week_start", ws.toISOString()).lte("week_end", we.toISOString()).limit(1).maybeSingle()
  if (data) return data as WeeklyNewsletterRow
  const result = await createNewsletter()
  return result.newsletter
}

export async function listNewsletters(input: { status?: "draft" | "sent" | "all"; limit?: number; offset?: number } = {}) {
  const { status = "all", limit = 20, offset = 0 } = input
  const supabase = getSupabase()
  let q = supabase.from("weekly_newsletters").select("*", { count: "exact" }).order("week_start", { ascending: false }).range(offset, offset + limit - 1)
  if (status !== "all") q = q.eq("status", status)
  const { data, error, count } = await q
  if (error) throw new Error(`Failed to list newsletters: ${error.message}`)
  return { newsletters: (data ?? []) as WeeklyNewsletterRow[], total: count ?? 0, limit, offset }
}

export async function updateNewsletter(input: { id: string; chefsTableTitle?: string | null; chefsTableBody?: string | null; newsItems?: unknown[]; recipeIds?: string[]; cookingItems?: unknown[]; systemPrompt?: string | null; audienceId?: string | null; status?: "draft" | "sent" }) {
  const { id, ...rest } = input
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (rest.chefsTableTitle !== undefined) updates.chefs_table_title = rest.chefsTableTitle
  if (rest.chefsTableBody !== undefined) updates.chefs_table_body = rest.chefsTableBody
  if (rest.newsItems !== undefined) updates.news_items = rest.newsItems
  if (rest.recipeIds !== undefined) updates.recipe_ids = rest.recipeIds
  if (rest.cookingItems !== undefined) updates.cooking_items = rest.cookingItems
  if (rest.systemPrompt !== undefined) updates.system_prompt = rest.systemPrompt
  if (rest.audienceId !== undefined) updates.audience_id = rest.audienceId
  if (rest.status !== undefined) updates.status = rest.status
  const { data, error } = await getSupabase().from("weekly_newsletters").update(updates).eq("id", id).select("*").single()
  if (error) throw new Error(`Failed to update newsletter: ${error.message}`)
  return data as WeeklyNewsletterRow
}

export async function addNewsItem(newsletterId: string, item: { title: string; url?: string; summary?: string; source?: string }) {
  const supabase = getSupabase()
  const { data: current } = await supabase.from("weekly_newsletters").select("news_items").eq("id", newsletterId).maybeSingle()
  const updated = [...((current?.news_items as any[]) ?? []), item]
  const { data, error } = await supabase.from("weekly_newsletters").update({ news_items: updated, updated_at: new Date().toISOString() }).eq("id", newsletterId).select("*").single()
  if (error) throw new Error(`Failed to add news item: ${error.message}`)
  return data as WeeklyNewsletterRow
}

export async function deleteNewsletter(id: string) {
  const { error } = await getSupabase().from("weekly_newsletters").delete().eq("id", id)
  if (error) throw new Error(`Failed to delete newsletter: ${error.message}`)
  return { success: true, id }
}
