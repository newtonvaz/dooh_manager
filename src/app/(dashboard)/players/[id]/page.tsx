"use client"

import { usePlayer } from "@/hooks/use-players"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayerStatusBadge } from "@/components/players/player-status-badge"
import dynamic from "next/dynamic"

const PlayerPlaylistEditor = dynamic(() => import("@/components/players/player-playlist-editor").then((m) => ({ default: m.PlayerPlaylistEditor })), { ssr: false })
const PlayerScheduleSection = dynamic(() => import("@/components/players/player-schedule-section").then((m) => ({ default: m.PlayerScheduleSection })), { ssr: false })
const DeviceInfoSection = dynamic(() => import("@/components/players/device-info-section").then((m) => ({ default: m.DeviceInfoSection })), { ssr: false })
import { ArrowLeft, Monitor, HardDrive, Wifi, Calendar } from "lucide-react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PlayerDetailPage() {
  const params = useParams()
  const { data: player, isLoading } = usePlayer(params.id as string)

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  if (!player) {
    return <div className="text-muted-foreground">Player não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/players">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{player.code}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Wifi className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PlayerStatusBadge status={player.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Grupo</CardTitle>
            <Monitor className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{player.group}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
            <HardDrive className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {player.totalStorage > 0
                ? `${(player.totalStorage / 1024 / 1024 / 1024).toFixed(1)} GB`
                : "Indefinido"}
            </p>
            {player.storageUsed != null && player.totalStorage > 0 && (
              <p className="text-xs text-muted-foreground">
                {((player.storageUsed / player.totalStorage) * 100).toFixed(0)}% utilizado
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Criado em</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {format(new Date(player.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Informações do Player</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Versão</dt>
                <dd className="font-medium">{player.version}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">IP</dt>
                <dd className="font-medium font-mono">{player.ip}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Localização</dt>
                <dd className="font-medium">{player.location}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Última conexão</dt>
                <dd className="font-medium">
                  {format(new Date(player.lastSeen), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <PlayerPlaylistEditor
          playerId={player.id}
          currentPlaylistId={player.playlistId}
        />
      </div>

      <DeviceInfoSection player={player} />

      <PlayerScheduleSection player={player} />
    </div>
  )
}
