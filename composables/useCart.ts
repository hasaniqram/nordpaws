import type { Product } from '~/data/products'

type CartLine = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'emoji'> & { quantity: number }

export const useCart = () => {
  const lines = useState<CartLine[]>('cart-lines', () => [])
  const hydrated = useState('cart-hydrated', () => false)

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem('nordpaws-cart')
      if (raw) lines.value = JSON.parse(raw)
    } catch { /* ignore invalid local storage */ }
    hydrated.value = true
  }

  const persist = () => {
    if (import.meta.client) localStorage.setItem('nordpaws-cart', JSON.stringify(lines.value))
  }

  const add = (product: Product, quantity = 1) => {
    hydrate()
    const found = lines.value.find((line) => line.id === product.id)
    if (found) found.quantity += quantity
    else lines.value.push({ id: product.id, slug: product.slug, name: product.name, price: product.price, emoji: product.emoji, quantity })
    lines.value = [...lines.value]
    persist()
  }

  const remove = (id: string) => {
    lines.value = lines.value.filter((line) => line.id !== id)
    persist()
  }

  const setQuantity = (id: string, quantity: number) => {
    const line = lines.value.find((item) => item.id === id)
    if (!line) return
    if (quantity <= 0) return remove(id)
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
