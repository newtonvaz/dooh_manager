import { NextResponse } from "next/server"
import path from "path"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { dbAdmin } from "@/lib/db"
import type { MediaType } from "@/types/content"

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"])
const VIDEO_EXTS = new Set([".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"])

function detectType(ext: string): MediaType {
  if (IMAGE_EXTS.has(ext)) return "image"
  if (VIDEO_EXTS.has(ext)) return "video"
  return "web"
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const created: any[] = []

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()
      const type = detectType(ext)
      const timestamp = Date.now()
      const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`

      const buffer = Buffer.from(await file.arrayBuffer())
      const sizeMB = Math.round((buffer.length / (1024 * 1024)) * 100) / 100

      const { error: uploadError } = await supabaseAdmin.storage
        .from("uploads")
        .upload(safeName, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabaseAdmin.storage.from("uploads").getPublicUrl(safeName)
      const publicUrl = urlData?.publicUrl || `/uploads/${safeName}`

      const entry = {
        id: `c${timestamp}`,
        name: file.name.replace(ext, ""),
        type,
        url: publicUrl,
        thumbnail_url: type === "image" ? publicUrl : null,
        size: sizeMB,
        duration: type === "video" ? 30 : null,
        category: "Geral",
        tags: JSON.stringify([type]),
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabaseAdmin.from("content").insert(entry)
      if (insertError) throw insertError

      created.push(entry)
    }

    for (const item of created) {
      await supabaseAdmin.from("activities").insert({
        id: `act${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        type: "upload",
        description: `Arquivo ${item.name} enviado para o CMS`,
        player_name: "",
        player_code: "",
        user: "Sistema",
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ data: created })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
