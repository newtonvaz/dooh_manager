import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export function createServerSupabase(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Supabase URL and Anon Key not configured")
  }

  let response = NextResponse.next()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request: { headers: request.headers } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  return { supabase, response }
}

export async function getAuthenticatedUser(request: NextRequest) {
  const { supabase } = createServerSupabase(request)
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
