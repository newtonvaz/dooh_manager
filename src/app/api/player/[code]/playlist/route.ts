import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"

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

    const response: any = {
      player: { id: player.id, name: player.name, code: player.code },
      areas: [],
      items: [],
    }

    if (!player.layoutId) {
      const resolved = await dbAdmin.resolvePlayerPlaylist(code)
      response.items = resolved?.items || []
      return NextResponse.json(response)
    }

    const layout = await dbAdmin.getLayout(player.layoutId)
    if (!layout || !layout.zones || layout.zones.length === 0) {
      const resolved = await dbAdmin.resolvePlayerPlaylist(code)
      response.items = resolved?.items || []
      return NextResponse.json(response)
    }

    const resolved = await dbAdmin.resolvePlayerPlaylist(code)
    const resolvedContentItems = resolved?.items || []

    const resolvedAreas = layout.zones.map((zone: any) => {
      const config = (zone.config || {}) as Record<string, any>
      return {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        zIndex: zone.zIndex,
        config,
        items: zone.type === "content" ? resolvedContentItems : [],
      }
    })

    response.areas = resolvedAreas
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
