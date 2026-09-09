export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import type { WeeklyNewsletterRow } from "@/lib/supabase"
import { config } from "@/lib/config"

async function getNewsletters(): Promise<WeeklyNewsletterRow[]> {
  try {
    const { data } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("status", "sent")
      .order("week_start", { ascending: false })
      .limit(50)
    return (data ?? []) as WeeklyNewsletterRow[]
  } catch {
    return []
  }
}

export default async function ArchivePage() {
  const newsletters = await getNewsletters()

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
     <div className="max-w-3xl">
      <div className="mb-10">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#0d0d0d]/30 mb-3">Archive</p>
        <h1 className="text-4xl font-semibold tracking-tight">All issues</h1>
        <p className="text-[#0d0d0d]/50 mt-2 text-sm">{newsletters.length} issue{newsletters.length !== 1 ? "s" : ""} sent</p>
      </div>

      {newsletters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-12 text-center">
          <p className="text-[#0d0d0d]/40 mb-2">No issues sent yet.</p>
          <a href="/manage/newsletters/new" className="text-sm hover:underline" style={{ color: config.color }}>
            Create the first one →
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {newsletters.map((nl) => (
            <a
              key={nl.id}
              href={`/newsletter/${nl.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-black/[0.06] px-5 py-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold uppercase"
                  style={{ backgroundColor: config.color }}
                >
                  {new Date(nl.week_start).toLocaleDateString("en-US", { month: "short" })}
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:underline transition-colors">
                    {nl.chefs_table_title || `Week of ${new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                  </p>
                  <p className="text-xs text-[#0d0d0d]/40 mt-0.5">
                    {new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <span className="text-[#0d0d0d]/20 group-hover:translate-x-1 transition-transform" style={{ color: config.color }}>→</span>
            </a>
          ))}
        </div>
      )}
     </div>
    </div>
  )
}
