export default defineEventHandler(event => {
 setHeader(event,'Content-Type','text/plain; charset=utf-8')
 setHeader(event,'Cache-Control','public, max-age=3600')
 return ['User-agent: *','Disallow: /admin/','Disallow: /account/','Disallow: /checkout/','Disallow: /cart','Disallow: /api/','Disallow: /favorites','Disallow: /compare','Allow: /','Sitemap: https://norrlipets.se/sitemap.xml'].join('\n')
})
