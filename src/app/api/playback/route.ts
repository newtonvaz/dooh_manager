import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { playerCode, contentId, contentName, contentDuration, playlistId, playlistName, startTime, endTime } = body

    if (!playerCode || !contentId || !startTime) {
      return NextResponse.json({ error: "playerCode, contentId e startTime são obrigatórios" }, { status: 400 })
    }

    const entry = await dbAdmin.recordPlayback({
      playerCode,
      contentId,
      contentName: contentName || "",
      contentDuration: contentDuration || 0,
      playlistId: playlistId || "",
      playlistName: playlistName || "",
      startTime,
      endTime: endTime || startTime,
    })

    return NextResponse.json({ data: entry })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
