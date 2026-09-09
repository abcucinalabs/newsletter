import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { renderWeeklyNewsletter, buildNewsletterContext } from "@/lib/renderer"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const { data: nl, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !nl) return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })

    const baseUrl = process.env.BASE_URL || "http://localhost:3001"
    const ctx = buildNewsletterContext(
      {
        weekStart: new Date(nl.week_start),
        chefsTableTitle: nl.chefs_table_title,
        chefsTableBody: nl.chefs_table_body,
        newsItems: nl.news_items,
      },
      [], // reading items — not stored separately in this package
      [],
      baseUrl
    )
    const html = renderWeeklyNewsletter(ctx)
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
