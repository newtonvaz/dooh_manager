import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { fileURLToPath } from "url"
import { mapKeys } from "./seed-helpers"

const __filename = fileURLToPath(import.meta.url)
const isMainModule = process.argv[1] === __filename

if (isMainModule) {
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env")
  }

  const DATA_DIR = path.join(process.cwd(), "Data")

  function readJSON(filename: string): any[] {
    const filePath = path.join(DATA_DIR, filename)
    if (!fs.existsSync(filePath)) return []
    return JSON.parse(fs.readFileSync(filePath, "utf-8"))
  }

  async function seedTable(supabase: any, filename: string, table: string) {
    const data = readJSON(filename)
    if (data.length === 0) return

    const snakeData = data.map(mapKeys)
    const { error } = await supabase.from(table).upsert(snakeData as any, { onConflict: "id" })
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

    const supabase = createClient(url, key)

    console.log("Seeding Supabase database from JSON files...\n")

    await seedTable(supabase, "groups.json", "groups")
    await seedTable(supabase, "categories.json", "categories")
    await seedTable(supabase, "content.json", "content")
    await seedTable(supabase, "playlists.json", "playlists")
    await seedTable(supabase, "players.json", "players")
    await seedTable(supabase, "schedules.json", "schedules")
    await seedTable(supabase, "activities.json", "activities")
    await seedTable(supabase, "playback_log.json", "playback_logs")

    console.log("\nSeed complete.")
  }

  seed().catch(console.error)
}
