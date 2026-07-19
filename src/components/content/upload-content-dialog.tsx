"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Upload, FileImage, Video, Globe, X } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"])
const VIDEO_EXTS = new Set(["mp4", "webm", "ogg", "mov", "avi", "mkv"])

function detectType(ext: string): "image" | "video" | "web" {
  if (IMAGE_EXTS.has(ext)) return "image"
  if (VIDEO_EXTS.has(ext)) return "video"
  return "web"
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return FileImage
  if (["mp4", "webm", "ogg", "mov"].includes(ext ?? "")) return Video
  return Globe
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Math.round(video.duration))
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Falha ao ler duração do vídeo"))
    }
    video.src = url
  })
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

interface UploadContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadContentDialog({ open, onOpenChange }: UploadContentDialogProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected])
    e.target.value = ""
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function apiCall(body: unknown) {
    const token = await getAccessToken()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers["authorization"] = `Bearer ${token}`

    const res = await fetch("/api/upload", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`Resposta inesperada (${res.status}): ${text.slice(0, 200)}`)
    }
    if (!res.ok) throw new Error(json.error)
    return json.data
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo")
      return
    }

    setUploading(true)
    try {
      const created: { name: string }[] = []

      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || ""
        const type = detectType(ext)
        const timestamp = Date.now()
        const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`

        const duration = type === "video" ? await getVideoDuration(file).catch(() => 30) : null

        const { url: signedUrl } = await apiCall({ action: "presign", path: safeName })

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (!uploadRes.ok) {
          throw new Error(`Falha no upload do arquivo (${uploadRes.status})`)
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${safeName}`

        await apiCall({
          action: "register",
          entry: {
            id: `c${timestamp}`,
            name: file.name.replace(`.${ext}`, ""),
            type,
            url: publicUrl,
            size: Math.round((file.size / (1024 * 1024)) * 100) / 100,
            duration,
          },
        })

        created.push({ name: file.name })
      }

      queryClient.invalidateQueries({ queryKey: ["content"] })
      toast.success(`${created.length} arquivo(s) enviado(s) com sucesso!`)
      setFiles([])
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar arquivos")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload de Conteúdo</DialogTitle>
          <DialogDescription>
            Selecione um ou mais arquivos para enviar
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Clique para selecionar arquivos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Imagens, vídeos ou páginas web
            </p>
            <Input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*,.html,.htm,.svg"
              className="hidden"
              onChange={handleSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="flex-1 min-h-0 space-y-2">
              <Label>{files.length} arquivo(s) selecionado(s)</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                {files.map((file, i) => {
                  const Icon = getFileIcon(file.name)
                  return (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-3 rounded-md border p-2"
                    >
                      <div className="rounded bg-muted p-1">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => removeFile(i)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {uploading ? "Enviando..." : `Upload (${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
