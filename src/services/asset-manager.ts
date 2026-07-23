export interface PlaylistAsset {
  contentId: string
  url: string
  type: string
  name: string
}

export interface AssetDownloadResult {
  contentId: string
  localUrl: string
  wasCached: boolean
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export async function resolveAssetUrl(
  url: string,
  contentId: string,
): Promise<string> {
  if (!isElectron()) return url

  try {
    const cached = await window.electronAPI!.checkAsset(contentId)
    if (cached) return cached

    const localUrl = await window.electronAPI!.downloadAsset(url, contentId)
    return localUrl
  } catch {
    return url
  }
}

export async function resolveAssetUrls(
  assets: PlaylistAsset[],
): Promise<PlaylistAsset[]> {
  if (!isElectron() || assets.length === 0) return assets

  const results = await Promise.allSettled(
    assets.map(async (asset) => {
      const resolvedUrl = await resolveAssetUrl(asset.url, asset.contentId)
      return { ...asset, url: resolvedUrl }
    }),
  )

  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : assets[i],
  )
}

export async function preloadAssets(assets: PlaylistAsset[]): Promise<AssetDownloadResult[]> {
  if (!isElectron() || assets.length === 0) return []

  const results: AssetDownloadResult[] = []

  for (const asset of assets) {
    try {
      const cached = await window.electronAPI!.checkAsset(asset.contentId)
      if (cached) {
        results.push({ contentId: asset.contentId, localUrl: cached, wasCached: true })
        continue
      }

      const localUrl = await window.electronAPI!.downloadAsset(asset.url, asset.contentId)
      results.push({ contentId: asset.contentId, localUrl, wasCached: false })
    } catch {
      results.push({ contentId: asset.contentId, localUrl: asset.url, wasCached: false })
    }
  }

  return results
}
