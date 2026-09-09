/**
 * Single source of truth for turning a newsletter row into email HTML.
 *
 * Both the web routes and the MCP tools go through here so a preview, a test
 * send, a broadcast, and the public issue page always produce the same output.
 */

import { getSupabase } from "./supabase"
import { buildNewsletterContext, renderWeeklyNewsletter } from "./renderer"

export interface NewsletterRowLike {
  week_start: string
  chefs_table_title?: string | null
  chefs_table_body?: string | null
  news_items?: unknown[] | null
  recipe_ids?: string[] | null
}

export interface ContentItem {
  title: string
  url?: string
  description: string
  source?: string
  createdAt?: string | null
}

/**
 * Supabase returns snake_case; the renderer's recency filter reads camelCase
 * `createdAt`. Without this mapping every reading item is silently dropped.
 */
function toContentItem(row: any): ContentItem {
  return {
    title: row.title ?? "",
    url: row.url ?? undefined,
    description: row.description ?? "",
    source: row.source ?? undefined,
    createdAt: row.created_at ?? row.createdAt ?? null,
  }
}

/** Load the "reading" and "cooking" items that belong in this issue. */
export async function loadIssueContent(
  nl: NewsletterRowLike
): Promise<{ reading: ContentItem[]; cooking: ContentItem[] }> {
  try {
    const supabase = getSupabase()
    const [{ data: autoReading }, { data: autoCooking }, { data: pinned }] = await Promise.all([
      supabase.from("saved_content").select("*").eq("type", "reading").order("created_at", { ascending: false }).limit(20),
      supabase.from("saved_content").select("*").eq("type", "cooking").order("created_at", { ascending: false }).limit(5),
      nl.recipe_ids?.length
        ? supabase.from("saved_content").select("*").in("id", nl.recipe_ids)
        : Promise.resolve({ data: [] as any[] }),
    ])

    // Explicitly pinned items win over the automatic recent feed.
    const readingRows = pinned?.length ? pinned : (autoReading ?? [])
    return {
      reading: readingRows.map(toContentItem),
      cooking: (autoCooking ?? []).map(toContentItem),
    }
  } catch {
    return { reading: [], cooking: [] }
  }
}

/** Load content and render the full email HTML for an issue. */
export async function renderIssueHtml(nl: NewsletterRowLike, baseUrl?: string): Promise<string> {
  const { reading, cooking } = await loadIssueContent(nl)
  const ctx = buildNewsletterContext(
    {
      weekStart: new Date(nl.week_start),
      chefsTableTitle: nl.chefs_table_title,
      chefsTableBody: nl.chefs_table_body,
      newsItems: nl.news_items ?? [],
    },
    reading,
    cooking,
    baseUrl
  )
  return renderWeeklyNewsletter(ctx)
}
