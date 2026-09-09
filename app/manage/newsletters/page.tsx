export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"

async function getNewsletters() {
  try {
    const { data } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

export default async function NewslettersPage() {
  const newsletters = await getNewsletters()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Newsletters</h1>
          <p className="text-[#0d0d0d]/50 text-sm">{newsletters.length} total</p>
        </div>
        <a
          href="/manage/newsletters/new"
          className="bg-[#0d0d0d] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
        >
          + New issue
        </a>
      </div>

      <div className="space-y-2">
        {newsletters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-12 text-center">
            <p className="text-[#0d0d0d]/40 mb-4">No newsletters yet.</p>
            <a href="/manage/newsletters/new" className="text-sm text-[#4f46e5] hover:underline">Create your first issue →</a>
          </div>
        ) : (
          newsletters.map((nl: any) => (
            <a key={nl.id} href={`/manage/newsletters/${nl.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-black/[0.06] px-5 py-4 hover:shadow-sm transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center text-xs font-semibold text-[#0d0d0d]/40 flex-shrink-0">
                  {new Date(nl.week_start).toLocaleDateString("en-US", { month: "short" })}
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-[#4f46e5] transition-colors">
                    {nl.chefs_table_title || `Week of ${new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                  </p>
                  <p className="text-xs text-[#0d0d0d]/40 mt-0.5">
                    {new Date(nl.week_start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {nl.sent_at && (
                  <p className="text-xs text-[#0d0d0d]/30">
                    Sent {new Date(nl.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${nl.status === "sent" ? "bg-[#10b981]/12 text-[#047857]" : "bg-[#0d0d0d]/5 text-[#0d0d0d]/40"}`}>
                  {nl.status}
                </span>
                <span className="text-[#0d0d0d]/20 group-hover:text-[#4f46e5] transition-colors">→</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
