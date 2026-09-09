export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import { config } from "@/lib/config"

async function getStats() {
  try {
    const supabase = getSupabase()
    const [{ count: totalSubs }, { count: activeSubs }, { count: totalSent }, { data: recent }] = await Promise.all([
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("weekly_newsletters").select("*", { count: "exact", head: true }).eq("status", "sent"),
      supabase.from("weekly_newsletters").select("id, week_start, chefs_table_title, status").order("week_start", { ascending: false }).limit(5),
    ])
    return { configured: true, totalSubs: totalSubs ?? 0, activeSubs: activeSubs ?? 0, totalSent: totalSent ?? 0, recent: recent ?? [] }
  } catch {
    return { configured: false, totalSubs: 0, activeSubs: 0, totalSent: 0, recent: [] as any[] }
  }
}

export default async function ManageDashboard() {
  const stats = await getStats()

  if (!stats.configured) {
    return (
      <div className="max-w-lg">
        <h1 className="text-3xl font-semibold mb-1">Dashboard</h1>
        <p className="text-[#0d0d0d]/50 text-sm mb-8">Newsletter management</p>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-8">
          <h2 className="font-semibold mb-2">Database not connected yet</h2>
          <p className="text-sm text-[#0d0d0d]/55 leading-relaxed mb-5">
            Set <code className="font-mono text-xs bg-black/[0.05] px-1.5 py-0.5 rounded">SUPABASE_URL</code> and{" "}
            <code className="font-mono text-xs bg-black/[0.05] px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            in <code className="font-mono text-xs bg-black/[0.05] px-1.5 py-0.5 rounded">.env.local</code>, then restart
            the dev server. The setup page tracks what&apos;s still missing.
          </p>
          <a
            href="/"
            className="inline-block text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: config.color }}
          >
            Go to setup
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">Dashboard</h1>
        <p className="text-[#0d0d0d]/50 text-sm">Newsletter management</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total subscribers", value: stats.totalSubs },
          { label: "Active subscribers", value: stats.activeSubs },
          { label: "Issues sent", value: stats.totalSent },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <p className="text-3xl font-semibold">{s.value.toLocaleString()}</p>
            <p className="text-xs text-[#0d0d0d]/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Recent newsletters</h2>
        <a href="/manage/newsletters" className="text-xs text-[#4f46e5] hover:underline">View all →</a>
      </div>

      <div className="space-y-2">
        {stats.recent.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center text-[#0d0d0d]/40 text-sm">
            No newsletters yet.{" "}
            <a href="/manage/newsletters" className="text-[#4f46e5] hover:underline">Create one →</a>
          </div>
        ) : (
          stats.recent.map((nl: any) => (
            <a key={nl.id} href={`/manage/newsletters/${nl.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-black/[0.06] px-5 py-4 hover:shadow-sm transition-shadow group">
              <div>
                <p className="font-medium text-sm group-hover:text-[#4f46e5] transition-colors">
                  {nl.chefs_table_title || `Week of ${new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                </p>
                <p className="text-xs text-[#0d0d0d]/40 mt-0.5">
                  {new Date(nl.week_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${nl.status === "sent" ? "bg-[#10b981]/12 text-[#047857]" : "bg-[#0d0d0d]/5 text-[#0d0d0d]/40"}`}>
                  {nl.status}
                </span>
                <span className="text-[#0d0d0d]/20 group-hover:text-[#4f46e5] transition-colors">→</span>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Agent connections */}
      <div className="mt-12 pt-10 border-t border-black/[0.06]">
        <h2 className="font-semibold mb-1">Connect an AI agent</h2>
        <p className="text-sm text-[#0d0d0d]/50 mb-5">
          Point any MCP-compatible agent at this server to let it manage newsletters autonomously.
        </p>
        <div className="bg-[#0d0d0d] rounded-xl p-5 font-mono text-xs text-white/70 leading-relaxed overflow-x-auto">
          <p className="text-white/30 mb-2"># Add to your agent&apos;s MCP config (claude_desktop_config.json, etc.)</p>
          <p style={{ color: config.color }}>&quot;newsletter-mcp&quot;: {"{"}</p>
          <p className="pl-4">&quot;command&quot;: &quot;node&quot;,</p>
          <p className="pl-4">&quot;args&quot;: [&quot;/path/to/newsletter-mcp/dist/mcp/index.js&quot;],</p>
          <p className="pl-4">&quot;env&quot;: {"{"}</p>
          <p className="pl-8">&quot;RESEND_API_KEY&quot;: &quot;re_...&quot;,</p>
          <p className="pl-8">&quot;SUPABASE_URL&quot;: &quot;https://...supabase.co&quot;,</p>
          <p className="pl-8">&quot;SUPABASE_SERVICE_ROLE_KEY&quot;: &quot;eyJ...&quot;</p>
          <p className="pl-4">{"}"}</p>
          <p>{"}"}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {["Claude Code", "Cursor", "Windsurf", "OpenClaw", "Hermes", "Grok", "Buzz"].map((agent) => (
            <span key={agent} className="text-xs bg-white border border-black/[0.06] rounded-lg px-3 py-1.5 text-[#0d0d0d]/60">
              {agent}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
