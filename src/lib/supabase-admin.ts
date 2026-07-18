import { createClient, SupabaseClient } from "@supabase/supabase-js"

let serverClient: SupabaseClient | null = null

function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error("Supabase Service Role Key not configured")
    }
    serverClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
  return serverClient
}

export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop) {
    return getServerClient()[prop as keyof SupabaseClient]
  },
})