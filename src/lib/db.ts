import { supabase } from "./supabase"
import { supabaseAdmin } from "./supabase-admin"
import type { Player } from "@/types/player"
import type { MediaContent, Playlist } from "@/types/content"
import type { OperatingSchedule, TimeSlot } from "@/types/schedule"
import type { ContentReportQuery, ContentReportRow, PlaybackLog } from "@/types/playback"
import type { SupabaseClient } from "@supabase/supabase-js"

interface Group {
  id: string
  name: string
  createdAt: string
}

const HEARTBEAT_TIMEOUT = 120 * 1000

function getClient(client?: SupabaseClient) {
  return client || supabase
}

function toISO(d: string | Date): string {
  return typeof d === "string" ? d : d.toISOString()
}

async function recordActivity(client: SupabaseClient, entry: {
  type: string
  description: string
  playerName?: string
  playerCode?: string
}) {
  await client.from("activities").insert({
    id: `act${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    type: entry.type,
    description: entry.description,
    player_name: entry.playerName || "",
    player_code: entry.playerCode || "",
    user: "Sistema",
    timestamp: new Date().toISOString(),
  }).then()
  try { await client.rpc("delete_old_activities", { keep_count: 100 }) } catch {}
}

function createDb(client?: SupabaseClient) {
  const c = getClient(client)

  return {
    // Players
    async markOfflinePlayers(): Promise<void> {
      const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT).toISOString()
      const { data: stalePlayers } = await c
        .from("players")
        .select("id, name, code")
        .eq("status", "online")
        .lt("last_seen", cutoff)

      if (stalePlayers && stalePlayers.length > 0) {
        const ids = stalePlayers.map((p: any) => p.id)
        await c.from("players").update({ status: "offline" }).in("id", ids)
        for (const player of stalePlayers) {
          recordActivity(c, {
            type: "offline",
            description: `${player.name} está offline`,
            playerName: player.name,
            playerCode: player.code,
          })
        }
      }
    },

    async getPlayers(): Promise<Player[]> {
      await this.markOfflinePlayers()
      const { data, error } = await c.from("players").select("*").order("name")
      if (error) throw error
      return (data || []).map(mapPlayer)
    },

    async getPlayer(id: string): Promise<Player | undefined> {
      await this.markOfflinePlayers()
      const { data, error } = await c.from("players").select("*").eq("id", id).single()
      if (error) return undefined
      return mapPlayer(data)
    },

    async recordHeartbeat(id: string): Promise<Player | undefined> {
      const { data: player } = await c.from("players").select("*").eq("id", id).single()
      if (!player) return undefined

      const wasOffline = player.status === "offline" || player.status === "never"
      const now = new Date().toISOString()

      const { data, error } = await c
        .from("players")
        .update({ status: "online", last_seen: now })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      if (wasOffline && data) {
        recordActivity(c, {
          type: "online",
          description: `${data.name} está online`,
          playerName: data.name,
          playerCode: data.code,
        })
      }
      return data ? mapPlayer(data) : undefined
    },

    async createPlayer(data: Omit<Player, "id" | "code" | "status" | "lastSeen" | "createdAt" | "storageUsed" | "totalStorage" | "version" | "ip">): Promise<Player> {
      function generateCode(): string {
        const letters = Array.from({ length: 4 }, () =>
          String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join("")
        const numbers = String(Math.floor(Math.random() * 100001)).padStart(6, "0")
        return `${letters}-${numbers}`
      }

      let code = generateCode()
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data: existing } = await c.from("players").select("id").eq("code", code).maybeSingle()
        if (!existing) break
        code = generateCode()
      }

      const player = {
        id: String(Date.now()),
        code,
        status: "never",
        last_seen: new Date(0).toISOString(),
        storage_used: 0,
        total_storage: 32,
        version: "2.1.0",
        ip: "0.0.0.0",
        created_at: new Date().toISOString(),
        name: data.name,
        group: data.group,
        location: data.location,
      }
      const { data: created, error } = await c.from("players").insert(player).select().single()
      if (error) throw error
      recordActivity(c, { type: "player", description: `Player ${data.name} criado`, playerName: data.name, playerCode: created.code })
      return mapPlayer(created)
    },

    async updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.group !== undefined) update.group = data.group
      if (data.location !== undefined) update.location = data.location
      if (data.playlistId !== undefined) update.playlist_id = data.playlistId || null

      const { data: updated, error } = await c.from("players").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapPlayer(updated)
    },

    async deletePlayer(id: string): Promise<boolean> {
      const { data: player } = await c.from("players").select("name, code").eq("id", id).single()
      const { error } = await c.from("players").delete().eq("id", id)
      if (error) return false
      if (player) recordActivity(c, { type: "delete", description: `Player ${player.name} excluído`, playerName: player.name, playerCode: player.code })
      return true
    },

    async deleteMultiplePlayers(ids: string[]): Promise<boolean> {
      const { error } = await c.from("players").delete().in("id", ids)
      if (error) return false
      recordActivity(c, { type: "delete", description: `${ids.length} players excluídos` })
      return true
    },

    async deleteAllPlayers(): Promise<boolean> {
      const { error } = await c.from("players").delete().neq("id", "")
      if (error) return false
      recordActivity(c, { type: "delete", description: "Todos os players excluídos" })
      return true
    },

    async assignPlaylist(playerId: string, playlistId: string | null): Promise<Player | undefined> {
      const { data, error } = await c
        .from("players")
        .update({ playlist_id: playlistId || null })
        .eq("id", playerId)
        .select()
        .single()
      if (error) return undefined
      return mapPlayer(data)
    },

    // Playlists
    async getPlaylists(): Promise<Playlist[]> {
      const { data, error } = await c.from("playlists").select("*").order("order")
      if (error) throw error
      return (data || []).map(mapPlaylist)
    },

    async getPlaylist(id: string): Promise<Playlist | undefined> {
      const { data, error } = await c.from("playlists").select("*").eq("id", id).single()
      if (error) return undefined
      return mapPlaylist(data)
    },

    async createPlaylist(data: Omit<Playlist, "id" | "order" | "createdAt" | "updatedAt" | "totalDuration">): Promise<Playlist> {
      const { data: maxOrder } = await c
        .from("playlists")
        .select("order")
        .order("order", { ascending: false })
        .limit(1)

      const order = maxOrder && maxOrder.length > 0 ? maxOrder[0].order + 1 : 0
      const now = new Date().toISOString()

      const playlist = {
        id: `pl${Date.now()}`,
        order,
        created_at: now,
        updated_at: now,
        total_duration: data.items.reduce((sum, item) => sum + item.duration, 0),
        name: data.name,
        category: data.category || "",
        description: data.description || "",
        items: JSON.stringify(data.items),
        is_subplaylist: data.isSubplaylist || false,
      }
      const { data: created, error } = await c.from("playlists").insert(playlist).select().single()
      if (error) throw error
      recordActivity(c, { type: "playlist", description: `Playlist ${data.name} criada` })
      return mapPlaylist(created)
    },

    async reorderPlaylists(orderedIds: string[]): Promise<boolean> {
      for (let i = 0; i < orderedIds.length; i++) {
        await c.from("playlists").update({ order: i }).eq("id", orderedIds[i])
      }
      return true
    },

    async updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.category !== undefined) update.category = data.category
      if (data.description !== undefined) update.description = data.description
      if (data.isSubplaylist !== undefined) update.is_subplaylist = data.isSubplaylist
      if (data.items !== undefined) {
        update.items = JSON.stringify(data.items)
        update.total_duration = data.items.reduce((sum, item) => sum + item.duration, 0)
      }
      update.updated_at = new Date().toISOString()

      const { data: updated, error } = await c.from("playlists").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapPlaylist(updated)
    },

    async addContentToPlaylist(playlistId: string, contentId: string, duration: number): Promise<Playlist | undefined> {
      const { data: playlist } = await c.from("playlists").select("*").eq("id", playlistId).single()
      if (!playlist) return undefined

      const items = typeof playlist.items === "string" ? JSON.parse(playlist.items) : playlist.items
      if (!items.find((i: any) => i.type === "content" && i.contentId === contentId)) {
        items.push({ type: "content", contentId, duration })
        const totalDuration = items.reduce((s: number, i: any) => s + i.duration, 0)
        const { data: updated, error } = await c
          .from("playlists")
          .update({ items: JSON.stringify(items), total_duration: totalDuration, updated_at: new Date().toISOString() })
          .eq("id", playlistId)
          .select()
          .single()
        if (error) return undefined
        return mapPlaylist(updated)
      }
      return mapPlaylist(playlist)
    },

    async removeContentFromPlaylist(playlistId: string, contentId: string): Promise<Playlist | undefined> {
      const { data: playlist } = await c.from("playlists").select("*").eq("id", playlistId).single()
      if (!playlist) return undefined

      const items = typeof playlist.items === "string" ? JSON.parse(playlist.items) : playlist.items
      const removed = items.find((i: any) => i.type === "content" && i.contentId === contentId)
      const filtered = items.filter((i: any) => !(i.type === "content" && i.contentId === contentId))
      const totalDuration = filtered.reduce((s: number, i: any) => s + i.duration, 0)

      const { data: updated, error } = await c
        .from("playlists")
        .update({ items: JSON.stringify(filtered), total_duration: totalDuration, updated_at: new Date().toISOString() })
        .eq("id", playlistId)
        .select()
        .single()
      if (error) return undefined
      return mapPlaylist(updated)
    },

    async deletePlaylist(id: string): Promise<boolean> {
      const { data: pl } = await c.from("playlists").select("name").eq("id", id).single()
      const { error } = await c.from("playlists").delete().eq("id", id)
      if (error) return false
      if (pl) recordActivity(c, { type: "delete", description: `Playlist ${pl.name} excluída` })
      return true
    },

    async deleteMultiplePlaylists(ids: string[]): Promise<boolean> {
      const { error } = await c.from("playlists").delete().in("id", ids)
      if (error) return false
      recordActivity(c, { type: "delete", description: `${ids.length} playlists excluídas` })
      return true
    },

    async deleteAllPlaylists(): Promise<boolean> {
      const { error } = await c.from("playlists").delete().neq("id", "")
      if (error) return false
      recordActivity(c, { type: "delete", description: "Todas as playlists excluídas" })
      return true
    },

    // Content
    async getContent(): Promise<MediaContent[]> {
      const { data, error } = await c.from("content").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map(mapContent)
    },

    async getContentById(id: string): Promise<MediaContent | undefined> {
      const { data, error } = await c.from("content").select("*").eq("id", id).single()
      if (error) return undefined
      return data ? mapContent(data) : undefined
    },

    async updateContent(id: string, data: Partial<MediaContent>): Promise<MediaContent | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.category !== undefined) update.category = data.category
      if (data.tags !== undefined) update.tags = JSON.stringify(data.tags)

      const { data: updated, error } = await c.from("content").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapContent(updated)
    },

    async deleteContent(id: string): Promise<boolean> {
      const { data: content } = await c.from("content").select("name").eq("id", id).single()
      const { error } = await c.from("content").delete().eq("id", id)
      if (error) return false
      if (content) recordActivity(c, { type: "delete", description: `Arquivo ${content.name} excluído do CMS` })
      return true
    },

    async deleteMultipleContent(ids: string[]): Promise<boolean> {
      const { error } = await c.from("content").delete().in("id", ids)
      if (error) return false
      recordActivity(c, { type: "delete", description: `${ids.length} arquivos excluídos do CMS` })
      return true
    },

    async deleteAllContent(): Promise<boolean> {
      const { error } = await c.from("content").delete().neq("id", "")
      if (error) return false
      recordActivity(c, { type: "delete", description: "Todos os arquivos excluídos do CMS" })
      return true
    },

    // Groups
    async getGroups(): Promise<Group[]> {
      const { data, error } = await c.from("groups").select("*").order("name")
      if (error) throw error
      return (data || []).map(mapGroup)
    },

    async createGroup(name: string): Promise<Group> {
      const group = { id: `g${Date.now()}`, name, created_at: new Date().toISOString() }
      const { data, error } = await c.from("groups").insert(group).select().single()
      if (error) throw error
      return mapGroup(data)
    },

    async updateGroup(id: string, name: string): Promise<Group | undefined> {
      const { data, error } = await c.from("groups").update({ name }).eq("id", id).select().single()
      if (error) return undefined
      return mapGroup(data)
    },

    async deleteGroup(id: string): Promise<boolean> {
      const { error } = await c.from("groups").delete().eq("id", id)
      return !error
    },

    async deleteMultipleGroups(ids: string[]): Promise<boolean> {
      const { error } = await c.from("groups").delete().in("id", ids)
      return !error
    },

    async deleteAllGroups(): Promise<boolean> {
      const { error } = await c.from("groups").delete().neq("id", "")
      return !error
    },

    // Categories
    async getCategories(): Promise<Group[]> {
      const { data, error } = await c.from("categories").select("*").order("name")
      if (error) throw error
      return (data || []).map(mapGroup)
    },

    async createCategory(name: string): Promise<Group> {
      const cat = { id: `cat${Date.now()}`, name, created_at: new Date().toISOString() }
      const { data, error } = await c.from("categories").insert(cat).select().single()
      if (error) throw error
      return mapGroup(data)
    },

    async updateCategory(id: string, name: string): Promise<Group | undefined> {
      const { data, error } = await c.from("categories").update({ name }).eq("id", id).select().single()
      if (error) return undefined
      return mapGroup(data)
    },

    async deleteCategory(id: string): Promise<boolean> {
      const { error } = await c.from("categories").delete().eq("id", id)
      return !error
    },

    async deleteMultipleCategories(ids: string[]): Promise<boolean> {
      const { error } = await c.from("categories").delete().in("id", ids)
      return !error
    },

    async deleteAllCategories(): Promise<boolean> {
      const { error } = await c.from("categories").delete().neq("id", "")
      return !error
    },

    // Derived
    async getDashboardStats() {
      await this.markOfflinePlayers()
      const [players, content, playlists] = await Promise.all([
        c.from("players").select("status, total_storage, storage_used"),
        c.from("content").select("id", { count: "exact", head: true }),
        c.from("playlists").select("id", { count: "exact", head: true }),
      ])

      const allPlayers = players.data || []
      const online = allPlayers.filter((p: any) => p.status === "online").length
      const offline = allPlayers.filter((p: any) => p.status === "offline").length
      const never = allPlayers.filter((p: any) => p.status === "never").length

      return {
        totalPlayers: allPlayers.length,
        onlinePlayers: online,
        offlinePlayers: offline,
        neverPlayers: never,
        totalContent: content.count || 0,
        totalPlaylists: playlists.count || 0,
        storageUsed: Math.round(allPlayers.reduce((s: number, p: any) => s + (p.storage_used || 0), 0) * 10) / 10,
        storageTotal: allPlayers.reduce((s: number, p: any) => s + (p.total_storage || 0), 0),
      }
    },

    async getPlayerByCode(code: string): Promise<Player | undefined> {
      const { data, error } = await c.from("players").select("*").eq("code", code).single()
      if (error) return undefined
      return mapPlayer(data)
    },

    async recordHeartbeatByCode(code: string): Promise<Player | undefined> {
      const player = await this.getPlayerByCode(code)
      if (!player) return undefined
      return this.recordHeartbeat(player.id)
    },

    async resolvePlayerPlaylist(code: string) {
      const player = await this.getPlayerByCode(code)
      if (!player) return null

      const playlistId = player.playlistId
      if (!playlistId) return { player, playlist: null, items: [], schedule: null }

      const playlist = await this.getPlaylist(playlistId)
      if (!playlist) return { player, playlist: null, items: [], schedule: null }

      const [playerSchedules, groupSchedules] = await Promise.all([
        this.getSchedulesByTarget("player", player.id),
        this.getSchedulesByTarget("group", player.group),
      ])

      const schedule = playerSchedules[0] || groupSchedules[0] || null

      const items: any[] = []
      for (const item of playlist.items) {
        if (item.type === "content" && item.contentId) {
          const content = await this.getContentById(item.contentId)
          if (content) {
            items.push({
              type: content.type === "video" ? "video" : content.type === "web" ? "html5" : "image",
              url: content.url,
              name: content.name,
              duration: item.duration || content.duration || 10,
              contentId: content.id,
            })
          }
        } else if (item.type === "playlist" && item.playlistId) {
          const subPlaylist = await this.getPlaylist(item.playlistId)
          if (subPlaylist) {
            for (const subItem of subPlaylist.items) {
              if (subItem.type === "content" && subItem.contentId) {
                const content = await this.getContentById(subItem.contentId)
                if (content) {
                  items.push({
                    type: content.type === "video" ? "video" : content.type === "web" ? "html5" : "image",
                    url: content.url,
                    name: content.name,
                    duration: subItem.duration || content.duration || 10,
                    contentId: content.id,
                  })
                }
              }
            }
          }
        }
      }

      const scheduleVersion = schedule?.updatedAt ?? null
      const playlistUpdatedAt = playlist.updatedAt

      const assets = items.map((item) => ({
        contentId: item.contentId,
        url: item.url,
        type: item.type,
        name: item.name,
      }))

      return { player, playlist, items, assets, schedule, scheduleVersion, playlistUpdatedAt }
    },

    async getRecentActivities() {
      const { data, error } = await c
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)
      if (error) throw error
      return data || []
    },

    async recordPlayback(data: {
      playerCode: string
      contentId: string
      contentName: string
      contentDuration: number
      playlistId: string
      playlistName: string
      startTime: string
      endTime: string
    }) {
      const { data: player } = await c.from("players").select("id, name").eq("code", data.playerCode).single()

      const entry = {
        id: `plog_${Date.now()}`,
        content_id: data.contentId,
        content_name: data.contentName,
        content_duration: data.contentDuration,
        player_id: player?.id || data.playerCode,
        player_name: player?.name || data.playerCode,
        playlist_id: data.playlistId,
        playlist_name: data.playlistName,
        start_time: data.startTime,
        end_time: data.endTime,
        date: data.startTime.slice(0, 10),
      }

      const { error } = await c.from("playback_logs").insert(entry)
      if (error) throw error
      return entry
    },

    async getContentReport(query: ContentReportQuery): Promise<ContentReportRow[]> {
      let q = c.from("playback_logs").select("*")

      if (query.dateFrom) {
        q = q.gte("date", query.dateFrom)
      }
      if (query.dateTo) {
        q = q.lte("date", query.dateTo)
      }
      if (query.contentIds && query.contentIds.length > 0) {
        q = q.in("content_id", query.contentIds)
      } else if (query.contentName) {
        q = q.ilike("content_name", `%${query.contentName}%`)
      }

      const { data: log, error } = await q.order("date").order("player_name")
      if (error) throw error

      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
      const grouped = new Map<string, ContentReportRow & { _playerId: string }>()

      for (const entry of log || []) {
        const key = `${entry.date}|${entry.content_id}|${entry.player_id}`
        if (grouped.has(key)) {
          grouped.get(key)!.insertions++
        } else {
          grouped.set(key, {
            date: entry.date,
            dayOfWeek: dayNames[new Date(entry.date + "T00:00:00").getDay()],
            contentName: entry.content_name,
            contentDuration: entry.content_duration,
            insertions: 1,
            playerName: entry.player_name,
            playerCode: "",
            playlistName: entry.playlist_name || "",
            _playerId: entry.player_id,
          })
        }
      }

      return Array.from(grouped.values())
        .sort((a, b) => a.date.localeCompare(b.date) || a.playerName.localeCompare(b.playerName))
        .map(({ _playerId, ...row }) => row)
    },

    // Schedules
    async getSchedules(): Promise<OperatingSchedule[]> {
      const { data, error } = await c.from("schedules").select("*").order("name")
      if (error) throw error
      return (data || []).map(mapSchedule)
    },

    async getSchedule(id: string): Promise<OperatingSchedule | undefined> {
      const { data, error } = await c.from("schedules").select("*").eq("id", id).single()
      if (error) return undefined
      return data ? mapSchedule(data) : undefined
    },

    async getSchedulesByTarget(type: string, targetId: string): Promise<OperatingSchedule[]> {
      const { data, error } = await c
        .from("schedules")
        .select("*")
        .eq("type", type)
        .eq("target_id", targetId)
      if (error) throw error
      return (data || []).map(mapSchedule)
    },

    async createSchedule(data: Omit<OperatingSchedule, "id" | "createdAt" | "updatedAt">): Promise<OperatingSchedule> {
      const now = new Date().toISOString()
      const schedule = {
        id: `sch${Date.now()}`,
        created_at: now,
        updated_at: now,
        name: data.name,
        type: data.type,
        target_id: data.targetId,
        target_name: data.targetName || "",
        time_slots: JSON.stringify(data.timeSlots),
        enabled: data.enabled,
        replicated_from_group: data.replicatedFromGroup || null,
      }
      const { data: created, error } = await c.from("schedules").insert(schedule).select().single()
      if (error) throw error
      return mapSchedule(created)
    },

    async updateSchedule(id: string, data: Partial<OperatingSchedule>): Promise<OperatingSchedule | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.type !== undefined) update.type = data.type
      if (data.targetId !== undefined) update.target_id = data.targetId
      if (data.targetName !== undefined) update.target_name = data.targetName
      if (data.timeSlots !== undefined) update.time_slots = JSON.stringify(data.timeSlots)
      if (data.enabled !== undefined) update.enabled = data.enabled
      if (data.replicatedFromGroup !== undefined) update.replicated_from_group = data.replicatedFromGroup
      update.updated_at = new Date().toISOString()

      const { data: updated, error } = await c.from("schedules").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapSchedule(updated)
    },

    async deleteSchedule(id: string): Promise<boolean> {
      const { error } = await c.from("schedules").delete().eq("id", id)
      return !error
    },
  }
}

// Default export for client-side (uses anon key)
export const db = createDb()

// Server-side export (uses service role key)
export const dbAdmin = createDb(supabaseAdmin)

// Mappers convert snake_case DB columns to camelCase TypeScript types
function mapPlayer(data: any): Player {
  return {
    id: data.id,
    name: data.name || "",
    code: data.code,
    status: data.status,
    group: data.group || "",
    location: data.location || "",
    lastSeen: data.last_seen,
    storageUsed: data.storage_used || 0,
    totalStorage: data.total_storage || 32,
    version: data.version || "2.1.0",
    ip: data.ip || "0.0.0.0",
    playlistId: data.playlist_id || undefined,
    createdAt: data.created_at,
  }
}

function mapContent(data: any): MediaContent {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    url: data.url,
    thumbnailUrl: data.thumbnail_url || undefined,
    size: data.size || 0,
    duration: data.duration || undefined,
    category: data.category || "",
    tags: typeof data.tags === "string" ? JSON.parse(data.tags) : data.tags || [],
    createdAt: data.created_at,
  }
}

function mapPlaylist(data: any): Playlist {
  const items = typeof data.items === "string" ? JSON.parse(data.items) : data.items || []
  return {
    id: data.id,
    name: data.name,
    category: data.category || "",
    description: data.description || "",
    items,
    totalDuration: data.total_duration || 0,
    order: data.order || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isSubplaylist: data.is_subplaylist || false,
  }
}

function mapSchedule(data: any): OperatingSchedule {
  const timeSlots = typeof data.time_slots === "string" ? JSON.parse(data.time_slots) : data.time_slots || []
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    targetId: data.target_id,
    targetName: data.target_name || "",
    timeSlots,
    enabled: data.enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    replicatedFromGroup: data.replicated_from_group || undefined,
  }
}

function mapGroup(data: any): Group {
  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  }
}
