<script setup lang="ts">
import {
  ArrowLeft, ShieldCheck, ShieldAlert, RefreshCw, LockKeyhole, ClipboardList,
  Truck, PackageCheck, HeartHandshake, Scale, Download, ArrowRight, Info,
  CheckCircle2, CircleAlert, CircleDashed, FileCheck, TestTube2
} from 'lucide-vue-next'
import {evaluateReleaseGate,RELEASE_REVIEW_ITEMS} from '~/utils/releaseGate.mjs'

type GateItem={id:string;label:string;state:'recorded'|'review'|'manual';detail:string;link:string}
type GateReport={items:GateItem[];total:number;recorded:number;needsReview:number;requiresManual:number;
  suppliers:number;eligibleProducts:number;activeProducts:number;openCases:number;launchApproved:false;
  paymentsEnabledByReport:false;warning:string}

const loading=ref(true),authorized=ref(false),error=ref(''),readStatus=ref<'idle'|'ok'|'error'>('idle')
const rows=reactive({
 tasks:[] as any[],leads:[] as any[],quotes:[] as any[],products:[] as any[],
 images:[] as any[],catalog:[] as any[],contacts:[] as any[]
})
const reviewMarks=reactive<Record<string,boolean>>({})
const reviewNotes=ref('')
const currentTab=ref<'audit'|'review'|'service'>('audit')
const reviewedAt=ref<string|null>(null)
const report=computed<GateReport>(()=>evaluateReleaseGate(rows,Date.now()))
const countReviewed=computed(()=>RELEASE_REVIEW_ITEMS.filter(x=>reviewMarks[x.id]).length)

const load=async()=>{
 const supabase=useSupabaseBrowser()
 if(!supabase){error.value='Databaskoppling saknas.';loading.value=false;return}
 loading.value=true;authorized.value=false;error.value='';readStatus.value='idle'
 try{
  const {data:identity,error:identityError}=await supabase.auth.getUser()
  if(identityError||!identity.user){await navigateTo('/admin/login');return}
  const {data:admin,error:adminError}=await supabase.from('admins').select('user_id')
    .eq('user_id',identity.user.id).maybeSingle()
  if(adminError||!admin)return
  authorized.value=true
  // Read only. Do not fetch any customer names, emails, messages or sensitive planner notes.
  const [tasks,leads,quotes,products,images,catalog,contacts]=await Promise.all([
   supabase.from('prelaunch_tasks').select('code,status').limit(100),
   supabase.from('supplier_leads').select('id,status,shipping_to_sweden').limit(300),
   supabase.from('supplier_quotes').select('id,supplier_lead_id,product_id,status,quote_reference,source_url,unit_cost,shipping_per_order,fx_to_sek,payment_fee_pct,payment_fixed_sek,returns_reserve_pct,delivery_min_days,delivery_max_days').limit(500),
   supabase.from('products').select('id,active,material,supplier_sku').limit(400),
   supabase.from('product_images').select('product_id,is_concept').limit(750),
   supabase.from('supplier_catalog_items').select('id,supplier_lead_id,product_id,stock_status,stock_quantity,verified_at').limit(1000),
   supabase.from('contact_messages').select('id,status').order('created_at',{ascending:false}).limit(200)
  ])
  const failure=[tasks,leads,quotes,products,images,catalog,contacts].find(x=>x.error)?.error
  if(failure)throw failure
  rows.tasks=tasks.data||[];rows.leads=leads.data||[];rows.quotes=quotes.data||[]
  rows.products=products.data||[];rows.images=images.data||[];rows.catalog=catalog.data||[]
  rows.contacts=contacts.data||[]
  reviewedAt.value=new Date().toISOString()
  readStatus.value='ok'
 }catch(e:any){error.value=e?.message||'Kunde inte läsa verifieringsunderlag.';readStatus.value='error'}
 finally{loading.value=false}
}

const exportReport=()=>{
 if(!import.meta.client||readStatus.value!=='ok')return
 const sanitized={
   createdAt:new Date().toISOString(),
   purpose:'Intern genomgång. INTE godkännande för försäljning, juridisk efterlevnad eller betaltjänster.',
   sourceLimitations:'Kontaktärenden: senaste 200. Supabase-frågor är begränsade och kan vara ofullständiga.',
   launchApproved:false,paymentsEnabled:false,
   summary:{
    recorded:report.value.recorded,needsReview:report.value.needsReview,
    requiresManual:report.value.requiresManual,total:report.value.total,
    activeProducts:report.value.activeProducts,documentedProducts:report.value.eligibleProducts,
    supplierRecords:report.value.suppliers,openSupportCases:report.value.openCases
   },
   checks:report.value.items.map(({id,label,state,detail})=>({id,label,state,detail})),
   personalReview:RELEASE_REVIEW_ITEMS.map(({id,title})=>({id,title,checked:!!reviewMarks[id]})),
   // Free-text notes are excluded to prevent accidental personal-data export.
   disclaimers:report.value.warning
 }
 const blob=new Blob([JSON.stringify(sanitized,null,2)],{type:'application/json'})
 const url=URL.createObjectURL(blob)
 const anchor=document.createElement('a')
 anchor.href=url;anchor.download='norrli-prelaunch-review.json';anchor.click()
 window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const auditGroups=[
 {id:'legal',name:'Företag & konsumenträtt',icon:Scale,keys:['business','seller-published','privacy','withdrawal','payment-approval']},
 {id:'suppliers',name:'Leverantör & logistik',icon:Truck,keys:['supplier','costs','inventory','safety','shipping','shipping-contract']},
 {id:'support',name:'Kundservice & säker drift',icon:HeartHandshake,keys:['support','contact-e2e','email']}
]
const groupItems=(keys:string[])=>report.value.items.filter(x=>keys.includes(x.id))
const sourceLinks=[
 {title:'Säljarinformation',url:'https://www.konsumentverket.se/lagar/e-handelslagen-konsument/'},
 {title:'Ångerfunktion (juni 2026)',url:'https://www.konsumentverket.se/nyhet/lagandring-gor-det-enklare-att-angra-kop-pa-natet/'},
 {title:'GDPR-information',url:'https://www.imy.se/vanliga-fragor-och-svar/vad-ska-en-integritetspolicy-innehalla/'}
]
onMounted(load)
useSeoMeta({title:'Launch Gate · Intern kontroll',robots:'noindex,nofollow'})
</script>
<template>
 <main class="phase4-shell release-gate">
  <header class="phase4-topbar">
   <div class="phase4-top-brand"><NorrliLogo compact/><span>RELEASE GATE · PRIVATE</span></div>
   <div class="phase4-quick-links">
    <NuxtLink to="/admin/operations"><ArrowLeft :size="16"/> Driftcentral</NuxtLink>
    <NuxtLink to="/admin/launch">Launch workspace</NuxtLink>
    <NuxtLink to="/admin/support">Kundservice</NuxtLink>
    <button type="button" :disabled="loading" @click="load"><RefreshCw :size="16"/> Uppdatera</button>
   </div>
  </header>
  <section v-if="loading" class="phase4-state" role="status">Läser privata underlag för lanseringsgranskning…</section>
  <section v-else-if="!authorized" class="phase4-state">
   <LockKeyhole :size="34"/><h1>Endast administratörer</h1>
   <p>Lanseringsgranskningen kräver ett verifierat administratörskonto.</p>
   <NuxtLink to="/admin/login">Logga in</NuxtLink>
  </section>
  <template v-else>
   <div class="phase4-heading">
    <div><span class="eyebrow"><ShieldCheck :size="16"/> FÖRBEREDELSER · BESLUTSUNDERLAG</span>
     <h1>Redo för nästa steg?</h1>
     <p>En privat kvalitetsgranskning av företag, leverantörer, lager, Kundservice och konsumentinformation.</p>
    </div>
    <div class="phase4-prelaunch"><ShieldAlert :size="22"/><div>
     <strong>Försäljning är inte godkänd</strong>
     <small>Den här sidan kan aldrig aktivera checkout, betalningar eller kundutskick.</small>
    </div></div>
   </div>
   <p v-if="error" class="phase4-alert error" role="alert">{{ error }}</p>
   <div class="release-warning" role="note"><Info :size="21" aria-hidden="true"/>
    <span>{{ report.warning }} Kundärendestatistiken omfattar högst 200 senast hämtade poster.</span>
   </div>
   <div class="phase4-kpis release-kpis">
    <div><span>Registrerat underlag</span><strong>{{ report.recorded }} / {{ report.total }}</strong><small>Inte externa godkännanden</small></div>
    <div><span>Utestående underlag</span><strong>{{ report.needsReview }}</strong><small>Datapunkter att granska</small></div>
    <div><span>Manuella kontroller</span><strong>{{ report.requiresManual }}</strong><small>Kräver aktiv mänsklig verifiering</small></div>
    <div><span>Aktiva produktförslag</span><strong>{{ report.activeProducts }}</strong><small>{{ report.eligibleProducts }} med komplett internt underlag</small></div>
   </div>
   <nav class="phase4-tabs" aria-label="Release Gate flikar">
    <button type="button" :class="{active:currentTab==='audit'}" @click="currentTab='audit'"><ClipboardList :size="17"/> Risköversikt</button>
    <button type="button" :class="{active:currentTab==='review'}" @click="currentTab='review'"><FileCheck :size="17"/> Egen granskning</button>
    <button type="button" :class="{active:currentTab==='service'}" @click="currentTab='service'"><TestTube2 :size="17"/> Testplan</button>
   </nav>
   <section v-if="currentTab==='audit'" class="release-content">
    <div v-for="group in auditGroups" :key="group.id" class="phase4-panel release-panel">
     <div class="phase4-section-head"><div><span class="norrli-support-kicker"><component :is="group.icon" :size="17"/> INTERN GRANSKNING</span>
      <h2>{{ group.name }}</h2><p>Underlag för beslut, inte automatisk verifiering av avtal eller lagkrav.</p></div></div>
     <div class="release-check-list">
      <article v-for="item in groupItems(group.keys)" :key="item.id" class="release-check">
       <span class="release-check-icon" :class="item.state">
        <CheckCircle2 v-if="item.state==='recorded'" :size="21" aria-hidden="true"/>
        <CircleAlert v-else-if="item.state==='review'" :size="21" aria-hidden="true"/>
        <CircleDashed v-else :size="21" aria-hidden="true"/>
       </span>
       <div><strong>{{ item.label }}</strong><p>{{ item.detail }}</p>
        <NuxtLink :to="item.link">Granska underlaget <ArrowRight :size="14" aria-hidden="true"/></NuxtLink></div>
       <span class="release-check-status" :class="item.state">{{ item.state==='recorded'?'Uppgift finns':item.state==='manual'?'Manuell kontroll':'Behöver underlag' }}</span>
      </article>
     </div>
    </div>
   </section>

   <section v-else-if="currentTab==='review'" class="phase4-panel release-panel">
    <div class="phase4-section-head"><div><h2>Dokumentera din egen kontroll</h2>
     <p>{{ countReviewed }} av {{ RELEASE_REVIEW_ITEMS.length }} markerade i den här webbläsarsessionen. Svaren sparas inte på servern och innebär inte godkännande.</p></div>
     <span class="release-badge">LOKAL CHECKLISTA</span></div>
    <div class="release-manual">
     <label v-for="item in RELEASE_REVIEW_ITEMS" :key="item.id" class="release-manual-item">
      <input v-model="reviewMarks[item.id]" type="checkbox"/>
      <span><strong>{{ item.title }}</strong><small>{{ item.description }}</small>
       <NuxtLink :to="item.link" @click.stop>Se berörd sida <ArrowRight :size="14"/></NuxtLink></span>
     </label>
     <label for="release-notes" class="release-notes">Egna anteckningar (utan personuppgifter)
      <textarea id="release-notes" v-model="reviewNotes" maxlength="1000" rows="4" placeholder="Kort notering om vad som behöver verifieras. Undvik kunddata, kontouppgifter och lösenord."/>
      <small>{{ reviewNotes.length }} / 1 000 tecken · Sparas bara i minnet på denna sida</small>
     </label>
     <div class="release-export">
      <button type="button" :disabled="readStatus!=='ok'" @click="exportReport"><Download :size="17"/> Exportera avidentifierad JSON-rapport</button>
      <p>Endast sammanräknade värden och fasta kontrollpunkter exporteras. Fritextanteckningar, kundnamn, e-postadresser och meddelandetexter ingår aldrig.</p>
     </div>
    </div>
   </section>
   <section v-else class="phase4-panel release-panel">
    <div class="phase4-section-head"><div><h2>Testplan före lansering</h2>
     <p>Kör stegen manuellt med godkända testkonton och syntetiska uppgifter. Här finns inga aktiva utskick eller testköp.</p></div>
     <span class="release-badge"><TestTube2 :size="16"/> TEST ONLY</span></div>
    <div class="release-test-grid">
     <article><HeartHandshake :size="24"/><h3>Kundservice och formulär</h3>
      <p>Verifiera mottagning i databasen, spamgränser, adminbehörighet och statusuppdatering. Ett lagrat ärende betyder inte att kunden har fått svar.</p>
      <NuxtLink to="/admin/support">Öppna Kundservice <ArrowRight :size="15"/></NuxtLink></article>
     <article><Truck :size="24"/><h3>Leverantörer och lager</h3>
      <p>Kontrollera verkliga avtal, offerters källa, lagerdatum och produktmatchning. CSV-förslag är inte synkroniserade automatiskt.</p>
      <NuxtLink to="/admin/integrations">Öppna integrationer <ArrowRight :size="15"/></NuxtLink></article>
     <article><ShieldCheck :size="24"/><h3>Konton och säkerhet</h3>
      <p>Testa inloggning, behörighetsgränser och orderisolering med separata godkända konton, inte med kunduppgifter.</p>
      <NuxtLink to="/admin/verify">Öppna testsimulering <ArrowRight :size="15"/></NuxtLink></article>
     <article><Scale :size="24"/><h3>Information före köp</h3>
      <p>Granska juridisk identitet, slutliga köpvillkor, frakt, ångerrätt, GDPR och obligatorisk online-ångerfunktion.</p>
      <NuxtLink to="/legal/terms">Läs villkor <ArrowRight :size="15"/></NuxtLink></article>
    </div>
    <div class="release-sources"><strong>Officiella källor för fortsatt kontroll</strong>
     <a v-for="source in sourceLinks" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} <ArrowRight :size="13"/></a>
    </div>
   </section>
   <p class="release-fineprint">Uppdaterad datavy: {{ reviewedAt?new Date(reviewedAt).toLocaleString('sv-SE'):'Ej hämtad' }} · Read-only · Ingen försäljningsaktivering</p>
  </template>
 </main>
</template>
