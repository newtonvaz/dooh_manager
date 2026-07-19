import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import "dotenv/config"
import { mapKeys } from "./seed-helpers"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(url, key)

const DATA_DIR = path.join(process.cwd(), "Data")

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

async function seedTable(filename: string, table: string) {
  const data = readJSON<any>(filename)
  if (data.length === 0) return

  const snakeData = data.map(mapKeys)
  const { error } = await supabase.from(table).upsert(snakeData, { onConflict: "id" })
  if (error) {
    console.error(`Error seeding ${table}:`, error.message)
  } else {
    console.log(`Seeded ${data.length} rows into ${table}`)
  }
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes("your-project-ref") || key.includes("your-anon-key")) {
    console.log("Skipping seed: Supabase credentials not configured")
    return
  }

  console.log("Seeding Supabase database from JSON files...\n")

  await seedTable("groups.json", "groups")
  await seedTable("categories.json", "categories")
  await seedTable("content.json", "content")
  await seedTable("playlists.json", "playlists")
  await seedTable("players.json", "players")
  await seedTable("schedules.json", "schedules")
  await seedTable("activities.json", "activities")
  await seedTable("playback_log.json", "playback_logs")

  console.log("\nSeed complete.")
}

seed().catch(console.error)
