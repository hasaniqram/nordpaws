export const HISTORY_KEY='norrli-recent-products-v1'
export function cleanRecent(value,allowed=[],limit=8){
 const permitted=new Set(allowed)
 return [...new Set(Array.isArray(value)?value.filter(x=>typeof x==='string'&&permitted.has(x)):[])].slice(0,limit)
}
export function addRecent(old,slug,allowed=[],limit=8){
 return cleanRecent([slug,...old.filter(x=>x!==slug)],allowed,limit)
}
