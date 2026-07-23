interface ElectronAPI {
  getDeviceInfo: () => Promise<{
    playerVersion: string
    electronVersion: string
    localIp: string
    publicIp: string
    storageTotal: number
    storageUsed: number
    storageFree: number
  }>
  downloadAsset: (url: string, contentId: string) => Promise<string>
  checkAsset: (contentId: string) => Promise<string | null>
  getAssetsPath: () => Promise<string>
  getAssetSize: (contentId: string) => Promise<number>
  clearAssets: () => Promise<boolean>
}

interface Window {
  electronAPI?: ElectronAPI
}
