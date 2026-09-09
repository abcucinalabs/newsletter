/**
 * Newsletter configuration — reads from env vars with sensible defaults.
 * Import this anywhere you need branding constants (server-side only).
 */

export const config = {
  name: process.env.NEWSLETTER_NAME || "Newsletter",
  tagline: process.env.NEWSLETTER_TAGLINE || "Your weekly briefing",
  description: process.env.NEWSLETTER_DESCRIPTION || "Delivered every week.",
  color: process.env.NEWSLETTER_COLOR || "#4f46e5",
  logoText: process.env.NEWSLETTER_LOGO_TEXT || (process.env.NEWSLETTER_NAME || "NL").slice(0, 2).toLowerCase(),
  fromName: process.env.RESEND_FROM_NAME || process.env.NEWSLETTER_NAME || "Newsletter",
  fromEmail: process.env.RESEND_FROM_EMAIL || "hello@example.com",
  baseUrl: (process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, ""),
} as const
