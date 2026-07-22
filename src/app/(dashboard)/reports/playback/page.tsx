"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api-client"
import type { PlaybackLogRow } from "@/types/playback"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  FileText,
  Loader2,
  FileSpreadsheet,
  Calendar,
  Film,
  AlertCircle,
  Search,
} from "lucide-react"

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState(() => daysAgo(30))
  const [dateTo, setDateTo] = useState(() => todayLocal())
  const [results, setResults] = useState<PlaybackLogRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await api.getContentSuggestions(searchQuery, dateFrom, dateTo)
        setSuggestions(res)
        if (res.length > 0) setShowDropdown(true)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current)
    }
  }, [searchQuery, dateFrom, dateTo])

  const fetchLogs = useCallback(async (query: string, from: string, to: string) => {
    setLoading(true)
    setError("")
    try {
      const data = await api.getPlaybackLogs(query, from, to)
      setResults(data)
    } catch (e) {
      setError(String(e))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSearch() {
    setShowDropdown(false)
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    fetchLogs(searchQuery, dateFrom, dateTo)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  function selectSuggestion(name: string) {
    setSearchQuery(name)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  async function exportPDF() {
    if (!results || results.length === 0) return
    setExporting("pdf")
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as any
      doc.setFontSize(16)
      doc.text("Relatório de Conteúdos Veiculados", 14, 20)
      doc.setFontSize(10)
      const info = [
        `Período: ${new Date(dateFrom + "T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(dateTo + "T12:00:00").toLocaleDateString("pt-BR")}`,
      ]
      if (searchQuery.trim()) info.push(`Conteúdo: ${searchQuery.trim()}`)
      doc.text(info, 14, 30)
      const rows = results.map((r) => [
        new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR"),
        r.contentName,
        String(r.insertions),
        `${r.contentDuration}s`,
        r.playerName,
      ])
      doc.autoTable({
        startY: 40,
        head: [["Data", "Conteúdo", "Inserções", "Duração", "Player"]],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      doc.save(`relatorio-conteudos-${dateFrom}-${dateTo}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  async function exportXLSX() {
    if (!results || results.length === 0) return
    setExporting("xlsx")
    try {
      const XLSX = await import("xlsx")
      const data = results.map((r) => ({
        Data: new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR"),
        Conteúdo: r.contentName,
        Inserção: r.insertions,
        "Duração (s)": r.contentDuration,
        Player: r.playerName,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const headers = ["Data", "Conteúdo", "Inserção", "Duração (s)", "Player"]
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...data.map((r) => String(Object.values(r)[i] ?? "").length)
        )
        return { wch: maxLen + 3 }
      })
      ws["!cols"] = colWidths
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Conteúdos Veiculados")
      XLSX.writeFile(wb, `relatorio-conteudos-${dateFrom}-${dateTo}.xlsx`)
    } finally {
      setExporting(null)
    }
  }

  const hasSearched = results !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Veiculação de Conteúdos</h1>
        <p className="text-sm text-muted-foreground">
          Conteúdos veiculados por período
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="searchContent" className="text-xs mb-1 block">
                Conteúdo
              </Label>
              <div className="relative">
                <Film className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  id="searchContent"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim()) setShowDropdown(true)
                    else setShowDropdown(false)
                  }}
                  onFocus={() => { if (searchQuery.trim() && suggestions.length > 0) setShowDropdown(true) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o nome do conteúdo..."
                  className="pl-8"
                />
                {showDropdown && suggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover shadow-md"
                  >
                    {suggestions.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => selectSuggestion(name)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-medium truncate">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-[160px]">
              <Label htmlFor="dateFrom" className="text-xs mb-1 block">Data início</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dateFrom" type="date" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="min-w-[160px]">
              <Label htmlFor="dateTo" className="text-xs mb-1 block">Data fim</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dateTo" type="date" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Button onClick={handleSearch} disabled={loading} className="h-8">
              {loading ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Search className="size-4 mr-1.5" />
              )}
              Buscar
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" /> {error}
            </p>
          )}
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                {loading ? "Buscando..." : "Resultados"}
              </CardTitle>
              {results && !loading && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {results.length} registro{results.length !== 1 ? "s" : ""}
                  {searchQuery.trim() && (
                    <> &middot; <span className="font-medium">{searchQuery.trim()}</span></>
                  )}
                  {" \u00b7 "}{new Date(dateFrom + "T12:00:00").toLocaleDateString("pt-BR")} a{" "}
                  {new Date(dateTo + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            {results && results.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={exportPDF}
                  disabled={exporting !== null}
                  className="h-8"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileText className="size-4 mr-1.5" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={exportXLSX}
                  disabled={exporting !== null}
                  className="h-8"
                >
                  {exporting === "xlsx" ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="size-4 mr-1.5" />
                  )}
                  XLSX
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-6 mr-2 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : results && results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="size-10 mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery.trim() ? "Nenhum registro encontrado" : "Digite o nome do conteúdo para buscar"}
                </p>
              </div>
            ) : results ? (
              <div className="overflow-x-auto">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-background z-10">Dia</TableHead>
                        <TableHead className="sticky top-0 bg-background z-10">Conteúdo</TableHead>
                        <TableHead className="sticky top-0 bg-background z-10 text-right">Inserção</TableHead>
                        <TableHead className="sticky top-0 bg-background z-10 text-right">Secundagem</TableHead>
                        <TableHead className="sticky top-0 bg-background z-10">Player</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(row.date + "T12:00:00").toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-xs max-w-[300px] truncate" title={row.contentName}>
                            {row.contentName}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right tabular-nums">
                            {row.insertions}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right tabular-nums">
                            {row.contentDuration}
                          </TableCell>
                          <TableCell className="text-xs">{row.playerName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
