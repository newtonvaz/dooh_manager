import { NextRequest, NextResponse } from "next/server"
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

async function verifyAuth(request: NextRequest): Promise<{ email: string; role: string } | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null

  const role = data.user.app_metadata?.role || "operacional"
  return { email: data.user.email || "", role }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const allowedRoles = ["admin", "gestor_projeto"]
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 })
    }

    const body = await request.json()
    const { action, entry, path } = body

    await ensureBucket()

    if (action === "presign") {
      if (!path) {
        return NextResponse.json({ error: "path é obrigatório" }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .createSignedUploadUrl(path)
      if (error) throw error
      return NextResponse.json({ data })
    }

    if (action === "register" && entry) {
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
        description: `Arquivo ${dbEntry.name} enviado por ${auth.email}`,
        player_name: "",
        player_code: "",
        user: auth.email,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({ data: dbEntry })
    }

    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
