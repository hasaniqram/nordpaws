// SEO describes editorial brand pages only. No sale offers or provisional inventory claims.
export function organizationSchema(){
 return {'@context':'https://schema.org','@type':'Organization',name:'Norrli Pets',url:'https://norrlipets.se/',description:'Nordiskt inspirerade produktidéer för hund och katt.'}
}
export function websiteSchema(){
 return {'@context':'https://schema.org','@type':'WebSite',name:'Norrli Pets',url:'https://norrlipets.se/',inLanguage:'sv-SE',potentialAction:{'@type':'SearchAction',target:'https://norrlipets.se/shop?q={search_term_string}','query-input':'required name=search_term_string'}}
}
