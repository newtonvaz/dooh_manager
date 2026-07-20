import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

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
        const parts = lines[1].split(',')
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
    const data = await res.json()
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

function getCmsBaseUrl(): string | null {
  if (isDev) return 'http://localhost:3000'
  return process.env.CMS_URL || null
}

async function sendDeviceInfoToCms(code: string): Promise<void> {
  const cmsUrl = getCmsBaseUrl()
  if (!cmsUrl) return

  try {
    const info = getDeviceInfo()
    const publicIp = await getPublicIp()

    const res = await fetch(`${cmsUrl}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        version: info.playerVersion,
        ip: info.localIp,
        storageUsed: info.storageUsed,
        totalStorage: info.storageTotal,
        storageFree: info.storageFree,
        electronVersion: info.electronVersion,
        publicIp,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Falha ao enviar device info ao CMS (${res.status}): ${text}`)
    }
  } catch (err) {
    console.error('Falha ao enviar device info ao CMS:', err)
  }
}

let deviceInfoInterval: ReturnType<typeof setInterval> | null = null

function getRendererUrl(): string {
  if (isDev) return 'http://localhost:3000'
  const outDir = path.join(__dirname, '../out')
  const indexHtml = path.join(outDir, 'player-info.html')
  if (fs.existsSync(indexHtml)) {
    return `file://${indexHtml}`
  }
  return `file://${path.join(outDir, 'index.html')}`
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

app.whenReady().then(async () => {
  ipcMain.handle('get-device-info', async () => {
    const info = getDeviceInfo()
    info.publicIp = await getPublicIp()
    return info
  })

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', () => {
  if (deviceInfoInterval) clearInterval(deviceInfoInterval)
  if (process.platform !== 'darwin') app.quit()
})
