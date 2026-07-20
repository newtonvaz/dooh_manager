import type { DeviceInfo } from '@/types/device-info'

interface ElectronAPI {
  getDeviceInfo: () => Promise<DeviceInfo>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      return await window.electronAPI.getDeviceInfo()
    } catch {
      return null
    }
  }
  return null
}
