export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import { buildNewsletterContext, renderWeeklyNewsletter } from "@/lib/renderer"
import { notFound } from "next/navigation"

async function loadIssue(id: string) {
  try {
    const supabase = getSupabase()
    const { data: nl } = await supabase.from("weekly_newsletters").select("*").eq("id", id).maybeSingle()
    if (!nl) return null

    const [{ data: autoReading }, { data: autoCooking }, { data: selected }] = await Promise.all([
      supabase.from("saved_content").select("*").eq("type", "reading").order("created_at", { ascending: false }).limit(10),
      supabase.from("saved_content").select("*").eq("type", "cooking").order("created_at", { ascending: false }).limit(5),
      nl.recipe_ids?.length ? supabase.from("saved_content").select("*").in("id", nl.recipe_ids) : Promise.resolve({ data: [] }),
    ])
    return { nl, autoReading, autoCooking, selected }
  } catch {
    return null
  }
}

export default async function NewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const loaded = await loadIssue(id)
  if (!loaded) notFound()
  const { nl, autoReading, autoCooking, selected } = loaded

  const reading = (selected?.length ? selected : autoReading) ?? []
  const cooking = (Array.isArray(nl.cooking_items) && nl.cooking_items.length ? nl.cooking_items as any[] : autoCooking) ?? []
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
  const context = buildNewsletterContext({ weekStart: new Date(nl.week_start), chefsTableTitle: nl.chefs_table_title, chefsTableBody: nl.chefs_table_body, newsItems: nl.news_items ?? [] }, reading, cooking, baseUrl)
  const html = renderWeeklyNewsletter(context)

  // Render the email HTML directly in an iframe-like container
  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="max-w-[660px] mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <a href="/archive" className="text-xs text-[#0d0d0d]/40 hover:text-[#0d0d0d] transition-colors">← All issues</a>
          <span className="text-xs text-[#0d0d0d]/40">
            {new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        {/* Render email HTML inline — safe since it's our own content */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
