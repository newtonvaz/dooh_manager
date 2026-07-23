import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null
let assetsDir = ''

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

function getAssetsDir(): string {
  if (assetsDir) return assetsDir
  assetsDir = path.join(app.getPath('userData'), 'assets')
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
  }
  return assetsDir
}

function getLocalIp(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name]
    if (!ifaces) continue
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'Não disponível'
}

function getStorageInfo(): { total: number; used: number; free: number } {
  try {
    const platform = os.platform()
    if (platform === 'darwin' || platform === 'linux') {
      const stdout = execSync('df -k /', { encoding: 'utf-8', timeout: 3000 })
      const lines = stdout.trim().split('\n')
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/)
        const total = parseInt(parts[1], 10) * 1024
        const used = parseInt(parts[2], 10) * 1024
        const free = parseInt(parts[3], 10) * 1024
        return { total, used, free }
      }
    }
    if (platform === 'win32') {
      const stdout = execSync('wmic logicaldisk where drivetype=3 get size,freespace /format:csv', { encoding: 'utf-8', timeout: 3000 })
      const lines = stdout.trim().split('\n').filter(Boolean)
      if (lines.length >= 2) {
        const parts = lines[2].split(',')
        const total = parseInt(parts[2], 10)
        const free = parseInt(parts[1], 10)
        return { total, used: total - free, free }
      }
    }
  } catch {
    // silent fail
  }
  return { total: 0, used: 0, free: 0 }
}

async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data: any = await res.json()
    return data.ip
  } catch {
    return 'Não disponível'
  }
}

function getDeviceInfo() {
  const storage = getStorageInfo()
  return {
    playerVersion: app.isPackaged ? app.getVersion() : process.env.npm_package_version || '0.1.0',
    electronVersion: process.versions.electron ?? 'Não disponível',
    localIp: getLocalIp(),
    publicIp: '',
    storageTotal: storage.total,
    storageUsed: storage.used,
    storageFree: storage.free,
  }
}

function getPlayerCode(): string | null {
  const codeIdx = process.argv.indexOf('--code')
  if (codeIdx !== -1 && codeIdx + 1 < process.argv.length) {
    return process.argv[codeIdx + 1]
  }
  return process.env.PLAYER_CODE || null
}

function getCmsBaseUrl(): string {
  if (isDev) return process.env.CMS_URL || 'http://localhost:3000'
  return process.env.CMS_URL || 'https://dooh-manager-app.vercel.app'
}

async function sendDeviceInfoToCms(code: string): Promise<void> {
  const cmsUrl = getCmsBaseUrl()
  if (!cmsUrl) {
    console.warn('[DeviceInfo] CMS_URL não configurada — dados não enviados')
    return
  }

  try {
    const info = getDeviceInfo()
    const publicIp = await getPublicIp()

    const localAssets = getLocalAssetsSize()

    const payload = {
      code,
      version: info.playerVersion,
      ip: info.localIp,
      storageUsed: info.storageUsed,
      totalStorage: info.storageTotal,
      storageFree: info.storageFree,
      electronVersion: info.electronVersion,
      publicIp,
      localAssets,
    }

    console.log('[DeviceInfo] Enviando para', `${cmsUrl}/api/heartbeat`, JSON.stringify(payload, null, 2))

    const res = await fetch(`${cmsUrl}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      console.log('[DeviceInfo] Dados enviados com sucesso')
    } else {
      const text = await res.text()
      console.error(`[DeviceInfo] Falha (${res.status}): ${text}`)
    }
  } catch (err) {
    console.error('[DeviceInfo] Erro ao enviar:', err)
  }
}

function getLocalAssetsSize(): number {
  try {
    const dir = getAssetsDir()
    let totalSize = 0
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile()) {
        const stat = fs.statSync(path.join(dir, entry.name))
        totalSize += stat.size
      }
    }
    return totalSize
  } catch {
    return 0
  }
}

let deviceInfoInterval: ReturnType<typeof setInterval> | null = null

function getRendererUrl(): string {
  const code = getPlayerCode()
  const baseUrl = getCmsBaseUrl()

  if (code) {
    return `${baseUrl}/player-view/${code}`
  }

  return baseUrl
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  await mainWindow.loadURL(getRendererUrl())

  const code = getPlayerCode()
  if (code) {
    sendDeviceInfoToCms(code)
    deviceInfoInterval = setInterval(() => sendDeviceInfoToCms(code), 5 * 60 * 1000)
  }
}

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.svg': 'image/svg+xml',
}

function setupAssetProtocol() {
  const assetDir = getAssetsDir()
  protocol.handle('asset', (request) => {
    const filePath = decodeURIComponent(request.url.replace('asset://', ''))
    const fullPath = path.join(assetDir, path.basename(filePath))
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath)
      const ext = path.extname(fullPath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      return new Response(data, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'no-cache' },
      })
    }
    return new Response('Not found', { status: 404 })
  })
}

async function downloadAsset(url: string, contentId: string): Promise<string> {
  const dir = getAssetsDir()
  const ext = path.extname(new URL(url).pathname) || '.bin'
  const filename = `${contentId}${ext}`
  const filePath = path.join(dir, filename)

  if (fs.existsSync(filePath)) {
    return `asset://${filename}`
  }

  console.log(`[Assets] Downloading ${url} -> ${filename}`)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(filePath, buffer)
    console.log(`[Assets] Downloaded ${filename} (${buffer.length} bytes)`)
    return `asset://${filename}`
  } catch (err) {
    console.error(`[Assets] Falha ao baixar ${url}:`, err)
    return url
  }
}

function setupIpcHandlers() {
  ipcMain.handle('get-device-info', async () => {
    const info = getDeviceInfo()
    info.publicIp = await getPublicIp()
    return info
  })

  ipcMain.handle('download-asset', async (_event, url: string, contentId: string) => {
    return downloadAsset(url, contentId)
  })

  ipcMain.handle('check-asset', async (_event, contentId: string) => {
    const dir = getAssetsDir()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith(contentId)) {
        return `asset://${entry.name}`
      }
    }
    return null
  })

  ipcMain.handle('get-assets-path', async () => {
    return getAssetsDir()
  })

  ipcMain.handle('get-asset-size', async (_event, contentId: string) => {
    const dir = getAssetsDir()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith(contentId)) {
        const stat = fs.statSync(path.join(dir, entry.name))
        return stat.size
      }
    }
    return 0
  })

  ipcMain.handle('clear-assets', async () => {
    const dir = getAssetsDir()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile()) {
        fs.unlinkSync(path.join(dir, entry.name))
      }
    }
    return true
  })
}

app.whenReady().then(async () => {
  getAssetsDir()
  setupAssetProtocol()
  setupIpcHandlers()

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', () => {
  if (deviceInfoInterval) clearInterval(deviceInfoInterval)
  if (process.platform !== 'darwin') app.quit()
})
