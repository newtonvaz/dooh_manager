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
import { Loader2, Upload, FileImage, Video, Globe, X, File } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo")
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      files.forEach((f) => body.append("files", f))

      const res = await fetch("/api/upload", { method: "POST", body })
      let json: any
      try {
        json = await res.json()
      } catch {
        const text = await res.text()
        throw new Error(`Resposta inesperada do servidor (${res.status}): ${text.slice(0, 200)}`)
      }
      if (!res.ok) throw new Error(json.error)

      queryClient.invalidateQueries({ queryKey: ["content"] })
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`)
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
