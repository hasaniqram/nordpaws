// Privacy-first recommendations from products already present in the provisional catalog.
// No cookies, remote tracking or personal profile is created.
export function recommendFromFavorites(products=[],favoriteSlugs=[],limit=4){
 const saved=new Set(favoriteSlugs)
 const categoryWeights=new Map()
 for(const product of products){
  if(!saved.has(product.slug))continue
  categoryWeights.set(product.category,(categoryWeights.get(product.category)||0)+1)
 }
 return products.filter(p=>!saved.has(p.slug))
  .map((p,index)=>({p,index,weight:categoryWeights.get(p.category)||0}))
  .sort((a,b)=>b.weight-a.weight||a.index-b.index)
  .slice(0,Math.max(0,Math.min(12,Number(limit)||4)))
  .map(x=>x.p)
}
