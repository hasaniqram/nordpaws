import { products } from '~/data/products'
import { getSupabasePublic } from '~/server/utils/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabasePublic()
  if (!supabase) return { products, source: 'catalog-fallback' }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error || !data?.length) return { products, source: 'catalog-fallback' }

  return {
    products: data.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      subtitle: item.subtitle,
      description: item.description,
      category: item.category,
      price: item.price,
      compareAt: item.compare_at,
      badge: item.badge,
      emoji: item.emoji,
      gradient: item.gradient,
      features: item.features
    })),
    source: 'supabase'
  }
})
