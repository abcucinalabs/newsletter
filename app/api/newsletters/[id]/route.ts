import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const { data, error } = await getSupabase()
      .from("weekly_newsletters")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const updates = await req.json()
    // Prevent overriding status directly via PATCH (use /send for that)
    delete updates.id
    const { data, error } = await getSupabase()
      .from("weekly_newsletters")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const { error } = await getSupabase()
      .from("weekly_newsletters")
      .delete()
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
