export const dynamic = "force-dynamic"

import { config } from "@/lib/config"
import { getSetupState, type SetupStep, type CheckStatus } from "@/lib/setup-status"

const AGENTS = ["Claude Code", "Cursor", "Windsurf", "OpenClaw", "Hermes", "Grok", "Buzz", "Zed"]

const TONE: Record<CheckStatus, { dot: string; bg: string; text: string; label: string }> = {
  ok: { dot: "#10b981", bg: "rgba(16,185,129,0.10)", text: "#047857", label: "Ready" },
  warn: { dot: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#b45309", label: "Partial" },
  missing: { dot: "#d4d4d8", bg: "rgba(0,0,0,0.04)", text: "rgba(13,13,13,0.45)", label: "Not set" },
}

function StepCard({ step, index }: { step: SetupStep; index: number }) {
  const tone = TONE[step.status]
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
      <div className="flex items-start gap-4">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
          style={{ backgroundColor: tone.bg, color: tone.text }}
        >
          {step.status === "ok" ? "✓" : index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h3 className="font-semibold">{step.title}</h3>
            {!step.required && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0d0d0d]/30 border border-black/[0.08] rounded px-1.5 py-0.5">
                Optional
              </span>
            )}
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full ml-auto flex-shrink-0"
              style={{ backgroundColor: tone.bg, color: tone.text }}
            >
              {tone.label}
            </span>
          </div>

          <p className="text-sm text-[#0d0d0d]/55 leading-relaxed mb-4">{step.blurb}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {step.vars.map((v) => (
              <span
                key={v.name}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] rounded-lg px-2 py-1 border"
                style={{
                  borderColor: v.set ? "rgba(16,185,129,0.25)" : "rgba(0,0,0,0.07)",
                  backgroundColor: v.set ? "rgba(16,185,129,0.06)" : "rgba(0,0,0,0.02)",
                  color: v.set ? "#047857" : "rgba(13,13,13,0.4)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: v.set ? "#10b981" : "#d4d4d8" }}
                />
                {v.name}
                {v.optional && <span className="opacity-50">?</span>}
              </span>
            ))}
          </div>

          {step.detail && (
            <p className="font-mono text-[11px] text-[#0d0d0d]/40 mb-3">{step.detail}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-xs text-[#0d0d0d]/40 leading-relaxed flex-1 min-w-[240px]">{step.hint}</p>
            {step.link && (
              <a
                href={step.link.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium hover:underline flex-shrink-0"
                style={{ color: config.color }}
              >
                {step.link.label} ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const { steps, complete, total, ready } = await getSetupState()
  const pct = Math.round((complete / total) * 100)

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
     <div className="max-w-3xl">

      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight mb-5 max-w-xl">
          A newsletter your AI agents can run
        </h1>

        <p className="text-lg text-[#0d0d0d]/60 leading-relaxed max-w-2xl mb-4">
          newsletter-mcp is a self-hosted newsletter platform with an MCP server built in. Write, schedule,
          and send issues yourself — or hand the whole workflow to an agent.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {AGENTS.map((a) => (
            <span
              key={a}
              className="text-xs bg-white border border-black/[0.06] rounded-lg px-2.5 py-1 text-[#0d0d0d]/55"
            >
              {a}
            </span>
          ))}
          <span className="text-xs border border-dashed border-black/[0.1] rounded-lg px-2.5 py-1 text-[#0d0d0d]/30">
            + any MCP client
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">
              {ready ? "You're ready to publish" : "Finish setting up"}
            </h2>
            <p className="text-sm text-[#0d0d0d]/45 mt-0.5">
              {ready
                ? "Everything required is configured. Create your first issue whenever you like."
                : `${complete} of ${total} required steps complete — values come from .env.local`}
            </p>
          </div>
          <span
            className="text-2xl font-semibold tabular-nums flex-shrink-0 ml-4"
            style={{ color: ready ? "#10b981" : config.color }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: ready ? "#10b981" : config.color }}
          />
        </div>

        {ready && (
          <div className="flex gap-2 mt-5">
            <a
              href="/manage/newsletters/new"
              className="text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.color }}
            >
              Create first issue
            </a>
            <a
              href="/manage"
              className="rounded-xl px-4 py-2.5 text-sm font-medium border border-black/[0.08] hover:border-black/20 transition-colors"
            >
              Open dashboard
            </a>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-12">
        {steps.map((s, i) => (
          <StepCard key={s.id} step={s} index={i + 1} />
        ))}
      </div>

      {/* Env template */}
      <div className="mb-12">
        <h2 className="font-semibold mb-1">Where these live</h2>
        <p className="text-sm text-[#0d0d0d]/50 mb-4">
          Create <code className="font-mono text-xs bg-black/[0.05] px-1.5 py-0.5 rounded">.env.local</code> in
          the project root, then restart the dev server.
        </p>
        <div className="bg-[#0d0d0d] rounded-xl p-5 font-mono text-xs leading-[1.9] overflow-x-auto">
          <p className="text-white/25"># Identity</p>
          <p className="text-white/70">NEWSLETTER_NAME=<span className="text-white/40">&quot;My Weekly&quot;</span></p>
          <p className="text-white/70">NEWSLETTER_TAGLINE=<span className="text-white/40">&quot;Signals for builders&quot;</span></p>
          <p className="text-white/70">NEWSLETTER_COLOR=<span className="text-white/40">&quot;#4f46e5&quot;</span></p>
          <p className="text-white/25 pt-2"># Database</p>
          <p className="text-white/70">SUPABASE_URL=<span className="text-white/40">https://xxx.supabase.co</span></p>
          <p className="text-white/70">SUPABASE_SERVICE_ROLE_KEY=<span className="text-white/40">eyJ...</span></p>
          <p className="text-white/25 pt-2"># Email</p>
          <p className="text-white/70">RESEND_API_KEY=<span className="text-white/40">re_...</span></p>
          <p className="text-white/70">RESEND_FROM_EMAIL=<span className="text-white/40">hello@yourdomain.com</span></p>
          <p className="text-white/25 pt-2"># Security</p>
          <p className="text-white/70">UNSUBSCRIBE_SECRET=<span className="text-white/40">any-long-random-string</span></p>
          <p className="text-white/70">MANAGE_SECRET=<span className="text-white/40"># empty in dev</span></p>
          <p className="text-white/70">BASE_URL=<span className="text-white/40">http://localhost:3001</span></p>
        </div>
      </div>

      {/* Agent hookup */}
      <div>
        <h2 className="font-semibold mb-1">Hand it to an agent</h2>
        <p className="text-sm text-[#0d0d0d]/50 mb-4">
          Build the server with{" "}
          <code className="font-mono text-xs bg-black/[0.05] px-1.5 py-0.5 rounded">npm run build:mcp</code>, then
          add this to your agent&apos;s MCP config.
        </p>
        <div className="bg-[#0d0d0d] rounded-xl p-5 font-mono text-xs leading-[1.9] overflow-x-auto mb-4">
          <p className="text-white/70">{"{"}</p>
          <p className="text-white/70 pl-3">&quot;mcpServers&quot;: {"{"}</p>
          <p className="pl-6" style={{ color: config.color }}>&quot;newsletter&quot;: {"{"}</p>
          <p className="text-white/70 pl-9">&quot;command&quot;: &quot;node&quot;,</p>
          <p className="text-white/70 pl-9">&quot;args&quot;: [&quot;/path/to/newsletter-mcp/dist/mcp/index.js&quot;],</p>
          <p className="text-white/70 pl-9">&quot;env&quot;: {"{"} <span className="text-white/25">/* same vars as above */</span> {"}"}</p>
          <p className="text-white/70 pl-6">{"}"}</p>
          <p className="text-white/70 pl-3">{"}"}</p>
          <p className="text-white/70">{"}"}</p>
        </div>
        <p className="text-sm text-[#0d0d0d]/45 leading-relaxed">
          The agent gets 15 tools — creating drafts, adding news items, generating intros, previewing,
          sending tests, broadcasting, and reading subscriber stats. Ask it:{" "}
          <span className="text-[#0d0d0d]/70">&ldquo;draft next Monday&apos;s issue and send me a test.&rdquo;</span>
        </p>
      </div>

     </div>
    </div>
  )
}
