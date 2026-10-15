import test from 'node:test'
import assert from 'node:assert/strict'
import { COLLECTION_NEEDS, filterStorefront, matchesSearch, getComparison, suggestProducts } from '../utils/storefrontDiscovery.mjs'

const products = [
  { id:'1',slug:'cleanroll',name:'CleanRoll',subtitle:'För hemmet',description:'Tar bort päls',category:'Clean Home',price:19900,features:[] },
  { id:'2',slug:'paw-cleaner',name:'Tassrengöring',subtitle:'Efter promenaden',description:'Rengör tassar',category:'Travel',price:29900,features:[] },
  { id:'3',slug:'fold-bowl',name:'Reseskål',subtitle:'Vatten',description:'Hopfällbar matskål',category:'Dogs',price:44900,features:[] },
  { id:'4',slug:'grooming-brush',name:'Pälsborste',subtitle:'Mjuk borste',description:'För pälsvård',category:'Cats',price:24900,features:[] }
]

test('needs are valid and every category-specific discovery path has matching products', () => {
  assert.equal(new Set(COLLECTION_NEEDS.map(item => item.id)).size, COLLECTION_NEEDS.length)
  for (const need of COLLECTION_NEEDS) {
    assert.ok(need.href.startsWith('/shop?need='))
    assert.ok(filterStorefront(products, {need:need.id}).length>0, need.id)
  }
})

test('Swedish searches use normalized terms', () => {
  assert.equal(matchesSearch(products[3], 'PÄLSBORSTE'), true)
  assert.equal(matchesSearch(products[1], 'tassar'), true)
  assert.equal(matchesSearch(products[1], 'nonsense-query'), false)
})

test('sort and price selections are deterministic', () => {
  assert.deepEqual(filterStorefront(products,{sort:'price-asc'}).map(p=>p.price),[19900,24900,29900,44900])
  assert.deepEqual(filterStorefront(products,{price:'under-250'}).map(p=>p.slug),['cleanroll','grooming-brush'])
  assert.deepEqual(filterStorefront(products,{category:'Cats'}).map(p=>p.slug),['grooming-brush'])
})

test('favorites and comparisons are limited to catalog entries', () => {
  assert.deepEqual(filterStorefront(products,{favoritesOnly:true,favorites:['fold-bowl']}).map(p=>p.slug),['fold-bowl'])
  assert.deepEqual(getComparison(products,'fold-bowl,unknown,cleanroll,fold-bowl').map(p=>p.slug),['fold-bowl','cleanroll'])
  assert.ok(suggestProducts(products,'tassar').length>0)
})
