import { products } from '~/data/products'
import { getSupabaseAdmin } from '~/server/utils/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { products, source: 'catalog-fallback' }
  const { data, error } = await supabase.from('products').select('*').eq('active', true).order('sort_order')
  if (error || !data?.length) return { products, source: 'catalog-fallback' }
  return { products: data, source: 'supabase' }
})
