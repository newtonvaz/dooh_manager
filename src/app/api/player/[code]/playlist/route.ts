import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const player = await dbAdmin.getPlayerByCode(code)
    if (!player) {
      return NextResponse.json({ error: "Player não encontrado" }, { status: 404 })
    }

    if (!player.layoutId) {
      return NextResponse.json({
        player: { id: player.id, name: player.name, code: player.code },
        areas: [],
      })
    }

    const areas = await dbAdmin.getLayoutAreas(player.layoutId)

    const resolvedAreas = await Promise.all(
      areas.map(async (area: any) => {
        const config = typeof area.config === "string" ? JSON.parse(area.config) : area.config || {}
        let items: any[] = []

        if (area.type === "content" && config.playerId) {
          const resolved = await dbAdmin.resolvePlayerPlaylistById(config.playerId)
          items = resolved?.items || []
        }

        return {
          id: area.id,
          name: area.name,
          type: area.type,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          zIndex: area.z_index,
          config,
          items,
        }
      })
    )

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        code: player.code,
      },
      areas: resolvedAreas,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
