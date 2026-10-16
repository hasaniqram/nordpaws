// Google Merchant Center pre-launch policy: never publish provisional products.
export default defineEventHandler(async () => {
 
 throw createError({statusCode:503,statusMessage:'Merchant feed unavailable until storefront, product compliance, availability and checkout are approved for commercial launch.'})
})
