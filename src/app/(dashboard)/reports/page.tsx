"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { api } from "@/lib/api-client"
import type { ContentReportRow } from "@/types/playback"
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
  FileDown,
  FileText,
  Loader2,
  FileSpreadsheet,
  Calendar,
  Film,
  AlertCircle,
} from "lucide-react"

const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])
  const [results, setResults] = useState<ContentReportRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchReport = useCallback(async (query: string, from: string, to: string) => {
    setLoading(true)
    setError("")
    try {
      const params: Parameters<typeof api.getContentReport>[0] = {
        dateFrom: from,
        dateTo: to,
      }
      if (query.trim()) {
        params.contentName = query.trim()
      }
      const data = await api.getContentReport(params)
      setResults(data)
    } catch (e) {
      setError(String(e))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport("", dateFrom, dateTo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchReport(searchQuery, dateFrom, dateTo)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, dateFrom, dateTo, fetchReport])

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

  const allContentNames = useMemo(() => {
    if (!results) return []
    const seen = new Set<string>()
    return results
      .filter((r) => {
        const lower = r.contentName.toLowerCase()
        if (seen.has(lower)) return false
        seen.add(lower)
        return true
      })
      .map((r) => ({
        contentName: r.contentName,
        date: r.date,
        playerName: r.playerName,
        contentDuration: r.contentDuration,
      }))
      .sort((a, b) => a.contentName.localeCompare(b.contentName, "pt-BR"))
  }, [results])

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return allContentNames.filter((s) =>
      s.contentName.toLowerCase().includes(q)
    ).slice(0, 15)
  }, [allContentNames, searchQuery])

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
      doc.text("Relatório por Dia", 14, 20)
      doc.setFontSize(10)
      const info = [
        `Período: ${new Date(dateFrom).toLocaleDateString("pt-BR")} a ${new Date(dateTo).toLocaleDateString("pt-BR")}`,
      ]
      if (searchQuery.trim()) info.push(`Arquivo: ${searchQuery.trim()}`)
      const totalIns = results.reduce((s, r) => s + r.insertions, 0)
      info.push(`Total de inserções: ${totalIns}`)
      doc.text(info, 14, 30)
      const rows = results.map((r) => [
        new Date(r.date).toLocaleDateString("pt-BR"),
        r.dayOfWeek,
        r.contentName,
        `${r.contentDuration}s`,
        String(r.insertions),
        `${r.playerName} (${r.playerCode})`,
      ])
      doc.autoTable({
        startY: 40,
        head: [["Data", "Dia", "Arquivo", "Duração", "Inserções", "Player"]],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      doc.save(`relatorio-por-dia-${dateFrom}-${dateTo}.pdf`)
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
        Data: new Date(r.date).toLocaleDateString("pt-BR"),
        "Dia da Semana": r.dayOfWeek,
        Arquivo: r.contentName,
        "Duração (s)": r.contentDuration,
        Inserções: r.insertions,
        Player: `${r.playerName} (${r.playerCode})`,
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, "Relatório por Dia")
      XLSX.writeFile(wb, `relatorio-por-dia-${dateFrom}-${dateTo}.xlsx`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatório por Dia</h1>
        <p className="text-sm text-muted-foreground">
          Inserções de conteúdos veiculados por dia
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
                  onFocus={() => { if (filteredSuggestions.length > 0) setShowDropdown(true) }}
                  placeholder="Digite o nome do conteúdo veiculado..."
                  className="pl-8"
                />
                {showDropdown && filteredSuggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover shadow-md"
                  >
                    {filteredSuggestions.map((s, i) => (
                      <button
                        key={`${s.contentName}-${i}`}
                        type="button"
                        onMouseDown={() => selectSuggestion(s.contentName)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{s.contentName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString("pt-BR")}
                            {" \u00b7 "}{s.playerName}
                            {" \u00b7 "}{s.contentDuration}s
                          </span>
                        </div>
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
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" /> {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {loading ? "Buscando..." : "Resultados"}
            </CardTitle>
            {results && !loading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {results.reduce((s, r) => s + r.insertions, 0)} inserção
                {results.reduce((s, r) => s + r.insertions, 0) !== 1 ? "ões" : ""} no período
                {searchQuery.trim() && (
                  <> &middot; <span className="font-medium">{searchQuery.trim()}</span></>
                )}
                {" \u00b7 "}{new Date(dateFrom).toLocaleDateString("pt-BR")} a{" "}
                {new Date(dateTo).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={exportPDF}
              disabled={exporting !== null || !results || results.length === 0}
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
              disabled={exporting !== null || !results || results.length === 0}
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
        </CardHeader>
        <CardContent>
          {loading && !results ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 mr-2 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : results && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileDown className="size-10 mb-3 opacity-50" />
              <p className="text-sm">Nenhum registro encontrado para os filtros informados</p>
            </div>
          ) : results ? (
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-background z-10">Data</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Dia</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Arquivo</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Duração</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10 text-right">Inserções</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Player</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">
                          {new Date(row.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                            {DAY_LABELS_SHORT[new Date(row.date).getDay()]}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate" title={row.contentName}>
                          {row.contentName}
                        </TableCell>
                        <TableCell className="text-xs">{row.contentDuration}s</TableCell>
                        <TableCell className="text-xs font-mono text-right font-semibold tabular-nums">
                          {row.insertions}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{row.playerName}</span>
                          <span className="ml-1.5 text-muted-foreground">({row.playerCode})</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
