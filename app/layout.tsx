import type { Metadata } from "next"
import "./globals.css"
import { config } from "@/lib/config"

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f5f5] text-[#0d0d0d]">
        <header className="sticky top-0 z-50 bg-[#0d0d0d] border-b border-white/[0.08]">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="text-sm font-semibold text-white tracking-tight hover:text-white/80 transition-colors">
              {config.name}
            </a>
            <nav className="flex items-center gap-5 text-xs text-white/50">
              <a href="/" className="hover:text-white transition-colors">Setup</a>
              <a href="/archive" className="hover:text-white transition-colors">Archive</a>
              <a href="/subscribe" className="hover:text-white transition-colors">Subscribe</a>
              <a
                href="/manage"
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                Manage
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-black/[0.06] mt-16 py-8">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-[#0d0d0d]/30">
            <span>{config.name}</span>
            <span>
              Powered by{" "}
              <a
                href="https://github.com/abcucinalabs/newsletter"
                className="hover:text-[#0d0d0d]/60 transition-colors underline underline-offset-2"
                target="_blank"
              >
                newsletter-mcp
              </a>
              {" "}· AI-native newsletter management
            </span>
          </div>
        </footer>
      </body>
    </html>
  )
}
