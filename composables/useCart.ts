import type { Product, ProductVariant } from '~/data/products'

export type CartLine = Pick<Product, 'id' | 'slug' | 'name' | 'emoji'> & {
  key: string
  price: number
  quantity: number
  variantId?: string | null
  variantName?: string | null
  image?: string | null
}

export const useCart = () => {
  const lines = useState<CartLine[]>('cart-lines', () => [])
  const hydrated = useState('cart-hydrated', () => false)

  const normalize = (raw: any[]): CartLine[] => raw.map((line) => ({
    key: line.key || `${line.id}:${line.variantId || 'base'}`,
    id: line.id,
    slug: line.slug,
    name: line.name,
    emoji: line.emoji || '🐾',
    price: Number(line.price) || 0,
    quantity: Math.max(1, Math.min(10, Number(line.quantity) || 1)),
    variantId: line.variantId || null,
    variantName: line.variantName || null,
    image: line.image || null
  }))

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem('norrli-pets-cart')
      if (raw) lines.value = normalize(JSON.parse(raw))
    } catch { /* ignore invalid local storage */ }
    hydrated.value = true
  }

  const persist = () => {
    if (import.meta.client) localStorage.setItem('norrli-pets-cart', JSON.stringify(lines.value))
  }

  const add = (product: Product, quantity = 1, variant?: ProductVariant | null) => {
    hydrate()
    const key = `${product.id}:${variant?.id || 'base'}`
    const found = lines.value.find((line) => line.key === key)
    if (found) {
      found.quantity = Math.min(10, found.quantity + quantity)
    } else {
      lines.value.push({
        key,
        id: product.id,
        slug: product.slug,
        name: product.name,
        emoji: product.emoji,
        price: variant?.price ?? product.price,
        quantity: Math.min(10, quantity),
        variantId: variant?.id || null,
        variantName: variant?.name || null,
        image: product.primaryImage || null
      })
    }
    lines.value = [...lines.value]
    persist()
  }

  const remove = (key: string) => {
    lines.value = lines.value.filter((line) => line.key !== key)
    persist()
  }

  const setQuantity = (key: string, quantity: number) => {
    const line = lines.value.find((item) => item.key === key)
    if (!line) return
    if (quantity <= 0) return remove(key)
    line.quantity = Math.min(10, quantity)
    lines.value = [...lines.value]
    persist()
  }

  const clear = () => { lines.value = []; persist() }
  const count = computed(() => lines.value.reduce((n, line) => n + line.quantity, 0))
  const subtotal = computed(() => lines.value.reduce((n, line) => n + line.price * line.quantity, 0))

  if (import.meta.client) onMounted(hydrate)
  return { lines, add, remove, setQuantity, clear, count, subtotal, hydrate }
}
