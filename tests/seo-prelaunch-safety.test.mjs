import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('crawler rules exclude private administrative and purchase paths',()=>{
 const text=source('server/routes/robots.txt.ts')
 for(const term of ['/admin/','/account/','/checkout/','/cart','/api/'])assert.ok(text.includes(term))
 assert.match(text,/Sitemap: https:\/\/norrlipets\.se\/sitemap\.xml/)
})
test('sitemap excludes provisional product records and other private routes',()=>{
 const text=source('server/routes/sitemap.xml.ts')
 assert.match(text,/https:\/\/norrlipets\.se/)
 assert.doesNotMatch(text,/\/products\/|\/checkout\/|\/admin\/|\.from\('products'\)/)
})
test('live payments are still disallowed even when checkout is configured',()=>{
 const text=source('server/api/checkout.post.ts')
 assert.match(text,/!apiKey\.startsWith\('sk_test_'\)/)
 assert.match(source('nuxt.config.ts'),/checkoutEnabled: false/)
})
