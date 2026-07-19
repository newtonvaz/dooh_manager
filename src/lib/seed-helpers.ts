function camelToSnake(str: string): string {
  return str.replace(/^[A-Z]/, c => c.toLowerCase())
            .replace(/(?<![A-Z])[A-Z]/g, c => `_${c.toLowerCase()}`)
}

export function mapKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key]
  }
  return result
}
