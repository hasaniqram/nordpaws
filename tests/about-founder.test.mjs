import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const about=read('pages/about.vue')
const css=read('assets/css/about-story.css')

test('About is an original Swedish page and credits the creator by name',()=>{
  assert.match(about,/Det börjar med/)
  assert.match(about,/VÅR BERÄTTELSE/)
  assert.match(about,/Jag heter <strong>Hasan Iqram<\/strong>/)
  assert.match(about,/min idé/)
  assert.match(about,/Initiativtagare · Konceptskapare · Webbplatsutvecklare/)
  assert.doesNotMatch(about,/Pet essentials, edited down|Our approach|Our story/)
})
test('Founder portrait is reused from the approved original, not redrawn',()=>{
  assert.match(about,/<FounderPortrait\s*\/>/)
  assert.match(about,/norrli-about-founder-image-wrap/)
  const portrait=read('components/FounderPortrait.vue')
  assert.match(portrait,/alt="Porträtt av Hasan Iqram/)
})
test('Every service claim is framed honestly while checkout is disabled',()=>{
  assert.match(about,/checkoutEnabled/)
  assert.match(about,/sortimentet är just nu en förhandsvisning/i)
  assert.match(about,/under utveckling/)
  assert.match(about,/innan vi öppnar för köp/)
  assert.doesNotMatch(about,/garanterad leverans|100 % nöjda kunder|fri frakt|registrerat varumärke/i)
})
test('Founder story is discoverable and links to current support and copyright pages',()=>{
  assert.match(read('components/SiteHeader.vue'),/to="\/about"/)
  assert.match(read('components/SiteFooter.vue'),/to="\/about"/)
  assert.match(about,/to="\/legal\/copyright"/)
  assert.match(about,/to="\/contact"/)
  assert.match(about,/to="\/shop"/)
})
test('Responsive design includes readable small-screen and focus styling',()=>{
  assert.match(css,/@media\(max-width:780px\)/)
  assert.match(css,/@media\(max-width:500px\)/)
  assert.match(css,/\.norrli-about a:focus-visible\{outline:3px solid/)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})
test('The About CSS is isolated and loaded after legacy rules',()=>{
  const nuxt=read('nuxt.config.ts')
  assert.match(nuxt,/'~\/assets\/css\/about-story.css'/)
  assert.match(css,/\.norrli-about-founder/)
  assert.doesNotMatch(css,/\.nordic-approved-logo-image|\.nordic-site-header/)
})
