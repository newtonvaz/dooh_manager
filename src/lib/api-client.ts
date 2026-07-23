import type { Player } from "@/types/player"
import type { MediaContent, Playlist } from "@/types/content"
import type { OperatingSchedule } from "@/types/schedule"
import type { ProgrammingGroup } from "@/types/programming-group"
import type { TimeSlot } from "@/types/schedule"
import type { Layout, LayoutArea } from "@/types/layout"
import type { ContentReportQuery, ContentReportRow, PlaybackLogRow } from "@/types/playback"
import type { AdminBranding, AdminTheme, AdminSettings, AuditLog } from "@/types/admin"

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

  async recordDeviceInfo(code: string, deviceInfo: Record<string, unknown>): Promise<Player | undefined> {
    return dbCall("recordDeviceInfo", { code }, deviceInfo)
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

  async addContentToPlaylist(playlistId: string, contentId: string, duration: number, timeSlots?: { startDate: string; endDate: string }[]): Promise<Playlist | undefined> {
    await delay(100)
    return dbCall("addContentToPlaylist", { playlistId, contentId, duration, timeSlots })
  },

  async removeContentFromPlaylist(playlistId: string, contentId: string): Promise<Playlist | undefined> {
    await delay(100)
    return dbCall("removeContentFromPlaylist", { playlistId, contentId })
  },

  async addUrlToPlaylist(playlistId: string, url: string, duration: number): Promise<Playlist> {
    await delay(100)
    return dbCall("addUrlToPlaylist", { playlistId, url, duration })
  },

  async removeUrlFromPlaylist(playlistId: string, url: string): Promise<Playlist> {
    await delay(100)
    return dbCall("removeUrlFromPlaylist", { playlistId, url })
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

  async getPlaybackLogs(
    search: string,
    dateFrom: string,
    dateTo: string
  ): Promise<PlaybackLogRow[]> {
    await delay(100)
    return dbCall("getPlaybackLogs", {}, { search, dateFrom, dateTo })
  },

  async getContentSuggestions(
    search: string,
    dateFrom: string,
    dateTo: string
  ): Promise<string[]> {
    await delay(50)
    return dbCall("getContentSuggestions", {}, { search, dateFrom, dateTo })
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

  // Programming Groups
  async getProgrammingGroups(): Promise<ProgrammingGroup[]> {
    await delay(150)
    return dbCall("getProgrammingGroups")
  },

  async getProgrammingGroup(id: string): Promise<ProgrammingGroup | undefined> {
    await delay(100)
    return dbCall("getProgrammingGroup", { id })
  },

  async createProgrammingGroup(data: {
    name: string
    enabled: boolean
    timeSlots: TimeSlot[]
    playerIds: string[]
  }): Promise<ProgrammingGroup> {
    await delay(200)
    return dbCall("createProgrammingGroup", {}, data)
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
    await delay(150)
    return dbCall("updateProgrammingGroup", { id }, data)
  },

  async deleteProgrammingGroup(id: string): Promise<void> {
    await delay(150)
    await dbCall("deleteProgrammingGroup", { id })
  },

  // Layouts
  async getLayouts(): Promise<Layout[]> {
    await delay(100)
    return dbCall("getLayouts")
  },

  async getLayout(id: string): Promise<Layout | undefined> {
    await delay(100)
    return dbCall("getLayout", { id })
  },

  async createLayout(
    data: Omit<Layout, "id" | "createdAt" | "updatedAt">
  ): Promise<Layout> {
    await delay(200)
    return dbCall("createLayout", {}, data)
  },

  async updateLayout(id: string, data: Partial<Layout>): Promise<Layout | undefined> {
    await delay(150)
    return dbCall("updateLayout", { id }, data)
  },

  async deleteLayout(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteLayout", { id })
  },

  // Layout Areas
  async getLayoutAreas(layoutId?: string): Promise<LayoutArea[]> {
    await delay(100)
    return dbCall("getLayoutAreas", { layoutId })
  },

  async getLayoutArea(id: string): Promise<LayoutArea | undefined> {
    await delay(100)
    return dbCall("getLayoutArea", { id })
  },

  async createLayoutArea(
    data: Omit<LayoutArea, "id" | "createdAt" | "updatedAt">
  ): Promise<LayoutArea> {
    await delay(200)
    return dbCall("createLayoutArea", {}, data)
  },

  async updateLayoutArea(id: string, data: Partial<LayoutArea>): Promise<LayoutArea | undefined> {
    await delay(150)
    return dbCall("updateLayoutArea", { id }, data)
  },

  async deleteLayoutArea(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteLayoutArea", { id })
  },

  async deleteLayoutAreasByLayout(layoutId: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteLayoutAreasByLayout", { layoutId })
  },

  async reorderLayoutAreas(orderedIds: string[]): Promise<boolean> {
    await delay(100)
    return dbCall("reorderLayoutAreas", {}, { orderedIds })
  },

  // Admin - Branding
  async getBranding(): Promise<AdminBranding | null> {
    return dbCall("getBranding")
  },

  async updateBranding(data: Record<string, any>): Promise<any> {
    await delay(100)
    return dbCall("updateBranding", {}, data)
  },

  async resetBranding(): Promise<any> {
    await delay(100)
    return dbCall("resetBranding")
  },

  // Admin - Themes
  async getThemes(): Promise<AdminTheme[]> {
    return dbCall("getThemes")
  },

  async createTheme(data: { name: string; mode: string; colors: any }): Promise<any> {
    await delay(200)
    return dbCall("createTheme", {}, data)
  },

  async updateTheme(id: string, data: Record<string, any>): Promise<any> {
    await delay(150)
    return dbCall("updateTheme", { id }, data)
  },

  async setActiveTheme(id: string | null): Promise<void> {
    await delay(100)
    return dbCall("setActiveTheme", { id })
  },

  async deleteTheme(id: string): Promise<boolean> {
    await delay(150)
    return dbCall("deleteTheme", { id })
  },

  // Admin - Settings
  async getAdminSettings(): Promise<AdminSettings> {
    return dbCall("getAdminSettings")
  },

  async updateAdminSetting(id: string, data: any): Promise<void> {
    await delay(100)
    return dbCall("updateAdminSetting", { id }, data)
  },

  // Admin - Users
  async getAdminUsers(): Promise<any[]> {
    return dbCall("getAdminUsers")
  },

  async createAdminUser(data: {
    email: string; password: string; name: string; role: string
  }): Promise<any> {
    return dbCall("createAdminUser", {}, data)
  },

  async updateAdminUser(id: string, data: Record<string, any>): Promise<any> {
    return dbCall("updateAdminUser", { id }, data)
  },

  async deleteAdminUser(id: string): Promise<any> {
    return dbCall("deleteAdminUser", { id })
  },

  // Admin - Audit
  async recordAuditLog(data: {
    userName?: string
    userEmail?: string
    action: string
    entityType?: string
    entityId?: string
    description: string
    ip?: string
  }): Promise<void> {
    return dbCall("recordAuditLog", {}, {
      userName: data.userName || "Admin",
      userEmail: data.userEmail || "admin@dooh.com",
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      ip: data.ip || "127.0.0.1",
    })
  },

  async getAuditLogs(limit = 200, offset = 0): Promise<AuditLog[]> {
    return dbCall("getAuditLogs", { limit, offset })
  },

  // Admin - Stats
  async getAdminStats(): Promise<{
    totalPlayers: number
    onlinePlayers: number
    offlinePlayers: number
    neverPlayers: number
    errorPlayers: number
    totalContent: number
    totalPlaylists: number
    totalActivities: number
    storageUsed: number
    storageTotal: number
    storageUsagePercent: number
  }> {
    return dbCall("getAdminStats")
  },
}
