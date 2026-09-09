/**
 * Live setup diagnostics for the onboarding page.
 * Only ever reports WHETHER a var is set — never its value.
 */

import { getSupabase } from "./supabase"

export type CheckStatus = "ok" | "missing" | "warn"

export interface EnvVar {
  name: string
  set: boolean
  optional?: boolean
}

export interface SetupStep {
  id: string
  title: string
  blurb: string
  status: CheckStatus
  required: boolean
  vars: EnvVar[]
  hint: string
  link?: { label: string; url: string }
  detail?: string
}

/** Placeholder values shipped in .env.example shouldn't count as configured. */
const PLACEHOLDER = /^(re_x|whsec_x|eyJhbGciOiJIUzI1NiIs\.\.\.|AIzaxxx|a-long-random|your-|https:\/\/your-project)/i

function isSet(key: string): boolean {
  const v = process.env[key]
  if (!v) return false
  const t = v.trim()
  if (!t) return false
  if (PLACEHOLDER.test(t)) return false
  if (t.includes("xxxxx")) return false
  return true
}

function vars(...defs: Array<[string, boolean?]>): EnvVar[] {
  return defs.map(([name, optional]) => ({ name, set: isSet(name), optional: !!optional }))
}

function statusOf(v: EnvVar[]): CheckStatus {
  const required = v.filter((x) => !x.optional)
  const optional = v.filter((x) => x.optional)
  if (required.length && required.every((x) => x.set)) {
    return optional.every((x) => x.set) ? "ok" : "ok"
  }
  if (required.some((x) => x.set)) return "warn"
  return "missing"
}

export interface DbState {
  reachable: boolean
  tables: Record<string, boolean>
  error?: string
}

async function checkDatabase(): Promise<DbState> {
  if (!isSet("SUPABASE_URL") || !isSet("SUPABASE_SERVICE_ROLE_KEY")) {
    return { reachable: false, tables: {} }
  }
  const expected = ["subscribers", "weekly_newsletters"]
  const tables: Record<string, boolean> = {}
  try {
    const supabase = getSupabase()
    await Promise.all(
      expected.map(async (t) => {
        const { error } = await supabase.from(t).select("*", { count: "exact", head: true })
        tables[t] = !error
      })
    )
    return { reachable: Object.values(tables).some(Boolean), tables }
  } catch (e) {
    return { reachable: false, tables, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getSetupState(): Promise<{
  steps: SetupStep[]
  db: DbState
  complete: number
  total: number
  ready: boolean
}> {
  const db = await checkDatabase()

  const identityVars = vars(["NEWSLETTER_NAME"], ["NEWSLETTER_TAGLINE", true], ["NEWSLETTER_COLOR", true])
  const dbVars = vars(["SUPABASE_URL"], ["SUPABASE_SERVICE_ROLE_KEY"])
  const emailVars = vars(["RESEND_API_KEY"], ["RESEND_FROM_EMAIL"], ["RESEND_FROM_NAME", true])
  const aiVars = vars(["GEMINI_API_KEY"], ["GEMINI_MODEL", true])
  const secVars = vars(["UNSUBSCRIBE_SECRET"], ["MANAGE_SECRET", true], ["BASE_URL"])

  const allTables = Object.keys(db.tables).length > 0 && Object.values(db.tables).every(Boolean)
  const dbStatus: CheckStatus =
    statusOf(dbVars) !== "ok" ? statusOf(dbVars) : allTables ? "ok" : "warn"

  const steps: SetupStep[] = [
    {
      id: "identity",
      title: "Name your newsletter",
      blurb: "Branding for the site, the emails, and the unsubscribe footer.",
      status: statusOf(identityVars),
      required: true,
      vars: identityVars,
      hint: "Set NEWSLETTER_NAME, plus an optional tagline and hex accent color.",
    },
    {
      id: "database",
      title: "Connect Supabase",
      blurb: "Stores subscribers and newsletter drafts. Uses the service-role key server-side.",
      status: dbStatus,
      required: true,
      vars: dbVars,
      hint: "Project Settings → API. Copy the URL and the service_role key.",
      link: { label: "Supabase dashboard", url: "https://supabase.com/dashboard" },
      detail:
        Object.keys(db.tables).length > 0
          ? Object.entries(db.tables)
              .map(([t, ok]) => `${ok ? "✓" : "✗"} ${t}`)
              .join("   ")
          : undefined,
    },
    {
      id: "email",
      title: "Connect Resend",
      blurb: "Delivers the newsletter, manages contacts and topic subscriptions.",
      status: statusOf(emailVars),
      required: true,
      vars: emailVars,
      hint: "Create an API key, then verify the domain you'll send from.",
      link: { label: "Resend dashboard", url: "https://resend.com/api-keys" },
    },
    {
      id: "security",
      title: "Set secrets and URLs",
      blurb: "Signs unsubscribe links and gates the management area.",
      status: statusOf(secVars),
      required: true,
      vars: secVars,
      hint: "UNSUBSCRIBE_SECRET can be any long random string. MANAGE_SECRET protects /manage — leave it empty in dev.",
    },
    {
      id: "ai",
      title: "Add Gemini (optional)",
      blurb: "Lets agents and the editor generate the weekly intro automatically.",
      status: statusOf(aiVars) === "missing" ? "warn" : "ok",
      required: false,
      vars: aiVars,
      hint: "Skip this if you'd rather write every intro by hand.",
      link: { label: "Google AI Studio", url: "https://aistudio.google.com/apikey" },
    },
  ]

  const required = steps.filter((s) => s.required)
  const complete = required.filter((s) => s.status === "ok").length

  return {
    steps,
    db,
    complete,
    total: required.length,
    ready: complete === required.length,
  }
}
