"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDeviceInfo } from "@/services/device-info-service"
import type { DeviceInfo } from "@/types/device-info"
import type { Player } from "@/types/player"
import { Monitor } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Props {
  player: Player
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium font-mono">{value}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "Não disponível"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function DeviceInfoSection({ player }: Props) {
  const [electronInfo, setElectronInfo] = useState<DeviceInfo | null>(null)

  useEffect(() => {
    getDeviceInfo().then(setElectronInfo)
  }, [])

  const na = "Não disponível"

  const playerVersion = electronInfo?.playerVersion || player.version || na
  const electronVersion = electronInfo?.electronVersion || player.electronVersion || na
  const localIp = electronInfo?.localIp || player.ip || na
  const publicIp = electronInfo?.publicIp || player.publicIp || na
  const storageTotal = electronInfo?.storageTotal || player.totalStorage || 0
  const storageUsed = electronInfo?.storageUsed || player.storageUsed || 0
  const storageFree = electronInfo?.storageFree || player.storageFree || (
    player.totalStorage && player.storageUsed
      ? player.totalStorage - player.storageUsed
      : 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Monitor className="size-4" />
          Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow label="Versão do Player" value={playerVersion} />
        <InfoRow label="Versão do Electron" value={electronVersion} />
        <Separator className="my-2" />
        <InfoRow label="IP Local" value={localIp} />
        <InfoRow label="IP Público" value={publicIp} />
        <Separator className="my-2" />
        <InfoRow label="Armazenamento Total" value={formatBytes(storageTotal)} />
        <InfoRow label="Armazenamento Utilizado" value={formatBytes(storageUsed)} />
        <InfoRow label="Armazenamento Livre" value={formatBytes(storageFree)} />
      </CardContent>
    </Card>
  )
}
