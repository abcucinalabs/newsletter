export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"

async function getSubscribers() {
  try {
    const { data } = await getSupabase()
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    return data ?? []
  } catch {
    return []
  }
}

export default async function SubscribersPage() {
  const subscribers = await getSubscribers()
  const active = subscribers.filter((s: any) => s.status === "active").length
  const unsubscribed = subscribers.filter((s: any) => s.status === "unsubscribed").length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">Subscribers</h1>
        <p className="text-[#0d0d0d]/50 text-sm">
          {active.toLocaleString()} active · {unsubscribed.toLocaleString()} unsubscribed · {subscribers.length.toLocaleString()} total
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
        {subscribers.length === 0 ? (
          <div className="p-12 text-center text-[#0d0d0d]/40 text-sm">No subscribers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#0d0d0d]/40 uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {subscribers.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#0d0d0d]">{sub.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        sub.status === "active"
                          ? "bg-[#10b981]/12 text-[#047857]"
                          : "bg-[#0d0d0d]/5 text-[#0d0d0d]/40"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#0d0d0d]/40">
                      {sub.created_at
                        ? new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
