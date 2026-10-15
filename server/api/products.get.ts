import { products } from '~/data/products'
import { getSupabasePublic } from '~/server/utils/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabasePublic()
  if (!supabase) return { products, source: 'catalog-fallback' }

  const { data: productRows, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error || !productRows?.length) return { products, source: 'catalog-fallback' }

  const ids = productRows.map((item) => item.id)
  const [{ data: imageRows }, { data: variantRows }] = await Promise.all([
    supabase
      .from('product_images')
      .select('id,product_id,public_url,alt_text,sort_order,is_primary')
      .in('product_id', ids)
      .order('sort_order'),
    supabase
      .from('product_variants')
      .select('id,product_id,name,sku,options,price,supplier_sku,supplier_cost,stock_quantity,active,sort_order')
      .in('product_id', ids)
      .eq('active', true)
      .order('sort_order')
  ])

  const imagesByProduct = new Map<string, any[]>()
  for (const image of imageRows || []) {
    const list = imagesByProduct.get(image.product_id) || []
    list.push(image)
    imagesByProduct.set(image.product_id, list)
  }

  const variantsByProduct = new Map<string, any[]>()
  for (const variant of variantRows || []) {
    const list = variantsByProduct.get(variant.product_id) || []
    list.push(variant)
    variantsByProduct.set(variant.product_id, list)
  }

  return {
    products: productRows.map((item) => {
      const images = (imagesByProduct.get(item.id) || []).map((image) => ({
        id: image.id,
        publicUrl: image.public_url,
        altText: image.alt_text,
        sortOrder: image.sort_order,
        isPrimary: image.is_primary
      }))
      const primary = images.find((image) => image.isPrimary) || images[0] || null
      const variants = (variantsByProduct.get(item.id) || []).map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        options: variant.options || {},
        price: variant.price,
        supplierSku: variant.supplier_sku,
        supplierCost: variant.supplier_cost,
        stockQuantity: variant.stock_quantity,
        active: variant.active,
        sortOrder: variant.sort_order
      }))

      return {
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
        features: item.features,
        images,
        primaryImage: primary?.publicUrl || null,
        variants,
        material: item.material,
        weightGrams: item.weight_grams,
        dimensions: item.dimensions,
        deliveryMinDays: item.delivery_min_days,
        deliveryMaxDays: item.delivery_max_days,
        stockStatus: item.stock_status,
        stockQuantity: item.stock_quantity
      }
    }),
    source: 'supabase'
  }
})
