export interface AdminBranding {
  id: string
  systemName: string
  systemSubtitle: string
  logoUrl: string | null
  logoSmalUrl: string | null
  faviconUrl: string | null
  loginLogoUrl: string | null
  loginBackgroundUrl: string | null
  reportLogoUrl: string | null
  updatedAt: string
}

export interface AdminTheme {
  id: string
  name: string
  mode: "light" | "dark" | "auto" | "custom"
  isActive: boolean
  colors: ThemeColors
  createdAt: string
  updatedAt: string
}

export interface ThemeColors {
  primary?: string
  secondary?: string
  accent?: string
  success?: string
  warning?: string
  error?: string
  info?: string
  background?: string
  card?: string
  sidebar?: string
  sidebarForeground?: string
  header?: string
  button?: string
  link?: string
  text?: string
  icon?: string
  chart?: string
  table?: string
  border?: string
}

export interface AdminSettings {
  platform: {
    companyName: string
    cmsUrl: string
    language: string
    timezone: string
    dateFormat: string
    timeFormat: string
    uploadMaxSize: number
    uploadAllowedTypes: string
    cacheTime: number
    syncInterval: number
    heartbeatTimeout: number
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    fromName: string
    fromEmail: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    forcePasswordChange: boolean
    passwordMinLength: number
  }
}

export interface AuditLog {
  id: string
  userName: string
  userEmail: string
  action: string
  entityType: string | null
  entityId: string | null
  description: string
  ip: string
  createdAt: string
}
