import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const playerCode = body.playerCode || body.player_code || body.code || ""
    const contentId = body.contentId || body.content_id || ""
    const contentName = body.contentName || body.content_name || ""
    const contentDuration = body.contentDuration || body.content_duration || 0
    const playlistId = body.playlistId || body.playlist_id || ""
    const playlistName = body.playlistName || body.playlist_name || ""
    const startTime = body.startTime || body.start_time || ""
    const endTime = body.endTime || body.end_time || ""

    if (!playerCode || !contentId || !startTime) {
      return NextResponse.json({ error: "playerCode, contentId e startTime são obrigatórios" }, { status: 400 })
    }

    const entry = await dbAdmin.recordPlayback({
      playerCode,
      contentId,
      contentName,
      contentDuration,
      playlistId,
      playlistName,
      startTime,
      endTime: endTime || startTime,
    })

    await dbAdmin.recordHeartbeatByCode(playerCode).catch(() => {})

    return NextResponse.json({ data: entry })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Registro de playback para players Elektron",
    usage: "POST /api/playback com { playerCode, contentId, startTime }",
    relatorio: "Acesse /reports no CMS para visualizar os dados",
  })
}
