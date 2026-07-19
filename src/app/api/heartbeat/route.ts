import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "Código do player é obrigatório" }, { status: 400 })
    }

    const player = await dbAdmin.recordHeartbeatByCode(code)

    if (!player) {
      return NextResponse.json({ error: "Player não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: player.id,
        code: player.code,
        name: player.name,
        status: player.status,
        lastSeen: player.lastSeen,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
