export interface PlaybackLog {
  id: string
  contentId: string
  contentName: string
  contentDuration: number
  playerId: string
  playerName: string
  playlistId: string
  playlistName: string
  startTime: string
  endTime: string
  date: string
}

export interface ContentReportQuery {
  contentName?: string
  contentIds?: string[]
  dateFrom: string
  dateTo: string
}

export interface ContentReportRow {
  date: string
  dayOfWeek: string
  contentName: string
  contentDuration: number
  insertions: number
  playerName: string
  playerCode: string
  playlistName: string
}

export interface PlaybackLogRow {
  contentName: string
  date: string
  playerName: string
  contentDuration: number
}
