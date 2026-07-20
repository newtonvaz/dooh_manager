import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, version, ip, storageUsed, totalStorage, storageFree, electronVersion, publicIp } = body

    if (!code) {
      return NextResponse.json({ error: "Código do player é obrigatório" }, { status: 400 })
    }

    const deviceInfo = {
      version: version || undefined,
      ip: ip || undefined,
      storageUsed: storageUsed !== undefined ? Number(storageUsed) : undefined,
      totalStorage: totalStorage !== undefined ? Number(totalStorage) : undefined,
      storageFree: storageFree !== undefined ? Number(storageFree) : undefined,
      electronVersion: electronVersion || undefined,
      publicIp: publicIp || undefined,
    }

    const hasDeviceInfo = Object.values(deviceInfo).some(v => v !== undefined)
    const player = await dbAdmin.recordHeartbeatByCode(code, hasDeviceInfo ? deviceInfo : undefined)

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
