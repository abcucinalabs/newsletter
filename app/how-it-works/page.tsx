import { config } from "@/lib/config"
import HowItWorksGuide from "@/components/how-it-works-guide"

export const metadata = {
  title: `How it works — ${config.name}`,
  description: "How newsletter-mcp collects content, drafts issues, and sends them — on its own or through an agent.",
}

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="max-w-3xl">
        <div className="mb-12">
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight mb-4">How it works</h1>
          <p className="text-lg text-[#0d0d0d]/60 leading-relaxed">
            A newsletter is a weekly loop: gather things worth sharing, shape them into an issue, send it,
            see how it landed. Every step below can be done by you in the UI, by an agent over MCP, or by
            some mix of the two on the same issue.
          </p>
        </div>

        <HowItWorksGuide color={config.color} />

        <div className="mt-16 pt-10 border-t border-black/[0.06] flex flex-wrap gap-3">
          <a
            href="/"
            className="text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: config.color }}
          >
            Set it up
          </a>
          <a
            href="/manage"
            className="rounded-xl px-4 py-2.5 text-sm font-medium border border-black/[0.08] hover:border-black/20 transition-colors"
          >
            Open dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
