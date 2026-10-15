import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
 COLLECTION_NEEDS,NEED_LABELS,normalizeSearch,matchesSearch,matchesNeed,
 suggestProducts,filterStorefront,getComparison
} from '../utils/storefrontDiscovery.mjs'

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const PRODUCTS=[
 {id:'1',slug:'cleanroll',name:'CleanRoll™',subtitle:'Reusable pet-hair remover',description:'Sofa and fur',category:'Clean Home',price:32900,material:'Metal',features:['Reusable']},
 {id:'2',slug:'paw-cleaner',name:'PawClean Cup',subtitle:'Mud off',description:'Soft silicone bristles',category:'Clean Home',price:17900,features:['Easy clean']},
 {id:'3',slug:'fold-bowl',name:'FoldBowl Duo',subtitle:'Food and water',description:'Collapsible bowls',category:'Travel',price:24900,features:['Travel']},
 {id:'4',slug:'car-seat-cover',name:'RoadNest',subtitle:'Car cover',description:'Rear seat',category:'Travel',price:59900},
 {id:'5',slug:'slow-feeder',name:'CalmBite Bowl',subtitle:'Feeder',description:'Meal time',category:'Dogs',price:22900},
 {id:'6',slug:'grooming-brush',name:'SoftGroom Brush',subtitle:'Daily grooming',description:'Brush',category:'Cats',price:19900}
]
test('collection needs have stable distinct identifiers, labels and existing shop links',()=>{
 assert.equal(COLLECTION_NEEDS.length,4)
 assert.equal(new Set(COLLECTION_NEEDS.map(x=>x.id)).size,4)
 for(const x of COLLECTION_NEEDS){assert.equal(NEED_LABELS[x.id],x.title);assert.equal(x.href,'/shop?need='+x.id)}
})
test('Swedish text normalization matches accents and punctuation without unsafe HTML',()=>{
 assert.equal(normalizeSearch(' PÄLS-vård!   Skål '),'pals vard skal')
 assert.equal(normalizeSearch(' Hundar & Katter '),'hundar katter')
 assert.equal(normalizeSearch(''), '')
})
test('need collections map meaningfully to known products, not misleading broad categories',()=>{
 assert.deepEqual(PRODUCTS.filter(p=>matchesNeed(p,'clean-home')).map(p=>p.slug),['cleanroll','paw-cleaner'])
 assert.deepEqual(PRODUCTS.filter(p=>matchesNeed(p,'outdoors')).map(p=>p.slug),['fold-bowl','car-seat-cover'])
 assert.deepEqual(PRODUCTS.filter(p=>matchesNeed(p,'grooming')).map(p=>p.slug),['grooming-brush'])
 assert.deepEqual(PRODUCTS.filter(p=>matchesNeed(p,'feeding')).map(p=>p.slug),['fold-bowl','slow-feeder'])
})
test('Swedish aliases make English-backed product catalog discoverable',()=>{
 for(const [slug,q] of [
 ['cleanroll','päls'],['paw-cleaner','tassar'],['fold-bowl','vattenskål'],
 ['car-seat-cover','bilskydd'],['slow-feeder','matskål'],['grooming-brush','pälsborste']
 ])assert.ok(matchesSearch(PRODUCTS.find(p=>p.slug===slug),q),slug+' '+q)
})
test('search requires all terms; category labels work in Swedish',()=>{
 assert.equal(matchesSearch(PRODUCTS[0],'päls soffa'),true)
 assert.equal(matchesSearch(PRODUCTS[0],'päls bilbälte'),false)
 assert.equal(matchesSearch(PRODUCTS[5],'katt borste'),true)
 assert.equal(matchesSearch(PRODUCTS[3],'promenad kattleksak'),false)
})
test('search suggestions are bounded, ranked and absent for short queries',()=>{
 assert.deepEqual(suggestProducts(PRODUCTS,'p'),[])
 assert.equal(suggestProducts(PRODUCTS,'cleanroll',8)[0].slug,'cleanroll')
 assert.ok(suggestProducts(PRODUCTS,'päls',2).length<=2)
 assert.equal(suggestProducts(PRODUCTS,'nonsense').length,0)
})
test('existing price, sort, category and favorites filters remain composable',()=>{
 assert.deepEqual(filterStorefront(PRODUCTS,{need:'feeding',price:'under-250',sort:'name'}).map(p=>p.slug),['slow-feeder','fold-bowl'].sort((a,b)=>PRODUCTS.find(p=>p.slug===a).name.localeCompare(PRODUCTS.find(p=>p.slug===b).name,'sv')))
 assert.deepEqual(filterStorefront(PRODUCTS,{category:'Travel',price:'over-400'}).map(p=>p.slug),['car-seat-cover'])
 assert.deepEqual(filterStorefront(PRODUCTS,{favoritesOnly:true,favorites:['cleanroll','slow-feeder']}).map(p=>p.slug),['cleanroll','slow-feeder'])
 assert.deepEqual(filterStorefront(PRODUCTS,{need:'outdoors',query:'vatten'}).map(p=>p.slug),['fold-bowl'])
})
test('comparing supports only existing unique slugs, with maximum three products',()=>{
 assert.deepEqual(getComparison(PRODUCTS,'cleanroll,cleanroll,fold-bowl,slow-feeder,car-seat-cover').map(p=>p.slug),['cleanroll','fold-bowl','slow-feeder'])
 assert.deepEqual(getComparison(PRODUCTS,'does-not-exist,cleanroll').map(p=>p.slug),['cleanroll'])
 assert.deepEqual(getComparison(PRODUCTS,'').map(p=>p.slug),[])
})
test('shop exposes accessible search suggestion, filters, comparison and reversible selection',()=>{
 const page=read('pages/shop/index.vue')
 assert.match(page,/aria-expanded="showSuggestions"/)
 assert.match(page,/suggestProducts\(catalog\.value\?\.products/)
 assert.match(page,/selectedSlugs\.length<compareLimit/)
 assert.match(page,/aria-pressed="selectedSlugs.includes\(product.slug\)"/)
 assert.match(page,/const comparisonLink=computed/)
 assert.match(page,/need:need\.value/)
 assert.match(page,/\['category', 'need', 'q', 'sort', 'price', 'fav'\]/)
})
test('comparison route uses real catalog entries and honest provisional information',()=>{
 const page=read('pages/compare.vue')
 assert.match(page,/getComparison\(catalog\.value\?\.products/)
 assert.match(page,/<table class="norrli-compare-table">/)
 assert.match(page,/scope="col"/)
 assert.match(page,/scope="row"/)
 assert.match(page,/slutligt sortiment har verifierats/)
 assert.match(page,/Förhandsvisning – inga köp öppna ännu/)
 assert.doesNotMatch(page,/\/api\/checkout|checkoutEnabled=true|Lägg i varukorg/)
})
test('homepage curated tiles and founder credit preserve source integrity',()=>{
 const page=read('pages/index.vue')
 assert.match(page,/COLLECTION_NEEDS/)
 assert.match(page,/productsByNeed\(collection.id\)/)
 assert.match(page,/Hasan Iqram/)
 assert.match(page,/v-if="previewOnly"/)
 assert.match(page,/<NorrliLogo|<ProductCard/)
 const css=read('assets/css/premium-discovery.css')
 assert.doesNotMatch(css,/norrli-approved-logo|nordic-approved-logo-image|\.admin-shell/)
})
test('premium styling remains before final accessibility override and has mobile reduced-motion support',()=>{
 const nuxt=read('nuxt.config.ts'),css=read('assets/css/premium-discovery.css')
 assert.match(nuxt,/'~\/assets\/css\/premium-discovery.css', '~\/assets\/css\/accessibility.css'/)
 assert.match(css,/@media\(max-width:540px\)/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/\.norrli-premium-compare-bar/)
})
