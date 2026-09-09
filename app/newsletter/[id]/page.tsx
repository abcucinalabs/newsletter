export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import { renderIssueHtml } from "@/lib/newsletter-content"
import { notFound } from "next/navigation"

async function loadIssue(id: string) {
  try {
    const supabase = getSupabase()
    const { data: nl } = await supabase.from("weekly_newsletters").select("*").eq("id", id).maybeSingle()
    return nl ?? null
  } catch {
    return null
  }
}

export default async function NewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const nl = await loadIssue(id)
  if (!nl) notFound()

  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || ""
  const html = await renderIssueHtml(nl, baseUrl)

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
