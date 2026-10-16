const publicPaths=['/','/about','/contact','/delivery']
export default defineEventHandler(event=>{
 setHeader(event,'Content-Type','application/xml; charset=utf-8')
 setHeader(event,'Cache-Control','public, max-age=3600')
 const urls=publicPaths.map(path=>'<url><loc>https://norrlipets.se'+path+'</loc></url>').join('')
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>'
})
