import { dbAdmin } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function getChangeToken(code: string): Promise<string | null> {
  try {
    const player = await dbAdmin.getPlayerByCode(code)
    if (!player) return null

    const parts: string[] = [player.createdAt]

    if (player.layoutId) {
      const layout = await dbAdmin.getLayout(player.layoutId)
      if (layout) {
        parts.push(layout.updatedAt)
      }
    }

    if (player.playlistId) {
      const playlist = await dbAdmin.getPlaylist(player.playlistId)
      if (playlist) {
        parts.push(playlist.updatedAt)
      }
    }

    return parts.join("|")
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const encoder = new TextEncoder()
  let lastToken = await getChangeToken(code)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      send("connected")

      const timer = setInterval(async () => {
        try {
          const token = await getChangeToken(code)
          if (token && token !== lastToken) {
            lastToken = token
            send("reload")
          }
        } catch {
          // silent
        }
      }, 5000)

      request.signal.addEventListener("abort", () => {
        clearInterval(timer)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
