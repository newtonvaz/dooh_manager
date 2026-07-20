import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'

let mainWindow: BrowserWindow | null = null

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

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    await mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadURL(`file://${path.join(__dirname, '../out/index.html')}`)
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
  if (process.platform !== 'darwin') app.quit()
})
