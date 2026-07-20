import type { DeviceInfo } from '@/types/device-info'

interface ElectronAPI {
  getDeviceInfo: () => Promise<DeviceInfo>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

const UNAVAILABLE: DeviceInfo = {
  playerVersion: 'Não disponível',
  electronVersion: 'Não disponível',
  localIp: 'Não disponível',
  publicIp: 'Não disponível',
  storageTotal: 0,
  storageUsed: 0,
  storageFree: 0,
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      return await window.electronAPI.getDeviceInfo()
    } catch {
      return UNAVAILABLE
    }
  }
  return UNAVAILABLE
}
