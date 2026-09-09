export const dynamic = "force-dynamic"

import { getSupabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import NewsletterEditor from "@/components/manage/newsletter-editor"

type Ctx = { params: Promise<{ id: string }> }

async function getNewsletter(id: string) {
  try {
    const { data, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("id", id)
      .single()
    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

export default async function NewsletterDetailPage({ params }: Ctx) {
  const { id } = await params
  const newsletter = await getNewsletter(id)
  if (!newsletter) notFound()

  return <NewsletterEditor newsletter={newsletter} />
}
