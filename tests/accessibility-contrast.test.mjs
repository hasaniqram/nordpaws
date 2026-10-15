import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const config = read('nuxt.config.ts')
const a11yCss = read('assets/css/accessibility.css')

function luminance(hex) {
  const channels = hex.replace('#','').match(/.{2}/g).map(segment => parseInt(segment,16)/255)
  const linear = channels.map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4)
  return linear[0]*0.2126 + linear[1]*0.7152 + linear[2]*0.0722
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)
}
function getColorFor(selector) {
  // Audit declarations in the final override stylesheet, not colors copied
  // into test data. All checked selectors are declared outside media queries.
  const withoutComments = a11yCss.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const block=blocks.find(([_,name,body]) => name.trim().split(',').map(x=>x.trim()).includes(selector) && /(?:^|;)\s*color\s*:/.test(body))
  assert.ok(block, 'Missing audited color override: '+selector)
  const match=block[2].match(/(?:^|;)\s*color\s*:\s*(#[a-fA-F0-9]{6})\s*(?:;|$)/)
  assert.ok(match, 'Not an auditable solid foreground color: '+selector)
  return match[1]
}
test('Nuxt emits the document language for Swedish text, and the a11y stylesheet loads last',()=>{
  assert.match(config,/htmlAttrs:\s*\{\s*lang:\s*'sv'\s*\}/)
  const section=config.match(/css:\s*\[([^\]]+)\]/)?.[1]||''
  assert.equal(section.trim().split(',').at(-1).trim(),"'~/assets/css/accessibility.css'")
})

const pairs=[
  {selector:'.nordic-product-type',bg:'#faf9f5'},
  {selector:'.nordic-product-info p',bg:'#faf9f5'},
  {selector:'.nordic-price-caption',bg:'#faf9f5'},
  {selector:'.nordic-photo-note',bg:'#fcfbf7'},
  {selector:'.nordic-benefits small',bg:'#f3f4ef'},
  {selector:'.nordic-newsletter p',bg:'#e2e9e3'},
  {selector:'.nordic-newsletter-consent',bg:'#e2e9e3'},
  {selector:'.nordic-newsletter-input input::placeholder',bg:'#ffffff'},
  {selector:'.nordic-header-search input::placeholder',bg:'#fafaf7'},
  {selector:'.nordic-mobile-search input::placeholder',bg:'#f5f7f1'},
  {selector:'.nordic-header-action:hover',bg:'#fcfaf5'},
  {selector:'.nordic-category-links a:hover',bg:'#f8f8f3'},
  {selector:'.nordic-category-links a.router-link-active',bg:'#f8f8f3'},
  {selector:'.nordic-mobile-nav-heading',bg:'#fffdf9'}
]
test('audited small captions, links and placeholders satisfy WCAG AA 4.5:1 contrast',()=>{
  for(const {selector,bg} of pairs) {
    const color=getColorFor(selector)
    assert.ok(contrast(color,bg) >= 4.5,selector+' is '+contrast(color,bg).toFixed(2)+':1')
  }
})
test('photo sections have stable pale reading surfaces independent of image content',()=>{
  assert.match(a11yCss,/\.nordic-hero-copy\s*\{\s*background:\s*linear-gradient\(/)
  assert.match(a11yCss,/\.nordic-story-content\s*\{\s*background:\s*rgba\(249,250,246,\.96\)/)
  // Even with a black photograph, the near-opaque cream remains readable.
  const fadedBlack='#e6e8e4'
  assert.ok(contrast('#123b32',fadedBlack)>4.5)
})
test('focus styles remain visually distinct and original logo assets are untouched',()=>{
  assert.match(a11yCss,/outline:\s*3px solid #24583e/)
  assert.match(a11yCss,/outline-color:\s*#e2f0e3/)
  assert.doesNotMatch(a11yCss,/approved-logo-image|norrli-approved-logo\.png/)
})
