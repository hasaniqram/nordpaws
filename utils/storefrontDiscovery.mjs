// Pure, server-safe storefront discovery; no inventory or checkout mutations.
// Tags are presentation shortcuts for the current provisional catalog, NOT product certifications.
export const COLLECTION_NEEDS = Object.freeze([
  {id:'clean-home',eyebrow:'HEM & VARDAG',title:'Ett renare hem',description:'För päls, tassar och små vardagsbestyr.',href:'/shop?need=clean-home',theme:'linen'},
  {id:'outdoors',eyebrow:'UT PÅ ÄVENTYR',title:'På språng tillsammans',description:'Idéer för promenader, resor och utflykter.',href:'/shop?need=outdoors',theme:'sage'},
  {id:'grooming',eyebrow:'OMSORGSFULL PÄLSVÅRD',title:'En mjukare rutin',description:'Enkla detaljer för vardaglig pälsvård.',href:'/shop?need=grooming',theme:'lilac'},
  {id:'feeding',eyebrow:'MAT & VATTEN',title:'Måltider med omtanke',description:'Skålar och matstunder hemma eller på vägen.',href:'/shop?need=feeding',theme:'sand'}
])
export const NEED_LABELS=Object.freeze(Object.fromEntries(COLLECTION_NEEDS.map(c=>[c.id,c.title])))
export const normalizeSearch=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLocaleLowerCase('sv-SE').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')

// Honest descriptive search tokens: translations and broader discovery groupings are
// not claims that a given product has been verified for suitability or safety.
const SLUG_TERMS=Object.freeze({
 'cleanroll':'pälsborttagare hårborttagare roller soffa soffan kläder hem rengöring lint roller pet hair',
 'paw-cleaner':'tassrengöring tassar tass rengöra lera rengöring promenad cup dog paws',
 'fold-bowl':'mat vattenskål vatten foder utflykt matskål hopfällbar hund camping',
 'car-seat-cover':'bil bilskydd baksäte bilresa hund resa skydd överdrag',
 'slow-feeder':'matskål mat utfodring långsammat skål äta måltid',
 'grooming-brush':'borste pälsvård päls kam katt hund pälsborste'
})
const CATEGORY_TERMS=Object.freeze({
 'Dogs':'hund hundar hundliv','Cats':'katt katter kattliv',
 'Travel':'resa resor utflykt utflykter promenad promenader',
 'Clean Home':'hem rengöring städning pälsvård'
})
const NEED_CATEGORIES=Object.freeze({
 'clean-home':['Clean Home'],
 'outdoors':['Travel'],
 'grooming':['Cats'],
 'feeding':['Dogs']
})
const needMatches=(p,need)=>{
 if(!Object.hasOwn(NEED_CATEGORIES,need))return true
 const specific=normalizeSearch([p.name,p.subtitle,p.description,p.slug,(p.features||[]).join(' '),SLUG_TERMS[p.slug]||''].join(' '))
 if(need==='grooming')return /groom|brush|borst|pälsvård|\bkam\b/.test(specific)
 if(need==='feeding')return /bowl|feed|skål|matning|matskål/.test(specific)
 return NEED_CATEGORIES[need].includes(p.category)
}
export const matchesNeed=(p,need)=>needMatches(p,need)
const indexFor=p=>normalizeSearch([
 p.name,p.subtitle,p.description,p.category,(CATEGORY_TERMS[p.category]||''),
 (p.features||[]).join(' '),p.material||'',p.slug||'',
 SLUG_TERMS[p.slug]||''
].join(' '))
export const matchesSearch=(p,query)=>{
 const terms=normalizeSearch(query).slice(0,120).split(' ').filter(Boolean)
 if(!terms.length)return true
 const index=indexFor(p)
 return terms.every(term=>index.includes(term))
}
const scoreProduct=(p,query)=>{
 const q=normalizeSearch(query),name=normalizeSearch(p.name),slug=normalizeSearch(p.slug),text=indexFor(p)
 if(!q)return 0
 if(name===q)return 100
 if(name.startsWith(q))return 90
 if(name.includes(q))return 70
 if(slug.includes(q))return 55
 if(text.includes(q))return 35
 return 10
}
export const suggestProducts=(products,query,limit=5)=>{
 const q=normalizeSearch(query).slice(0,120)
 if(q.length<2)return []
 const bounded=Math.min(8,Math.max(1,Number(limit)||5))
 return products.filter(p=>matchesSearch(p,q))
  .sort((a,b)=>scoreProduct(b,q)-scoreProduct(a,q)||String(a.name).localeCompare(String(b.name),'sv'))
  .slice(0,bounded)
}
export const filterStorefront=(products,opts={})=>{
 let out=[...(products||[])]
 const category=String(opts.category||'')
 const need=String(opts.need||'')
 const price=String(opts.price||'all')
 const sort=String(opts.sort||'featured')
 const favs=new Set(opts.favorites||[])
 if(category)out=out.filter(p=>p.category===category)
 if(need&&Object.hasOwn(NEED_LABELS,need))out=out.filter(p=>needMatches(p,need))
 if(opts.favoritesOnly)out=out.filter(p=>favs.has(p.slug))
 if(price==='under-250')out=out.filter(p=>p.price<25000)
 if(price==='250-400')out=out.filter(p=>p.price>=25000&&p.price<=40000)
 if(price==='over-400')out=out.filter(p=>p.price>40000)
 if(opts.query)out=out.filter(p=>matchesSearch(p,opts.query))
 if(sort==='price-asc')out.sort((a,b)=>a.price-b.price)
 if(sort==='price-desc')out.sort((a,b)=>b.price-a.price)
 if(sort==='name')out.sort((a,b)=>a.name.localeCompare(b.name,'sv'))
 if(sort==='featured'&&opts.query)out.sort((a,b)=>scoreProduct(b,opts.query)-scoreProduct(a,opts.query))
 return out
}
export const getComparison=(products,ids,max=3)=>{
 const keys=[...new Set(String(ids||'').split(',').map(s=>s.trim()).filter(Boolean))].slice(0,Math.min(Math.max(1,max),3))
 return keys.map(slug=>(products||[]).find(p=>p.slug===slug)).filter(Boolean)
}
