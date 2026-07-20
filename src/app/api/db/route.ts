import { NextResponse } from "next/server"
import { dbAdmin } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import { mapKeys } from "@/lib/seed-helpers"

export const dynamic = "force-dynamic"

async function runSeed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase credentials not configured")

  const supabase = createClient(url, key)
  const DATA_DIR = path.join(process.cwd(), "Data")

  function readJSON<T>(filename: string): T[] {
    const filePath = path.join(DATA_DIR, filename)
    if (!fs.existsSync(filePath)) return []
    return JSON.parse(fs.readFileSync(filePath, "utf-8"))
  }

  const tables = [
    { file: "groups.json", table: "groups" },
    { file: "categories.json", table: "categories" },
    { file: "content.json", table: "content" },
    { file: "playlists.json", table: "playlists" },
    { file: "players.json", table: "players" },
    { file: "schedules.json", table: "schedules" },
    { file: "activities.json", table: "activities" },
    { file: "playback_log.json", table: "playback_logs" },
  ]

  const results: { table: string; rows: number; error?: string }[] = []

  for (const { file, table } of tables) {
    const data = readJSON<any>(file)
    if (data.length === 0) continue
    const snakeData = data.map(mapKeys)
    const { error } = await supabaseAdmin.from(table).upsert(snakeData, { onConflict: "id" })
    results.push({ table, rows: data.length, error: error?.message })
  }

  return results
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, params = {}, data } = body

  try {
    let result

    switch (action) {
      // Players
      case "getPlayers":
        result = dbAdmin.getPlayers()
        break
      case "getPlayer":
        result = dbAdmin.getPlayer(params.id)
        break
      case "createPlayer":
        result = dbAdmin.createPlayer(data)
        break
      case "updatePlayer":
        result = dbAdmin.updatePlayer(params.id, data)
        break
      case "deletePlayer":
        result = dbAdmin.deletePlayer(params.id)
        break
      case "deleteMultiplePlayers":
        result = dbAdmin.deleteMultiplePlayers(data.ids)
        break
      case "deleteAllPlayers":
        result = dbAdmin.deleteAllPlayers()
        break
      case "assignPlaylist":
        result = dbAdmin.assignPlaylist(params.playerId, params.playlistId)
        break
      case "recordHeartbeat":
        result = dbAdmin.recordHeartbeat(params.id)
        break
      case "recordHeartbeatByCode":
        result = dbAdmin.recordHeartbeatByCode(params.code, data)
        break
      case "recordDeviceInfo":
        result = dbAdmin.recordHeartbeatByCode(params.code, data)
        break
      case "getPlayerByCode":
        result = dbAdmin.getPlayerByCode(params.code)
        break
      case "resolvePlayerPlaylist":
        result = dbAdmin.resolvePlayerPlaylist(params.code)
        break

      // Playlists
      case "getPlaylists":
        result = dbAdmin.getPlaylists()
        break
      case "getPlaylist":
        result = dbAdmin.getPlaylist(params.id)
        break
      case "createPlaylist":
        result = dbAdmin.createPlaylist(data)
        break
      case "updatePlaylist":
        result = dbAdmin.updatePlaylist(params.id, data)
        break
      case "addContentToPlaylist":
        result = dbAdmin.addContentToPlaylist(params.playlistId, params.contentId, params.duration, params.timeSlots)
        break
      case "removeContentFromPlaylist":
        result = dbAdmin.removeContentFromPlaylist(params.playlistId, params.contentId)
        break
      case "deletePlaylist":
        result = dbAdmin.deletePlaylist(params.id)
        break
      case "deleteMultiplePlaylists":
        result = dbAdmin.deleteMultiplePlaylists(data.ids)
        break
      case "deleteAllPlaylists":
        result = dbAdmin.deleteAllPlaylists()
        break
      case "reorderPlaylists":
        result = dbAdmin.reorderPlaylists(data.orderedIds)
        break

      // Content
      case "getContent":
        result = dbAdmin.getContent()
        break
      case "getContentById":
        result = dbAdmin.getContentById(params.id)
        break
      case "updateContent":
        result = dbAdmin.updateContent(params.id, data)
        break

      case "deleteContent":
        result = dbAdmin.deleteContent(params.id)
        break
      case "deleteMultipleContent":
        result = dbAdmin.deleteMultipleContent(data.ids)
        break
      case "deleteAllContent":
        result = dbAdmin.deleteAllContent()
        break

      // Groups
      case "getGroups":
        result = dbAdmin.getGroups()
        break
      case "createGroup":
        result = dbAdmin.createGroup(data.name)
        break
      case "updateGroup":
        result = dbAdmin.updateGroup(params.id, data.name)
        break
      case "deleteGroup":
        result = dbAdmin.deleteGroup(params.id)
        break
      case "deleteMultipleGroups":
        result = dbAdmin.deleteMultipleGroups(data.ids)
        break
      case "deleteAllGroups":
        result = dbAdmin.deleteAllGroups()
        break

      // Categories
      case "getCategories":
        result = dbAdmin.getCategories()
        break
      case "createCategory":
        result = dbAdmin.createCategory(data.name)
        break
      case "updateCategory":
        result = dbAdmin.updateCategory(params.id, data.name)
        break
      case "deleteCategory":
        result = dbAdmin.deleteCategory(params.id)
        break
      case "deleteMultipleCategories":
        result = dbAdmin.deleteMultipleCategories(data.ids)
        break
      case "deleteAllCategories":
        result = dbAdmin.deleteAllCategories()
        break

      // Dashboard
      case "getDashboardStats":
        result = dbAdmin.getDashboardStats()
        break
      case "getRecentActivities":
        result = dbAdmin.getRecentActivities()
        break
      case "getContentReport":
        result = dbAdmin.getContentReport(data)
        break
      case "getPlaybackLogs":
        result = dbAdmin.getPlaybackLogs(data.search, data.dateFrom, data.dateTo)
        break
      case "getContentSuggestions":
        result = dbAdmin.getContentSuggestions(data.search, data.dateFrom, data.dateTo)
        break
      case "recordPlayback":
        const src = data || params
        const pc = src?.playerCode || src?.player_code || src?.code || ""
        const ci = src?.contentId || src?.content_id || ""
        const st = src?.startTime || src?.start_time || ""
        if (!pc || !ci || !st) {
          return NextResponse.json(
            { error: "playerCode, contentId e startTime são obrigatórios" },
            { status: 400 }
          )
        }
        result = dbAdmin.recordPlayback({
          playerCode: pc,
          contentId: ci,
          contentName: src?.contentName || src?.content_name || "",
          contentDuration: src?.contentDuration || src?.content_duration || 0,
          playlistId: src?.playlistId || src?.playlist_id || "",
          playlistName: src?.playlistName || src?.playlist_name || "",
          startTime: st,
          endTime: src?.endTime || src?.end_time || st,
        })
        await dbAdmin.recordHeartbeatByCode(pc).catch(() => {})
        break

      // Schedules
      case "getSchedules":
        result = dbAdmin.getSchedules()
        break
      case "getSchedule":
        result = dbAdmin.getSchedule(params.id)
        break
      case "getSchedulesByTarget":
        result = dbAdmin.getSchedulesByTarget(params.type, params.targetId)
        break
      case "createSchedule":
        result = dbAdmin.createSchedule(data)
        break
      case "updateSchedule":
        result = dbAdmin.updateSchedule(params.id, data)
        break
      case "deleteSchedule":
        result = dbAdmin.deleteSchedule(params.id)
        break

      // Seed
      case "seed":
        result = await runSeed()
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    if (result instanceof Promise) result = await result
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
