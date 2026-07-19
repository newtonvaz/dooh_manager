import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.find((b) => b.name === "uploads")) {
    await supabaseAdmin.storage.createBucket("uploads", {
      public: true,
      fileSizeLimit: 104857600,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, entry } = body

    if (action !== "register" || !entry) {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
    }

    await ensureBucket()

    const contentType = entry.type || "web"

    const dbEntry = {
      id: entry.id || `c${Date.now()}`,
      name: entry.name || "Sem nome",
      type: contentType,
      url: entry.url || "",
      thumbnail_url: contentType === "image" ? entry.url : null,
      size: entry.size || 0,
      duration: entry.duration ?? (contentType === "video" ? 30 : null),
      category: "Geral",
      tags: JSON.stringify([contentType]),
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabaseAdmin.from("content").insert(dbEntry)
    if (insertError) throw insertError

    await supabaseAdmin.from("activities").insert({
      id: `act${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      type: "upload",
      description: `Arquivo ${dbEntry.name} enviado para o CMS`,
      player_name: "",
      player_code: "",
      user: "Sistema",
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ data: dbEntry })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
