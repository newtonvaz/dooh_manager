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

    const resolvedAreas = await Promise.all(
      layout.zones.map(async (zone: any) => {
        const config = typeof zone.config === "string" ? JSON.parse(zone.config) : zone.config || {}
        let items: any[] = []

        if (zone.type === "content") {
          if (zone.contentId) {
            const content = await dbAdmin.getContentById(zone.contentId)
            if (content) {
              items.push({
                type: content.type === "video" ? "video" : content.type === "web" ? "html5" : "image",
                url: content.url,
                name: content.name,
                duration: content.duration || 10,
                contentId: content.id,
              })
            }
          } else if (config.playerId) {
            const resolved = await dbAdmin.resolvePlayerPlaylistById(config.playerId)
            items = resolved?.items || []
          }
        }

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
          items,
        }
      })
    )

    response.areas = resolvedAreas
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
