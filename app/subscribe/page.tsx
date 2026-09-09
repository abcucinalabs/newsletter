export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import type { WeeklyNewsletterRow } from "@/lib/supabase"
import { config } from "@/lib/config"
import SubscribeForm from "@/components/subscribe-form"

async function getLatestNewsletter(): Promise<WeeklyNewsletterRow | null> {
  try {
    const { data } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("status", "sent")
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle()
    return data as WeeklyNewsletterRow | null
  } catch {
    return null
  }
}

export default async function SubscribePage() {
  const latest = await getLatestNewsletter()

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
     <div className="max-w-3xl">

      <div className="mb-10">
        <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight mb-4">
          {config.name}
        </h1>
        <p className="text-lg text-[#0d0d0d]/60 leading-relaxed">{config.tagline}</p>
        {config.description !== config.tagline && (
          <p className="text-base text-[#0d0d0d]/40 leading-relaxed mt-2">{config.description}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] p-8 shadow-sm mb-12">
        <h2 className="text-lg font-semibold mb-1">Get every issue</h2>
        <p className="text-sm text-[#0d0d0d]/40 mb-6">No spam. Unsubscribe any time.</p>
        <SubscribeForm color={config.color} />
      </div>

      {latest && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#0d0d0d]/30">
              Latest issue
            </p>
            <a href="/archive" className="text-xs hover:underline" style={{ color: config.color }}>
              View all →
            </a>
          </div>
          <a
            href={`/newsletter/${latest.id}`}
            className="block bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <p className="text-xs text-[#0d0d0d]/40 mb-2">
              Week of{" "}
              {new Date(latest.week_start).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {latest.chefs_table_title && (
              <h3 className="text-lg font-semibold mb-2 group-hover:underline">
                {latest.chefs_table_title}
              </h3>
            )}
            {latest.chefs_table_body && (
              <p className="text-sm text-[#0d0d0d]/60 line-clamp-2 leading-relaxed">
                {latest.chefs_table_body}
              </p>
            )}
          </a>
        </div>
      )}

     </div>
    </div>
  )
}
