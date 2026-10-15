<script setup lang="ts">
import {
  ArrowLeft, Save, Upload, Trash2, Star, Plus, ExternalLink,
  Package, Image as ImageIcon, Boxes, TrendingUp
} from 'lucide-vue-next'

type Supplier = {
  id:string
  name:string
  website_url:string|null
}

type ProductImageRow = {
  id:string
  product_id:string
  storage_path:string
  public_url:string
  alt_text:string|null
  sort_order:number
  is_primary:boolean
  is_concept:boolean
}

type VariantRow = {
  id:string
  product_id:string
  name:string
  sku:string|null
  options:Record<string,string>
  price:number|null
  supplier_sku:string|null
  supplier_cost:number|null
  stock_quantity:number|null
  active:boolean
  sort_order:number
  priceSEK?:number|null
  supplierCostSEK?:number|null
}

const route = useRoute()
const productId = String(route.params.id || '')
const loading = ref(true)
const authorized = ref(false)
const saving = ref(false)
const uploading = ref(false)
const feedback = ref('')
const feedbackType = ref<'success'|'error'>('success')
const product = ref<any>(null)
const suppliers = ref<Supplier[]>([])
const images = ref<ProductImageRow[]>([])
const variants = ref<VariantRow[]>([])
const costHistory = ref<any[]>([])

const editor = reactive({
  name:'',
  slug:'',
  subtitle:'',
  description:'',
  category:'Dogs',
  priceSEK:0,
  compareAtSEK:null as number|null,
  badge:'',
  featuresText:'',
  supplier_id:'',
  supplier_product_url:'',
  supplier_sku:'',
  supplierCostSEK:null as number|null,
  stock_status:'unknown',
  stock_quantity:null as number|null,
  lead_time_days:null as number|null,
  material:'',
  weight_grams:null as number|null,
  dimensions:'',
  delivery_min_days:null as number|null,
  delivery_max_days:null as number|null,
  seo_title:'',
  seo_description:'',
  active:false,
  sort_order:0
})

const newVariant = reactive({
  name:'',
  size:'',
  color:'',
  sku:'',
  priceSEK:null as number|null,
  supplier_sku:'',
  supplierCostSEK:null as number|null,
  stock_quantity:null as number|null,
  active:true
})

const formatSEK = (ore:number|null|undefined) => new Intl.NumberFormat('sv-SE',{
  style:'currency',currency:'SEK',maximumFractionDigits:2
}).format((ore || 0)/100)

const currentMarginOre = computed(() =>
  editor.supplierCostSEK == null ? null : Math.round((editor.priceSEK - editor.supplierCostSEK) * 100)
)
const currentMarginPct = computed(() => {
  if (editor.supplierCostSEK == null || editor.priceSEK <= 0) return null
  return Math.round(((editor.priceSEK - editor.supplierCostSEK) / editor.priceSEK) * 100)
})

const setFeedback = (message:string,type:'success'|'error'='success') => {
  feedback.value = message
  feedbackType.value = type
  window.setTimeout(() => { if (feedback.value === message) feedback.value = '' }, 4000)
}

const mapProduct = (p:any) => {
  product.value = p
  Object.assign(editor,{
    name:p.name || '',
    slug:p.slug || '',
    subtitle:p.subtitle || '',
    description:p.description || '',
    category:p.category || 'Dogs',
    priceSEK:Number(((p.price || 0)/100).toFixed(2)),
    compareAtSEK:p.compare_at == null ? null : Number((p.compare_at/100).toFixed(2)),
    badge:p.badge || '',
    featuresText:Array.isArray(p.features) ? p.features.join('\n') : '',
    supplier_id:p.supplier_id || '',
    supplier_product_url:p.supplier_product_url || '',
    supplier_sku:p.supplier_sku || '',
    supplierCostSEK:p.supplier_cost == null ? null : Number((p.supplier_cost/100).toFixed(2)),
    stock_status:p.stock_status || 'unknown',
    stock_quantity:p.stock_quantity,
    lead_time_days:p.lead_time_days,
    material:p.material || '',
    weight_grams:p.weight_grams,
    dimensions:p.dimensions || '',
    delivery_min_days:p.delivery_min_days,
    delivery_max_days:p.delivery_max_days,
    seo_title:p.seo_title || '',
    seo_description:p.seo_description || '',
    active:!!p.active,
    sort_order:p.sort_order || 0
  })
}

const load = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  loading.value = true

  const { data:userData } = await supabase.auth.getUser()
  if (!userData.user) {
    await navigateTo('/admin/login')
    return
  }

  const { data:adminRow } = await supabase.from('admins').select('user_id').eq('user_id',userData.user.id).maybeSingle()
  if (!adminRow) {
    authorized.value = false
    loading.value = false
    return
  }
  authorized.value = true

  const [productResult,supplierResult,imageResult,variantResult,costResult] = await Promise.all([
    supabase.from('products').select('*').eq('id',productId).maybeSingle(),
    supabase.from('suppliers').select('id,name,website_url').eq('active',true).order('name'),
    supabase.from('product_images').select('*').eq('product_id',productId).order('sort_order'),
    supabase.from('product_variants').select('*').eq('product_id',productId).order('sort_order'),
    supabase.from('product_cost_history').select('*').eq('product_id',productId).order('effective_at',{ascending:false}).limit(50)
  ])

  if (!productResult.data) {
    throw createError({statusCode:404,statusMessage:'Product not found'})
  }

  mapProduct(productResult.data)
  suppliers.value = supplierResult.data || []
  images.value = imageResult.data || []
  variants.value = (variantResult.data || []).map((v:any)=>({
    ...v,
    priceSEK:v.price == null ? null : Number((v.price/100).toFixed(2)),
    supplierCostSEK:v.supplier_cost == null ? null : Number((v.supplier_cost/100).toFixed(2))
  }))
  costHistory.value = costResult.data || []
  loading.value = false
}

const saveProduct = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase || !product.value) return
  saving.value = true

  const features = editor.featuresText.split('\n').map(v=>v.trim()).filter(Boolean)
  const { data,error } = await supabase.from('products').update({
    name:editor.name.trim(),
    slug:editor.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    subtitle:editor.subtitle.trim(),
    description:editor.description.trim(),
    category:editor.category,
    price:Math.max(0,Math.round(Number(editor.priceSEK)*100)),
    compare_at:editor.compareAtSEK == null ? null : Math.max(0,Math.round(Number(editor.compareAtSEK)*100)),
    badge:editor.badge.trim() || null,
    features,
    supplier_id:editor.supplier_id || null,
    supplier_product_url:editor.supplier_product_url.trim() || null,
    supplier_sku:editor.supplier_sku.trim() || null,
    supplier_cost:editor.supplierCostSEK == null ? null : Math.max(0,Math.round(Number(editor.supplierCostSEK)*100)),
    stock_status:editor.stock_status,
    stock_quantity:editor.stock_quantity,
    lead_time_days:editor.lead_time_days,
    material:editor.material.trim() || null,
    weight_grams:editor.weight_grams,
    dimensions:editor.dimensions.trim() || null,
    delivery_min_days:editor.delivery_min_days,
    delivery_max_days:editor.delivery_max_days,
    seo_title:editor.seo_title.trim() || null,
    seo_description:editor.seo_description.trim() || null,
    active:editor.active,
    sort_order:Number(editor.sort_order) || 0,
    updated_at:new Date().toISOString()
  }).eq('id',productId).select('*').single()

  saving.value = false
  if (error) return setFeedback(error.message,'error')
  mapProduct(data)
  await refreshCostHistory()
  setFeedback('Product saved')
}

const refreshCostHistory = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { data } = await supabase.from('product_cost_history').select('*').eq('product_id',productId).order('effective_at',{ascending:false}).limit(50)
  costHistory.value = data || []
}

const uploadImages = async (event:Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  const supabase = useSupabaseBrowser()
  if (!supabase) return
  uploading.value = true

  try {
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)) {
        throw new Error(`${file.name}: unsupported image type`)
      }
      if (file.size > 8*1024*1024) throw new Error(`${file.name}: maximum size is 8 MB`)

      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-')
      const path = `${productId}/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safe}`
      const { error:uploadError } = await supabase.storage.from('product-images').upload(path,file,{
        cacheControl:'3600',
        contentType:file.type,
        upsert:false
      })
      if (uploadError) throw uploadError

      const { data:urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      const isPrimary = images.value.length === 0
      const { error:dbError } = await supabase.from('product_images').insert({
        product_id:productId,
        storage_path:path,
        public_url:urlData.publicUrl,
        alt_text:editor.name,
        sort_order:images.value.length,
        is_primary:isPrimary,
        is_concept:false
      })
      if (dbError) {
        await supabase.storage.from('product-images').remove([path])
        throw dbError
      }
    }

    const { data } = await supabase.from('product_images').select('*').eq('product_id',productId).order('sort_order')
    images.value = data || []
    setFeedback(`${files.length} image${files.length===1?'':'s'} uploaded`)
  } catch (error:any) {
    setFeedback(error?.message || 'Image upload failed','error')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const setPrimary = async (image:ProductImageRow) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  await supabase.from('product_images').update({is_primary:false}).eq('product_id',productId)
  const { error } = await supabase.from('product_images').update({is_primary:true}).eq('id',image.id)
  if (error) return setFeedback(error.message,'error')
  images.value = images.value.map(i=>({...i,is_primary:i.id===image.id}))
  setFeedback('Primary image updated')
}

const deleteImage = async (image:ProductImageRow) => {
  if (!confirm('Remove this image from the product gallery?')) return
  const supabase = useSupabaseBrowser()
  if (!supabase) return

  // Concept images hosted in GitHub are not Supabase Storage objects.
  const { error } = await supabase.from('product_images').delete().eq('id', image.id)
  if (error) return setFeedback(error.message, 'error')

  images.value = images.value.filter(i => i.id !== image.id)
  if (image.is_primary && images.value[0]) await setPrimary(images.value[0])

  if (!image.storage_path.startsWith('site-assets/')) {
    const { error: storageError } = await supabase.storage.from('product-images').remove([image.storage_path])
    if (storageError) {
      return setFeedback('Image removed from gallery. File cleanup needs attention.', 'error')
    }
  }

  setFeedback('Image removed from gallery')
}

const createVariant = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  if (!newVariant.name.trim()) return setFeedback('Variant name is required','error')

  const options:Record<string,string> = {}
  if (newVariant.size.trim()) options.Size = newVariant.size.trim()
  if (newVariant.color.trim()) options.Color = newVariant.color.trim()

  const { error } = await supabase.from('product_variants').insert({
    product_id:productId,
    name:newVariant.name.trim(),
    sku:newVariant.sku.trim() || null,
    options,
    price:newVariant.priceSEK == null ? null : Math.round(Number(newVariant.priceSEK)*100),
    supplier_sku:newVariant.supplier_sku.trim() || null,
    supplier_cost:newVariant.supplierCostSEK == null ? null : Math.round(Number(newVariant.supplierCostSEK)*100),
    stock_quantity:newVariant.stock_quantity,
    active:newVariant.active,
    sort_order:variants.value.length
  })
  if (error) return setFeedback(error.message,'error')

  Object.assign(newVariant,{name:'',size:'',color:'',sku:'',priceSEK:null,supplier_sku:'',supplierCostSEK:null,stock_quantity:null,active:true})
  await refreshVariants()
  setFeedback('Variant created')
}

const refreshVariants = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { data } = await supabase.from('product_variants').select('*').eq('product_id',productId).order('sort_order')
  variants.value = (data || []).map((v:any)=>({
    ...v,
    priceSEK:v.price == null ? null : Number((v.price/100).toFixed(2)),
    supplierCostSEK:v.supplier_cost == null ? null : Number((v.supplier_cost/100).toFixed(2))
  }))
}

const saveVariant = async (variant:VariantRow) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { error } = await supabase.from('product_variants').update({
    name:variant.name.trim(),
    sku:variant.sku?.trim() || null,
    price:variant.priceSEK == null ? null : Math.round(Number(variant.priceSEK)*100),
    supplier_sku:variant.supplier_sku?.trim() || null,
    supplier_cost:variant.supplierCostSEK == null ? null : Math.round(Number(variant.supplierCostSEK)*100),
    stock_quantity:variant.stock_quantity,
    active:variant.active,
    sort_order:variant.sort_order,
    updated_at:new Date().toISOString()
  }).eq('id',variant.id)
  if (error) return setFeedback(error.message,'error')
  setFeedback(`${variant.name} saved`)
}

const deleteVariant = async (variant:VariantRow) => {
  if (!confirm(`Delete variant "${variant.name}"?`)) return
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { error } = await supabase.from('product_variants').delete().eq('id',variant.id)
  if (error) return setFeedback(error.message,'error')
  variants.value = variants.value.filter(v=>v.id!==variant.id)
  setFeedback('Variant deleted')
}

onMounted(load)
useSeoMeta({title:'Manage product',robots:'noindex,nofollow'})
</script>

<template>
  <main class="admin-shell product-manager-shell">
    <header class="admin-topbar">
      <NorrliLogo compact />
      <NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/>Admin</NuxtLink>
    </header>

    <section v-if="loading" class="admin-center">Loading product…</section>
    <section v-else-if="!authorized" class="admin-center"><h1>Access denied</h1><NuxtLink to="/admin/login">Sign in</NuxtLink></section>

    <template v-else>
      <section class="product-manager-head">
        <div>
          <NuxtLink to="/admin" class="text-link"><ArrowLeft :size="15"/>Products</NuxtLink>
          <span class="eyebrow">Product Manager v2</span>
          <h1>{{ editor.name }}</h1>
          <p>{{ editor.slug }} · {{ editor.category }}</p>
        </div>
        <div class="product-manager-actions">
          <span :class="['status-pill',editor.active?'good':'muted-pill']">{{ editor.active ? 'Published' : 'Draft' }}</span>
          <button class="btn btn-primary" :disabled="saving" @click="saveProduct"><Save :size="17"/>{{ saving ? 'Saving…' : 'Save product' }}</button>
        </div>
      </section>

      <p v-if="feedback" :class="['admin-feedback','product-manager-feedback',feedbackType]">{{ feedback }}</p>

      <section class="profit-strip">
        <div><span>Selling price</span><strong>{{ formatSEK(Math.round(editor.priceSEK*100)) }}</strong></div>
        <div><span>Supplier cost</span><strong>{{ editor.supplierCostSEK == null ? '—' : formatSEK(Math.round(editor.supplierCostSEK*100)) }}</strong></div>
        <div><span>Gross margin</span><strong>{{ currentMarginOre == null ? '—' : formatSEK(currentMarginOre) }}</strong></div>
        <div><span>Margin %</span><strong>{{ currentMarginPct == null ? '—' : currentMarginPct + '%' }}</strong></div>
      </section>

      <div class="product-manager-grid">
        <section class="pm-card pm-main">
          <div class="pm-card-head"><Package :size="19"/><div><h2>Product details</h2><p>Customer-facing information and publishing.</p></div></div>
          <div class="pm-fields">
            <label>Name<input v-model="editor.name"></label>
            <label>Slug<input v-model="editor.slug"></label>
            <label>Subtitle<input v-model="editor.subtitle"></label>
            <label>Category<select v-model="editor.category"><option>Dogs</option><option>Cats</option><option>Travel</option><option>Clean Home</option></select></label>
            <label>Selling price (SEK)<input v-model.number="editor.priceSEK" type="number" min="0" step="0.01"></label>
            <label>Compare-at price (SEK)<input v-model.number="editor.compareAtSEK" type="number" min="0" step="0.01"></label>
            <label>Badge<input v-model="editor.badge" placeholder="Bestseller"></label>
            <label>Sort order<input v-model.number="editor.sort_order" type="number" min="0"></label>
            <label class="pm-wide">Description<textarea v-model="editor.description" rows="5"></textarea></label>
            <label class="pm-wide">Features <small>One feature per line</small><textarea v-model="editor.featuresText" rows="5"></textarea></label>
            <label class="check-label"><input v-model="editor.active" type="checkbox">Published / visible in store</label>
          </div>
        </section>

        <section class="pm-card">
          <div class="pm-card-head"><TrendingUp :size="19"/><div><h2>Sourcing & profit</h2><p>Supplier link, cost and logistics.</p></div></div>
          <div class="pm-fields one-col">
            <label>Supplier<select v-model="editor.supplier_id"><option value="">No supplier</option><option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option></select></label>
            <label>Supplier product URL<input v-model="editor.supplier_product_url" type="url" placeholder="https://..."></label>
            <a v-if="editor.supplier_product_url" :href="editor.supplier_product_url" target="_blank" rel="noreferrer" class="text-link"><ExternalLink :size="15"/>Open supplier product</a>
            <label>Supplier SKU<input v-model="editor.supplier_sku"></label>
            <label>Supplier cost (SEK)<input v-model.number="editor.supplierCostSEK" type="number" min="0" step="0.01"></label>
            <label>Stock status<select v-model="editor.stock_status"><option value="unknown">Unknown</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option><option value="discontinued">Discontinued</option></select></label>
            <label>Supplier stock qty<input v-model.number="editor.stock_quantity" type="number" min="0"></label>
            <label>Supplier lead time (days)<input v-model.number="editor.lead_time_days" type="number" min="0"></label>
          </div>
        </section>

        <section class="pm-card pm-main">
          <div class="pm-card-head"><ImageIcon :size="19"/><div><h2>Product photos</h2><p>Upload JPG, PNG, WebP or AVIF. Maximum 8 MB each.</p></div></div>
          <label class="image-upload">
            <Upload :size="22"/>
            <span>{{ uploading ? 'Uploading…' : 'Upload product images' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple :disabled="uploading" @change="uploadImages">
          </label>
          <div v-if="images.length" class="pm-image-grid">
            <article v-for="image in images" :key="image.id" :class="['pm-image-card',{primary:image.is_primary}]">
              <img :src="image.public_url" :alt="image.alt_text || editor.name" loading="lazy">
              <p v-if="image.is_concept" class="pm-concept-note">AI concept — replace after sourcing</p>
              <div class="pm-image-actions">
                <button class="btn btn-secondary compact" :disabled="image.is_primary" @click="setPrimary(image)"><Star :size="14"/>{{ image.is_primary ? 'Primary' : 'Set primary' }}</button>
                <button class="icon-danger" title="Delete image" @click="deleteImage(image)"><Trash2 :size="16"/></button>
              </div>
            </article>
          </div>
          <div v-else class="admin-empty compact-empty">No real product photos yet. The storefront will keep using the current emoji placeholder until you upload one.</div>
        </section>

        <section class="pm-card">
          <div class="pm-card-head"><Boxes :size="19"/><div><h2>Physical details</h2><p>Useful for customers and shipping later.</p></div></div>
          <div class="pm-fields one-col">
            <label>Material<input v-model="editor.material" placeholder="Silicone, polyester…"></label>
            <label>Weight (grams)<input v-model.number="editor.weight_grams" type="number" min="0"></label>
            <label>Dimensions<input v-model="editor.dimensions" placeholder="30 × 20 × 5 cm"></label>
            <div class="pm-split">
              <label>Delivery min days<input v-model.number="editor.delivery_min_days" type="number" min="0"></label>
              <label>Delivery max days<input v-model.number="editor.delivery_max_days" type="number" min="0"></label>
            </div>
          </div>
        </section>

        <section class="pm-card pm-full">
          <div class="pm-card-head"><Boxes :size="19"/><div><h2>Variants</h2><p>Sizes, colors or supplier-specific options. Variant price overrides the base price when set.</p></div></div>
          <form class="variant-create-grid" @submit.prevent="createVariant">
            <label>Variant name<input v-model="newVariant.name" placeholder="Large · Forest Green" required></label>
            <label>Size<input v-model="newVariant.size" placeholder="L"></label>
            <label>Color<input v-model="newVariant.color" placeholder="Forest Green"></label>
            <label>Store SKU<input v-model="newVariant.sku"></label>
            <label>Price SEK <small>optional override</small><input v-model.number="newVariant.priceSEK" type="number" min="0" step="0.01"></label>
            <label>Supplier SKU<input v-model="newVariant.supplier_sku"></label>
            <label>Supplier cost SEK<input v-model.number="newVariant.supplierCostSEK" type="number" min="0" step="0.01"></label>
            <label>Stock qty<input v-model.number="newVariant.stock_quantity" type="number" min="0"></label>
            <label class="check-label"><input v-model="newVariant.active" type="checkbox">Active</label>
            <button class="btn btn-primary compact" type="submit"><Plus :size="15"/>Add variant</button>
          </form>

          <div v-if="variants.length" class="variant-admin-list">
            <article v-for="variant in variants" :key="variant.id" class="variant-admin-row">
              <div class="variant-admin-main">
                <input v-model="variant.name" class="admin-input">
                <small>{{ Object.entries(variant.options || {}).map(([k,v])=>k+': '+v).join(' · ') || 'No option metadata' }}</small>
              </div>
              <label>Price SEK<input v-model.number="variant.priceSEK" type="number" min="0" step="0.01"></label>
              <label>Supplier SKU<input v-model="variant.supplier_sku"></label>
              <label>Cost SEK<input v-model.number="variant.supplierCostSEK" type="number" min="0" step="0.01"></label>
              <label>Stock<input v-model.number="variant.stock_quantity" type="number" min="0"></label>
              <label class="check-label"><input v-model="variant.active" type="checkbox">Active</label>
              <button class="btn btn-secondary compact" @click="saveVariant(variant)"><Save :size="14"/>Save</button>
              <button class="icon-danger" @click="deleteVariant(variant)"><Trash2 :size="16"/></button>
            </article>
          </div>
          <div v-else class="admin-empty compact-empty">No variants. Customers will buy the base product directly.</div>
        </section>

        <section class="pm-card">
          <div class="pm-card-head"><TrendingUp :size="19"/><div><h2>Cost history</h2><p>Supplier-cost changes are recorded automatically.</p></div></div>
          <div v-if="costHistory.length" class="cost-history">
            <div v-for="entry in costHistory" :key="entry.id">
              <strong>{{ formatSEK(entry.cost) }}</strong>
              <span>{{ new Date(entry.effective_at).toLocaleDateString('sv-SE') }}</span>
              <small>{{ entry.note || entry.source }}</small>
            </div>
          </div>
          <div v-else class="admin-empty compact-empty">No supplier-cost changes recorded yet.</div>
        </section>

        <section class="pm-card">
          <div class="pm-card-head"><TrendingUp :size="19"/><div><h2>SEO</h2><p>Optional search/social copy.</p></div></div>
          <div class="pm-fields one-col">
            <label>SEO title<input v-model="editor.seo_title" maxlength="70" :placeholder="editor.name"></label>
            <label>SEO description<textarea v-model="editor.seo_description" maxlength="180" rows="4" :placeholder="editor.description"></textarea></label>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
