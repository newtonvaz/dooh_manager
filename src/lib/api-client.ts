import type { Player } from "@/types/player"
import type { MediaContent, Playlist } from "@/types/content"
import type { OperatingSchedule } from "@/types/schedule"
import type { ContentReportQuery, ContentReportRow } from "@/types/playback"

interface Group {
  id: string
  name: string
  createdAt: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function dbCall(action: string, params?: Record<string, unknown>, data?: unknown) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params, data }),
    cache: "no-store",
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.data
}

export const api = {
  async getPlayers(): Promise<Player[]> {
    await delay(150)
    return dbCall("getPlayers")
  },

  async getPlayer(id: string): Promise<Player | undefined> {
    await delay(100)
    return dbCall("getPlayer", { id })
  },

  async createPlayer(
    data: Omit<Player, "id" | "code" | "status" | "lastSeen" | "createdAt" | "storageUsed" | "totalStorage" | "version" | "ip">
  ): Promise<Player> {
    await delay(200)
    return dbCall("createPlayer", {}, data)
  },

  async updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined> {
    await delay(150)
    return dbCall("updatePlayer", { id }, data)
  },

  async deletePlayer(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deletePlayer", { id })
  },

  async deleteMultiplePlayers(ids: string[]): Promise<boolean> {
    await delay(200)
    return dbCall("deleteMultiplePlayers", {}, { ids })
  },

  async deleteAllPlayers(): Promise<boolean> {
    await delay(250)
    return dbCall("deleteAllPlayers")
  },

  async assignPlaylist(playerId: string, playlistId: string | null): Promise<Player | undefined> {
    await delay(100)
    return dbCall("assignPlaylist", { playerId, playlistId })
  },

  async recordHeartbeat(id: string): Promise<Player | undefined> {
    return dbCall("recordHeartbeat", { id })
  },

  async recordHeartbeatByCode(code: string): Promise<Player | undefined> {
    return dbCall("recordHeartbeatByCode", { code })
  },

  async getPlaylists(): Promise<Playlist[]> {
    await delay(150)
    return dbCall("getPlaylists")
  },

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    await delay(100)
    return dbCall("getPlaylist", { id })
  },

  async createPlaylist(
    data: Omit<Playlist, "id" | "order" | "createdAt" | "updatedAt" | "totalDuration">
  ): Promise<Playlist> {
    await delay(200)
    return dbCall("createPlaylist", {}, data)
  },

  async updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist | undefined> {
    await delay(150)
    return dbCall("updatePlaylist", { id }, data)
  },

  async addContentToPlaylist(playlistId: string, contentId: string, duration: number): Promise<Playlist | undefined> {
    await delay(100)
    return dbCall("addContentToPlaylist", { playlistId, contentId, duration })
  },

  async removeContentFromPlaylist(playlistId: string, contentId: string): Promise<Playlist | undefined> {
    await delay(100)
    return dbCall("removeContentFromPlaylist", { playlistId, contentId })
  },

  async deletePlaylist(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deletePlaylist", { id })
  },

  async deleteMultiplePlaylists(ids: string[]): Promise<boolean> {
    await delay(200)
    return dbCall("deleteMultiplePlaylists", {}, { ids })
  },

  async deleteAllPlaylists(): Promise<boolean> {
    await delay(250)
    return dbCall("deleteAllPlaylists")
  },

  async reorderPlaylists(orderedIds: string[]): Promise<boolean> {
    await delay(100)
    return dbCall("reorderPlaylists", {}, { orderedIds })
  },

  async getContent(): Promise<MediaContent[]> {
    await delay(200)
    return dbCall("getContent")
  },

  async getContentById(id: string): Promise<MediaContent | undefined> {
    await delay(50)
    return dbCall("getContentById", { id })
  },

  async updateContent(id: string, data: Partial<MediaContent>): Promise<MediaContent | undefined> {
    await delay(150)
    return dbCall("updateContent", { id }, data)
  },

  async deleteContent(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteContent", { id })
  },

  async deleteMultipleContent(ids: string[]): Promise<boolean> {
    await delay(200)
    return dbCall("deleteMultipleContent", {}, { ids })
  },

  async deleteAllContent(): Promise<boolean> {
    await delay(250)
    return dbCall("deleteAllContent")
  },

  async getGroups(): Promise<Group[]> {
    await delay(100)
    return dbCall("getGroups")
  },

  async createGroup(name: string): Promise<Group> {
    await delay(200)
    return dbCall("createGroup", {}, { name })
  },

  async updateGroup(id: string, name: string): Promise<Group | undefined> {
    await delay(150)
    return dbCall("updateGroup", { id }, { name })
  },

  async deleteGroup(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteGroup", { id })
  },

  async deleteMultipleGroups(ids: string[]): Promise<boolean> {
    await delay(200)
    return dbCall("deleteMultipleGroups", {}, { ids })
  },

  async deleteAllGroups(): Promise<boolean> {
    await delay(250)
    return dbCall("deleteAllGroups")
  },

  async getCategories(): Promise<Group[]> {
    await delay(100)
    return dbCall("getCategories")
  },

  async createCategory(name: string): Promise<Group> {
    await delay(200)
    return dbCall("createCategory", {}, { name })
  },

  async updateCategory(id: string, name: string): Promise<Group | undefined> {
    await delay(150)
    return dbCall("updateCategory", { id }, { name })
  },

  async deleteCategory(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteCategory", { id })
  },

  async deleteMultipleCategories(ids: string[]): Promise<boolean> {
    await delay(200)
    return dbCall("deleteMultipleCategories", {}, { ids })
  },

  async deleteAllCategories(): Promise<boolean> {
    await delay(250)
    return dbCall("deleteAllCategories")
  },

  async getDashboardStats() {
    await delay(150)
    return dbCall("getDashboardStats")
  },

  async getRecentActivities() {
    await delay(100)
    return dbCall("getRecentActivities")
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
    await delay(100)
    return dbCall("recordPlayback", {}, data)
  },

  async getContentReport(query: ContentReportQuery): Promise<ContentReportRow[]> {
    await delay(200)
    return dbCall("getContentReport", {}, query)
  },

  async getSchedules(): Promise<OperatingSchedule[]> {
    await delay(100)
    return dbCall("getSchedules")
  },

  async getSchedule(id: string): Promise<OperatingSchedule | undefined> {
    await delay(100)
    return dbCall("getSchedule", { id })
  },

  async getSchedulesByTarget(type: string, targetId: string): Promise<OperatingSchedule[]> {
    await delay(100)
    return dbCall("getSchedulesByTarget", { type, targetId })
  },

  async createSchedule(data: Omit<OperatingSchedule, "id" | "createdAt" | "updatedAt">): Promise<OperatingSchedule> {
    await delay(200)
    return dbCall("createSchedule", {}, data)
  },

  async updateSchedule(id: string, data: Partial<OperatingSchedule>): Promise<OperatingSchedule | undefined> {
    await delay(150)
    return dbCall("updateSchedule", { id }, data)
  },

  async deleteSchedule(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteSchedule", { id })
  },


}
