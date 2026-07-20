"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDeviceInfo } from "@/services/device-info-service"
import type { DeviceInfo } from "@/types/device-info"
import { Monitor } from "lucide-react"
import { Separator } from "@/components/ui/separator"

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

export function DeviceInfoSection() {
  const [info, setInfo] = useState<DeviceInfo | null>(null)

  useEffect(() => {
    getDeviceInfo().then(setInfo)
  }, [])

  const na = "Não disponível"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Monitor className="size-4" />
          Informações do Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow label="Versão do Player" value={info?.playerVersion || na} />
        <InfoRow label="Versão do Electron" value={info?.electronVersion || na} />
        <Separator className="my-2" />
        <InfoRow label="IP Local" value={info?.localIp || na} />
        <InfoRow label="IP Público" value={info?.publicIp || na} />
        <Separator className="my-2" />
        <InfoRow label="Armazenamento Total" value={info ? formatBytes(info.storageTotal) : na} />
        <InfoRow label="Armazenamento Utilizado" value={info ? formatBytes(info.storageUsed) : na} />
        <InfoRow label="Armazenamento Livre" value={info ? formatBytes(info.storageFree) : na} />
      </CardContent>
    </Card>
  )
}
