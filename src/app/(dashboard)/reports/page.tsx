"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  FileDown,
  FileText,
  Loader2,
  FileSpreadsheet,
  Calendar,
  Film,
  AlertCircle,
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
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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

  useEffect(() => {
    fetchLogs("", dateFrom, dateTo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchLogs(searchQuery, dateFrom, dateTo)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, dateFrom, dateTo, fetchLogs])

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
    return results.filter((r) => {
      const lower = r.contentName.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })
  }, [results])

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return allContentNames
      .filter((s) => s.contentName.toLowerCase().includes(q))
      .slice(0, 15)
  }, [allContentNames, searchQuery])

  function selectSuggestion(name: string) {
    setSearchQuery(name)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatório por Dia</h1>
        <p className="text-sm text-muted-foreground">
          Conteúdos veiculados — playback_logs
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
                  placeholder="Digite o nome do conteúdo..."
                  className="pl-8"
                />
                {showDropdown && filteredSuggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover shadow-md"
                  >
                    {filteredSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => selectSuggestion(s.contentName)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-medium truncate">{s.contentName}</span>
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
                {results.length} registro{results.length !== 1 ? "s" : ""}
                {searchQuery.trim() && (
                  <> &middot; <span className="font-medium">{searchQuery.trim()}</span></>
                )}
                {" \u00b7 "}{new Date(dateFrom).toLocaleDateString("pt-BR")} a{" "}
                {new Date(dateTo).toLocaleDateString("pt-BR")}
              </p>
            )}
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
              <p className="text-sm">Nenhum registro encontrado</p>
            </div>
          ) : results ? (
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-background z-10">Data</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Conteúdo</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Player</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10 text-right">Duração</TableHead>
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
                        <TableCell className="text-xs">{row.playerName}</TableCell>
                        <TableCell className="text-xs font-mono text-right tabular-nums">
                          {row.contentDuration ?? 0}s
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
