import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { week_start, chefs_table_title, chefs_table_body, news_items } = body

    if (!week_start) {
      return NextResponse.json({ error: "week_start is required" }, { status: 400 })
    }

    const { data, error } = await getSupabase()
      .from("weekly_newsletters")
      .insert({
        week_start,
        chefs_table_title: chefs_table_title ?? null,
        chefs_table_body: chefs_table_body ?? null,
        news_items: news_items ?? [],
        status: "draft",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
