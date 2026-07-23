import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  downloadAsset: (url: string, contentId: string) =>
    ipcRenderer.invoke('download-asset', url, contentId),
  checkAsset: (contentId: string) =>
    ipcRenderer.invoke('check-asset', contentId),
  getAssetsPath: () => ipcRenderer.invoke('get-assets-path'),
  getAssetSize: (contentId: string) =>
    ipcRenderer.invoke('get-asset-size', contentId),
  clearAssets: () => ipcRenderer.invoke('clear-assets'),
})
