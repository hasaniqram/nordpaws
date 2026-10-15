export const useNorrliFavorites = () => {
  const favorites = useState<string[]>('norrli-favorite-slugs', () => [])
  const loaded = useState<boolean>('norrli-favorites-loaded', () => false)
  const load = () => {
    if (!import.meta.client || loaded.value) return
    try {
      const saved = JSON.parse(localStorage.getItem('norrli-favorites-v1') || '[]')
      favorites.value = Array.isArray(saved) ? saved.filter(x => typeof x === 'string').slice(0, 100) : []
    } catch { favorites.value = [] }
    loaded.value = true
  }
  const has = (slug: string) => favorites.value.includes(slug)
  const toggle = (slug: string) => {
    if (!import.meta.client) return
    load()
    favorites.value = has(slug) ? favorites.value.filter(x => x !== slug) : [...favorites.value, slug]
    try { localStorage.setItem('norrli-favorites-v1', JSON.stringify(favorites.value)) } catch {}
  }
  const clear = () => {
    if (!import.meta.client) return
    load()
    favorites.value = []
    try { localStorage.setItem('norrli-favorites-v1', '[]') } catch {}
  }
  return { favorites, loaded, load, has, toggle, clear }
}
