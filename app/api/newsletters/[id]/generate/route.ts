import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabase } from "@/lib/supabase"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const { data: nl, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !nl) return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 })

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"
    const genAI = new GoogleGenerativeAI(apiKey)
    const gemini = genAI.getGenerativeModel({ model })

    const newsItems: any[] = Array.isArray(nl.news_items) ? nl.news_items : []
    const newsContext = newsItems
      .slice(0, 3)
      .map((item: any) => `- ${item.title}: ${item.summary || item.Description || ""}`)
      .join("\n")

    const newsletterName = process.env.NEWSLETTER_NAME || "this newsletter"
    const audience = process.env.NEWSLETTER_TAGLINE || "our readers"

    const prompt = `You are the editor of "${newsletterName}". ${audience}
Write a concise, warm, insightful editorial intro for this week's issue.
Respond in JSON: {"title": "...", "body": "..."}

Context:
- Week of: ${new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
- News items this week:
${newsContext || "No news items yet."}

The title should be a pithy phrase (5-10 words). The body should be 2-3 short paragraphs, conversational and grounded — tie the week's items together rather than just listing them. Keep it under 250 words.`

    const result = await gemini.generateContent(prompt)
    const text = result.response.text().trim()

    let parsed: { title: string; body: string }
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? text)
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
    }

    const { data: updated, error: updateErr } = await getSupabase()
      .from("weekly_newsletters")
      .update({
        chefs_table_title: parsed.title,
        chefs_table_body: parsed.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
