import { supabase } from "./supabase"
import { supabaseAdmin } from "./supabase-admin"
import type { Player } from "@/types/player"
import type { MediaContent, Playlist } from "@/types/content"
import type { OperatingSchedule, TimeSlot } from "@/types/schedule"
import type { ProgrammingGroup } from "@/types/programming-group"
import type { ContentReportQuery, ContentReportRow, PlaybackLog, PlaybackLogRow } from "@/types/playback"
import type { Layout, LayoutArea, LayoutAreaConfig, LayoutZone } from "@/types/layout"
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

    async recordHeartbeat(id: string, deviceInfo?: {
      version?: string
      ip?: string
      storageUsed?: number
      totalStorage?: number
      storageFree?: number
      electronVersion?: string
      publicIp?: string
    }): Promise<Player | undefined> {
      const { data: player } = await c.from("players").select("*").eq("id", id).single()
      if (!player) return undefined

      const wasOffline = player.status === "offline" || player.status === "never"
      const now = new Date().toISOString()

      async function doUpdate(fields: Record<string, any>) {
        const base: Record<string, any> = { status: "online", last_seen: now }
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) base[key] = value
        }
        const { data, error } = await c.from("players").update(base).eq("id", id).select().single()
        if (error) throw error
        return data
      }

      let data: any
      try {
        data = await doUpdate({
          version: deviceInfo?.version,
          ip: deviceInfo?.ip,
          storage_used: deviceInfo?.storageUsed,
          total_storage: deviceInfo?.totalStorage,
          storage_free: deviceInfo?.storageFree,
          electron_version: deviceInfo?.electronVersion || undefined,
          public_ip: deviceInfo?.publicIp || undefined,
        })
      } catch {
        // columns may not exist yet — retry without the new fields
        data = await doUpdate({
          version: deviceInfo?.version,
          ip: deviceInfo?.ip,
          storage_used: deviceInfo?.storageUsed,
          total_storage: deviceInfo?.totalStorage,
        })
      }

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
        total_storage: 34359738368,
        version: "2.1.0",
        ip: "0.0.0.0",
        created_at: new Date().toISOString(),
        name: data.name,
        group: data.group,
        location: data.location,
        layout_id: data.layoutId || null,
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
      if (data.layoutId !== undefined) update.layout_id = data.layoutId || null

      const { data: updated, error } = await c.from("players").update(update).eq("id", id).select().single()
      if (error) throw error
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

    async addContentToPlaylist(playlistId: string, contentId: string, duration: number, timeSlots?: any[]): Promise<Playlist | undefined> {
      const { data: playlist } = await c.from("playlists").select("*").eq("id", playlistId).single()
      if (!playlist) return undefined

      const items = typeof playlist.items === "string" ? JSON.parse(playlist.items) : playlist.items
      if (!items.find((i: any) => i.type === "content" && i.contentId === contentId)) {
        const entry: any = { type: "content", contentId, duration }
        if (timeSlots && timeSlots.length > 0) entry.timeSlots = timeSlots
        items.push(entry)
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

    async addUrlToPlaylist(playlistId: string, url: string, duration: number): Promise<Playlist> {
      const { data: playlist } = await c.from("playlists").select("*").eq("id", playlistId).single()
      if (!playlist) throw new Error("Playlist não encontrada")

      const normalized = url.match(/^https?:\/\//i) ? url : `https://${url}`
      const items = typeof playlist.items === "string" ? JSON.parse(playlist.items) : playlist.items
      items.push({ type: "url", url: normalized, duration, name: normalized })
      const totalDuration = items.reduce((s: number, i: any) => s + i.duration, 0)

      const { data: updated, error } = await c
        .from("playlists")
        .update({ items: JSON.stringify(items), total_duration: totalDuration, updated_at: new Date().toISOString() })
        .eq("id", playlistId)
        .select()
        .single()
      if (error) throw error
      return mapPlaylist(updated)
    },

    async removeUrlFromPlaylist(playlistId: string, url: string): Promise<Playlist> {
      const { data: playlist } = await c.from("playlists").select("*").eq("id", playlistId).single()
      if (!playlist) throw new Error("Playlist não encontrada")

      const items = typeof playlist.items === "string" ? JSON.parse(playlist.items) : playlist.items
      let removed = false
      const filtered = items.filter((i: any) => {
        if (i.type === "url" && i.url === url && !removed) {
          removed = true
          return false
        }
        return true
      })
      const totalDuration = filtered.reduce((s: number, i: any) => s + i.duration, 0)

      const { data: updated, error } = await c
        .from("playlists")
        .update({ items: JSON.stringify(filtered), total_duration: totalDuration, updated_at: new Date().toISOString() })
        .eq("id", playlistId)
        .select()
        .single()
      if (error) throw error
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

    // Programming Groups
    async getProgrammingGroups(): Promise<ProgrammingGroup[]> {
      const { data, error } = await c.from("programming_groups").select("*").order("name")
      if (error) throw error
      const groups = (data || []).map(mapProgrammingGroup)

      for (const group of groups) {
        const { count } = await c
          .from("programming_group_players")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)
        group.playerCount = count ?? 0
      }
      return groups
    },

    async getProgrammingGroup(id: string): Promise<ProgrammingGroup | undefined> {
      const { data, error } = await c.from("programming_groups").select("*").eq("id", id).single()
      if (error) return undefined
      const group = mapProgrammingGroup(data)

      const { data: players } = await c
        .from("programming_group_players")
        .select("player_id")
        .eq("group_id", id)
      const playerIds = (players || []).map((p: any) => p.player_id)

      if (playerIds.length > 0) {
        const { data: playerData } = await c
          .from("players")
          .select("*")
          .in("id", playerIds)
          .order("name")
        group.players = (playerData || []).map(mapPlayer)
        group.playerCount = group.players.length
      } else {
        group.players = []
        group.playerCount = 0
      }
      return group
    },

    async createProgrammingGroup(data: {
      name: string
      enabled: boolean
      timeSlots: TimeSlot[]
      playerIds: string[]
    }): Promise<ProgrammingGroup> {
      const now = new Date().toISOString()
      const id = `pg_${Date.now()}`
      const group = {
        id,
        name: data.name,
        enabled: data.enabled,
        time_slots: JSON.stringify(data.timeSlots),
        created_at: now,
        updated_at: now,
      }
      const { error: insertError } = await c.from("programming_groups").insert(group)
      if (insertError) throw insertError

      if (data.playerIds.length > 0) {
        const rels = data.playerIds.map((playerId) => ({
          group_id: id,
          player_id: playerId,
          created_at: now,
        }))
        const { error: relError } = await c.from("programming_group_players").insert(rels)
        if (relError) throw relError

        await this.syncProgrammingGroupSchedules(id, data.name, data.enabled, data.timeSlots, data.playerIds)
      }

      recordActivity(c, {
        type: "programming",
        description: `Grupo de programação "${data.name}" criado com ${data.playerIds.length} player(s)`,
      })

      return { ...mapProgrammingGroup(group), playerCount: data.playerIds.length }
    },

    async updateProgrammingGroup(
      id: string,
      data: {
        name?: string
        enabled?: boolean
        timeSlots?: TimeSlot[]
        playerIds?: string[]
      }
    ): Promise<ProgrammingGroup> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.enabled !== undefined) update.enabled = data.enabled
      if (data.timeSlots !== undefined) update.time_slots = JSON.stringify(data.timeSlots)
      update.updated_at = new Date().toISOString()

      const { error: updateError } = await c.from("programming_groups").update(update).eq("id", id)
      if (updateError) throw updateError

      const timeSlots = data.timeSlots
      const enabled = data.enabled
      const name = data.name

      if (data.playerIds !== undefined) {
        const { error: deleteError } = await c.from("programming_group_players").delete().eq("group_id", id)
        if (deleteError) throw deleteError

        if (data.playerIds.length > 0) {
          const now = new Date().toISOString()
          const rels = data.playerIds.map((playerId) => ({
            group_id: id,
            player_id: playerId,
            created_at: now,
          }))
          const { error: insertError } = await c.from("programming_group_players").insert(rels)
          if (insertError) throw insertError
        }

        await this.deleteSchedulesByGroup(id)
        if (data.playerIds.length > 0) {
          const resolvedName = name || (await this.getProgrammingGroup(id))?.name || "Programação"
          const resolvedEnabled = enabled !== undefined ? enabled : true
          const resolvedTimeSlots = timeSlots || (await this.getProgrammingGroup(id))?.timeSlots || []
          await this.syncProgrammingGroupSchedules(id, resolvedName, resolvedEnabled, resolvedTimeSlots, data.playerIds)
        }
      } else if (timeSlots !== undefined || enabled !== undefined || name !== undefined) {
        const { data: schedules } = await c
          .from("schedules")
          .select("*")
          .eq("replicated_from_group", id)
        if (schedules) {
          const scheduleUpdate: Record<string, any> = {}
          if (timeSlots !== undefined) scheduleUpdate.time_slots = JSON.stringify(timeSlots)
          if (enabled !== undefined) scheduleUpdate.enabled = enabled
          if (name !== undefined) scheduleUpdate.name = name
          scheduleUpdate.updated_at = new Date().toISOString()
          for (const s of schedules) {
            await c.from("schedules").update(scheduleUpdate).eq("id", s.id)
          }
        }
      }

      recordActivity(c, {
        type: "programming",
        description: `Grupo de programação "${data.name || id}" atualizado`,
      })

      const updated = await this.getProgrammingGroup(id)
      if (!updated) throw new Error("Grupo não encontrado após atualização")
      return updated
    },

    async deleteProgrammingGroup(id: string): Promise<void> {
      const { data: group } = await c.from("programming_groups").select("name").eq("id", id).single()
      await this.deleteSchedulesByGroup(id)
      const { error } = await c.from("programming_groups").delete().eq("id", id)
      if (error) throw error
      if (group) {
        recordActivity(c, {
          type: "programming",
          description: `Grupo de programação "${group.name}" excluído`,
        })
      }
    },

    async getProgrammingGroupsByPlayer(playerId: string): Promise<ProgrammingGroup[]> {
      const { data: rels } = await c
        .from("programming_group_players")
        .select("group_id")
        .eq("player_id", playerId)
      if (!rels || rels.length === 0) return []

      const groupIds = rels.map((r: any) => r.group_id)
      const { data, error } = await c
        .from("programming_groups")
        .select("*")
        .in("id", groupIds)
        .order("updated_at", { ascending: false })
      if (error) throw error
      return (data || []).map(mapProgrammingGroup)
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

    async recordHeartbeatByCode(code: string, deviceInfo?: {
      version?: string
      ip?: string
      storageUsed?: number
      totalStorage?: number
      storageFree?: number
      electronVersion?: string
      publicIp?: string
    }): Promise<Player | undefined> {
      const player = await this.getPlayerByCode(code)
      if (!player) return undefined
      return this.recordHeartbeat(player.id, deviceInfo)
    },

    async resolvePlayerPlaylistById(playerId: string) {
      const player = await this.getPlayer(playerId)
      if (!player || !player.code) return null
      return this.resolvePlayerPlaylist(player.code)
    },

    async resolvePlayerPlaylist(code: string) {
      const player = await this.getPlayerByCode(code)
      if (!player) return null

      const playlistId = player.playlistId
      if (!playlistId) return { player, playlist: null, items: [], schedule: null }

      const playlist = await this.getPlaylist(playlistId)
      if (!playlist) return { player, playlist: null, items: [], schedule: null }

      const [programmingGroups, playerSchedules, groupSchedules] = await Promise.all([
        this.getProgrammingGroupsByPlayer(player.id),
        this.getSchedulesByTarget("player", player.id),
        this.getSchedulesByTarget("group", player.group),
      ])

      const activeProgramming = programmingGroups.find(
        (g) => g.enabled && g.timeSlots.length > 0
      )

      const schedule = activeProgramming
        ? {
            id: activeProgramming.id,
            name: activeProgramming.name,
            type: "group" as const,
            targetId: activeProgramming.id,
            targetName: activeProgramming.name,
            timeSlots: activeProgramming.timeSlots,
            enabled: activeProgramming.enabled,
            createdAt: activeProgramming.createdAt,
            updatedAt: activeProgramming.updatedAt,
          }
        : playerSchedules[0] || groupSchedules[0] || null

      const now = new Date()

      function isTimeSlotActive(timeSlots?: { startDate: string; endDate: string }[] | null): boolean {
        if (!timeSlots || timeSlots.length === 0) return true
        return timeSlots.some((s) => {
          const start = new Date(s.startDate)
          const end = new Date(s.endDate)
          return now >= start && now <= end
        })
      }

      const items: any[] = []
      for (const item of playlist.items) {
        if (item.type === "content" && item.contentId) {
          if (!isTimeSlotActive(item.timeSlots)) continue
          const content = await this.getContentById(item.contentId)
          if (content) {
            items.push({
              type: content.type === "video" ? "video" : content.type === "web" ? "html5" : "image",
              url: content.url,
              name: content.name,
              duration: item.duration || content.duration || 10,
              contentId: content.id,
              timeSlots: item.timeSlots ?? null,
            })
          }
        } else if (item.type === "playlist" && item.playlistId) {
          const subPlaylist = await this.getPlaylist(item.playlistId)
          if (subPlaylist) {
            for (const subItem of subPlaylist.items) {
              if (subItem.type === "content" && subItem.contentId) {
                if (!isTimeSlotActive(subItem.timeSlots)) continue
                const content = await this.getContentById(subItem.contentId)
                if (content) {
                  items.push({
                    type: content.type === "video" ? "video" : content.type === "web" ? "html5" : "image",
                    url: content.url,
                    name: content.name,
                    duration: subItem.duration || content.duration || 10,
                    contentId: content.id,
                    timeSlots: subItem.timeSlots ?? null,
                  })
                }
              } else if (subItem.type === "url" && subItem.url) {
                items.push({
                  type: "html5",
                  url: subItem.url,
                  name: subItem.name || subItem.url,
                  duration: subItem.duration || 30,
                  contentId: `url_${subItem.url.replace(/[\\/:*?"<>|]/g, "_").replace(/_+/g, "_")}`,
                  timeSlots: null,
                })
              }
            }
          }
        } else if (item.type === "url" && item.url) {
          items.push({
            type: "html5",
            url: item.url,
            name: item.name || item.url,
            duration: item.duration || 30,
            contentId: `url_${item.url.replace(/[\\/:*?"<>|]/g, "_").replace(/_+/g, "_")}`,
            timeSlots: item.timeSlots ?? null,
          })
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

      return {
        player,
        playlist,
        items,
        assets,
        schedule,
        scheduleVersion,
        playlistUpdatedAt,
        endpoints: {
          playback: "/api/playback",
          heartbeat: "/api/heartbeat",
        },
      }
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
      let q = c.from("playback_logs").select("content_name, date, player_name, content_duration, content_id, player_id, playlist_name")

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

    async getPlaybackLogs(
      search: string,
      dateFrom: string,
      dateTo: string
    ): Promise<PlaybackLogRow[]> {
      let q = c.from("playback_logs").select("content_name, date, player_name, content_duration")
      if (dateFrom) q = q.gte("date", dateFrom)
      if (dateTo) q = q.lte("date", dateTo)
      if (search) q = q.ilike("content_name", `%${search}%`)

      const { data, error } = await q
      if (error) throw error

      const grouped = new Map<string, PlaybackLogRow>()
      for (const e of data || []) {
        const key = `${e.date}|${e.content_name}|${e.player_name}`
        if (grouped.has(key)) {
          const g = grouped.get(key)!
          g.insertions++
          if ((e.content_duration ?? 0) > g.contentDuration) {
            g.contentDuration = e.content_duration
          }
        } else {
          grouped.set(key, {
            contentName: e.content_name,
            date: e.date,
            playerName: e.player_name,
            contentDuration: e.content_duration,
            insertions: 1,
          })
        }
      }

      return Array.from(grouped.values())
        .sort((a, b) => b.date.localeCompare(a.date) || b.contentName.localeCompare(a.contentName))
    },

    async getContentSuggestions(
      search: string,
      dateFrom: string,
      dateTo: string
    ): Promise<string[]> {
      let q = c.from("playback_logs").select("content_name")
      if (dateFrom) q = q.gte("date", dateFrom)
      if (dateTo) q = q.lte("date", dateTo)
      if (search) q = q.ilike("content_name", `%${search}%`)

      const { data, error } = await q.limit(20)
      if (error) throw error

      const seen = new Set<string>()
      for (const e of data || []) {
        if (e.content_name) seen.add(e.content_name)
      }
      return Array.from(seen)
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

    async syncProgrammingGroupSchedules(
      groupId: string,
      name: string,
      enabled: boolean,
      timeSlots: TimeSlot[],
      playerIds: string[]
    ): Promise<void> {
      const now = new Date().toISOString()
      for (const playerId of playerIds) {
        const { data: player } = await c.from("players").select("name").eq("id", playerId).single()
        const scheduleId = `sch${Date.now()}${Math.random().toString(36).slice(2, 6)}`
        await c.from("schedules").insert({
          id: scheduleId,
          name,
          type: "player",
          target_id: playerId,
          target_name: player?.name || "",
          time_slots: JSON.stringify(timeSlots),
          enabled,
          replicated_from_group: groupId,
          created_at: now,
          updated_at: now,
        })
      }
    },

    async deleteSchedulesByGroup(groupId: string): Promise<void> {
      await c.from("schedules").delete().eq("replicated_from_group", groupId)
    },

    // Layouts
    async getLayouts(): Promise<Layout[]> {
      const { data, error } = await c.from("layouts").select("*").order("name")
      if (error) throw error
      return (data || []).map(mapLayout)
    },

    async getLayout(id: string): Promise<Layout | undefined> {
      const { data, error } = await c.from("layouts").select("*").eq("id", id).single()
      if (error) return undefined
      const layout = mapLayout(data)
      const { data: areas } = await c.from("layout_areas").select("*").eq("layout_id", id).order("z_index").order("created_at")
      if (areas) {
        layout.zones = areas.map(mapLayoutZone)
      }
      return layout
    },

    async createLayout(data: Omit<Layout, "id" | "createdAt" | "updatedAt">): Promise<Layout> {
      const layout = {
        id: `ly_${Date.now()}`,
        name: data.name,
        description: data.description || "",
        canvas_width: data.canvasWidth || 1920,
        canvas_height: data.canvasHeight || 1080,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { data: created, error } = await c.from("layouts").insert(layout).select().single()
      if (error) throw error
      recordActivity(c, { type: "layout", description: `Layout "${data.name}" criado` })
      return mapLayout(created)
    },

    async updateLayout(id: string, data: Partial<Layout>): Promise<Layout | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.description !== undefined) update.description = data.description
      if (data.canvasWidth !== undefined) update.canvas_width = data.canvasWidth
      if (data.canvasHeight !== undefined) update.canvas_height = data.canvasHeight
      update.updated_at = new Date().toISOString()

      const { data: updated, error } = await c.from("layouts").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapLayout(updated)
    },

    async deleteLayout(id: string): Promise<boolean> {
      const { data: layout } = await c.from("layouts").select("name").eq("id", id).single()
      const { error } = await c.from("layouts").delete().eq("id", id)
      if (error) return false
      if (layout) recordActivity(c, { type: "layout", description: `Layout "${layout.name}" excluído` })
      return true
    },

    // Layout Areas
    async getLayoutAreas(layoutId?: string): Promise<LayoutArea[]> {
      let query = c.from("layout_areas").select("*").order("z_index").order("created_at")
      if (layoutId) {
        query = query.eq("layout_id", layoutId)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []).map(mapLayoutArea)
    },

    async getLayoutArea(id: string): Promise<LayoutArea | undefined> {
      const { data, error } = await c.from("layout_areas").select("*").eq("id", id).single()
      if (error) return undefined
      return mapLayoutArea(data)
    },

    async createLayoutArea(data: Omit<LayoutArea, "id" | "createdAt" | "updatedAt">): Promise<LayoutArea> {
      const area: Record<string, any> = {
        id: `la_${Date.now()}`,
        name: data.name,
        type: data.type,
        layout_id: data.layoutId || "default",
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        z_index: data.zIndex || 0,
        enabled: data.enabled !== false,
        config: JSON.stringify(data.config || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (data.contentId) area.content_id = data.contentId
      const { data: created, error } = await c.from("layout_areas").insert(area).select().single()
      if (error) throw error
      recordActivity(c, { type: "layout", description: `Área "${data.name}" criada no layout` })
      return mapLayoutArea(created)
    },

    async updateLayoutArea(id: string, data: Partial<LayoutArea>): Promise<LayoutArea | undefined> {
      const update: Record<string, any> = {}
      if (data.name !== undefined) update.name = data.name
      if (data.type !== undefined) update.type = data.type
      if (data.layoutId !== undefined) update.layout_id = data.layoutId
      if (data.x !== undefined) update.x = data.x
      if (data.y !== undefined) update.y = data.y
      if (data.width !== undefined) update.width = data.width
      if (data.height !== undefined) update.height = data.height
      if (data.zIndex !== undefined) update.z_index = data.zIndex
      if (data.enabled !== undefined) update.enabled = data.enabled
      if (data.config !== undefined) update.config = JSON.stringify(data.config)
      if (data.contentId !== undefined) update.content_id = data.contentId || null
      update.updated_at = new Date().toISOString()

      const { data: updated, error } = await c.from("layout_areas").update(update).eq("id", id).select().single()
      if (error) return undefined
      return mapLayoutArea(updated)
    },

    async deleteLayoutArea(id: string): Promise<boolean> {
      const { data: area } = await c.from("layout_areas").select("name").eq("id", id).single()
      const { error } = await c.from("layout_areas").delete().eq("id", id)
      if (error) return false
      if (area) recordActivity(c, { type: "layout", description: `Área "${area.name}" excluída do layout` })
      return true
    },

    async deleteLayoutAreasByLayout(layoutId: string): Promise<boolean> {
      const { error } = await c.from("layout_areas").delete().eq("layout_id", layoutId)
      if (error) return false
      recordActivity(c, { type: "layout", description: `Todas as áreas do layout "${layoutId}" excluídas` })
      return true
    },

    async reorderLayoutAreas(orderedIds: string[]): Promise<boolean> {
      for (let i = 0; i < orderedIds.length; i++) {
        await c.from("layout_areas").update({ z_index: i }).eq("id", orderedIds[i])
      }
      return true
    },
  }
}

// Default export for client-side (uses anon key)
export const db = createDb()

// Server-side export (uses service role key)
export const dbAdmin = createDb(supabaseAdmin)

// Converts GB to bytes if the value appears to be in GB (≤ 65536)
function toBytes(v: number | null | undefined, fallback: number): number {
  if (v == null || v === 0) return fallback
  return v <= 65536 ? v * 1024 * 1024 * 1024 : v
}

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
    storageUsed: toBytes(data.storage_used, 0),
    totalStorage: toBytes(data.total_storage, 34359738368),
    version: data.version || "2.1.0",
    ip: data.ip || "0.0.0.0",
    electronVersion: data.electron_version || undefined,
    publicIp: data.public_ip || undefined,
    storageFree: data.storage_free != null ? toBytes(data.storage_free, 0) : undefined,
    playlistId: data.playlist_id || undefined,
    layoutId: data.layout_id || undefined,
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

function mapLayout(data: any): Layout {
  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    canvasWidth: data.canvas_width,
    canvasHeight: data.canvas_height,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapLayoutArea(data: any): LayoutArea {
  const config = typeof data.config === "string" ? JSON.parse(data.config) : data.config || {}
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    layoutId: data.layout_id,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    zIndex: data.z_index,
    enabled: data.enabled,
    config,
    contentId: data.content_id || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapLayoutZone(data: any): LayoutZone {
  const config = typeof data.config === "string" ? JSON.parse(data.config) : data.config || {}
  return {
    id: data.id,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    contentId: data.content_id || undefined,
    type: data.type,
    zIndex: data.z_index,
    enabled: data.enabled,
    name: data.name,
    config,
  }
}

function mapProgrammingGroup(data: any): ProgrammingGroup {
  const timeSlots = typeof data.time_slots === "string" ? JSON.parse(data.time_slots) : data.time_slots || []
  return {
    id: data.id,
    name: data.name,
    enabled: data.enabled,
    timeSlots,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    playerCount: 0,
  }
}
