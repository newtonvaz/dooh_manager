import { createClient, SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error(
        "Supabase URL and Anon Key must be defined in environment variables.\n" +
        "Copy .env.local.example to .env.local and fill in your Supabase project credentials."
      )
    }
    client = createClient(url, key)
  }
  return client
}

export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop) {
    return getClient()[prop as keyof SupabaseClient]
  },
})
