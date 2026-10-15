<script setup lang="ts">
import { ArrowLeft, RefreshCw, Inbox, Search, LockKeyhole, MessageSquareText, CheckCircle2, Clock3, ShieldCheck } from 'lucide-vue-next'
type Status='new'|'open'|'closed'
type Case={id:string;name:string;email:string;message:string;status:Status;created_at:string}
const authorized=ref(false),loading=ref(true),error=ref(''),notification=ref(''),savingId=ref('')
const cases=ref<Case[]>([]),query=ref(''),statusFilter=ref('all'),selected=ref<string|null>(null)
const nowStatus=reactive<Record<string,Status>>({})
const stateNames:Record<Status,string>={new:'Nytt',open:'Pågående',closed:'Avslutat'}
const extractCategory=(message:string)=>message.startsWith('Ärende: ')?message.split('\n')[0].slice(8):'Äldre meddelande'
const extractText=(message:string)=>message.replace(/^Ärende: [^\n]*\n/,'').replace(/^Orderreferens: [^\n]*\n/,'').trim()
const visible=computed(()=>cases.value.filter(c=>{
 if(statusFilter.value!=='all'&&c.status!==statusFilter.value)return false
 const q=query.value.toLocaleLowerCase('sv-SE').trim()
 return !q||[c.name,c.email,c.message].some(v=>v.toLocaleLowerCase('sv-SE').includes(q))
}))
const counts=computed(()=>({all:cases.value.length,new:cases.value.filter(x=>x.status==='new').length,
 open:cases.value.filter(x=>x.status==='open').length,closed:cases.value.filter(x=>x.status==='closed').length}))
const selectedCase=computed(()=>cases.value.find(c=>c.id===selected.value))
const formatDate=(raw:string)=>new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(raw))
const load=async()=>{
 const client=useSupabaseBrowser()
 if(!client){error.value='Supabase är inte konfigurerat.';loading.value=false;return}
 loading.value=true;error.value='';authorized.value=false
 try{
  const {data:identity,error:authError}=await client.auth.getUser()
  if(authError||!identity.user){await navigateTo('/admin/login');return}
  const {data:admin,error:adminError}=await client.from('admins').select('user_id').eq('user_id',identity.user.id).maybeSingle()
  if(adminError||!admin)return
  authorized.value=true
  const {data,error:dbError}=await client.from('contact_messages')
   .select('id,name,email,message,status,created_at').order('created_at',{ascending:false}).limit(200)
  if(dbError)throw dbError
  cases.value=(data||[]) as Case[]
  for(const c of cases.value)nowStatus[c.id]=c.status
  if(selected.value&&!cases.value.some(c=>c.id===selected.value))selected.value=null
 }catch(e:any){error.value=e?.message||'Kunde inte läsa kundserviceärenden.'}
 finally{loading.value=false}
}
const saveStatus=async(c:Case)=>{
 const next=nowStatus[c.id]
 if(!next||next===c.status||savingId.value)return
 const client=useSupabaseBrowser()
 if(!client||!authorized.value)return
 savingId.value=c.id;notification.value='';error.value=''
 try{
  const {data,error:dbError}=await client.from('contact_messages').update({status:next})
    .eq('id',c.id).eq('status',c.status).select('id,status').maybeSingle()
  if(dbError)throw dbError
  if(!data)throw new Error('Ärendet ändrades samtidigt. Uppdatera sidan och försök igen.')
  c.status=next
  notification.value='Status uppdaterad. Inget mejl har skickats till kunden.'
 }catch(e:any){error.value=e?.message||'Kunde inte ändra status.';nowStatus[c.id]=c.status}
 finally{savingId.value=''}
}
onMounted(load)
useSeoMeta({title:'Kundservice · administration',robots:'noindex,nofollow'})
</script>
<template>
 <main class="phase4-shell norrli-support-admin">
  <header class="phase4-topbar"><div class="phase4-top-brand"><NorrliLogo compact/><span>KUNDSERVICE · INTERN</span></div>
   <div class="phase4-quick-links"><NuxtLink to="/admin"><ArrowLeft :size="16"/> Admin</NuxtLink>
   <NuxtLink to="/support">Hjälpcenter</NuxtLink>
   <button type="button" :disabled="loading" @click="load"><RefreshCw :size="16"/> Uppdatera</button></div>
  </header>
  <section v-if="loading" class="phase4-state" role="status">Läser privata kundserviceärenden…</section>
  <section v-else-if="!authorized" class="phase4-state">
   <LockKeyhole :size="34"/><h1>Administratörsbehörighet krävs</h1>
   <p>Endast godkända administratörer kan se kunders meddelanden.</p><NuxtLink to="/admin/login">Logga in</NuxtLink>
  </section>
  <template v-else>
   <div class="phase4-heading"><div><span class="eyebrow">KUNDSERVICE · ARBETSÖVERSIKT</span>
    <h1>Ärendehantering</h1><p>Prioritera inkomna frågor och dokumentera intern status. Inga automatiska utskick görs.</p></div>
    <div class="phase4-prelaunch"><ShieldCheck :size="21"/><div><strong>Intern handläggning</strong><small>Kunduppgifter visas endast efter inloggning.</small></div></div>
   </div>
   <div class="phase4-kpis norrli-support-admin-stats">
    <div><span>Senaste ärenden</span><strong>{{ counts.all }}</strong><small>Max 200 visade</small></div>
    <div><span>Nya</span><strong>{{ counts.new }}</strong><small>Väntar på genomgång</small></div>
    <div><span>Pågående</span><strong>{{ counts.open }}</strong><small>Under behandling</small></div>
    <div><span>Avslutade</span><strong>{{ counts.closed }}</strong><small>Markerade som klara</small></div>
   </div>
   <p v-if="error" class="phase4-alert error" role="alert">{{ error }}</p>
   <p v-if="notification" class="phase4-alert success" role="status">{{ notification }}</p>
   <div class="phase4-panel norrli-support-admin-panel">
    <div class="phase4-section-head"><div><h2>Inkomna meddelanden</h2>
     <p>Sök och markera status. En ändring här innebär inte att kunden fått ett svar.</p></div>
     <div class="phase4-filters"><label><Search :size="16"/><input v-model="query" type="search" aria-label="Sök ärenden" placeholder="Sök namn, ärende…" /></label>
     <select v-model="statusFilter" aria-label="Filtrera ärenden">
      <option value="all">Alla</option><option value="new">Nya</option><option value="open">Pågående</option><option value="closed">Avslutade</option>
     </select></div>
    </div>
    <div v-if="!visible.length" class="phase4-empty">Inga meddelanden matchar filtreringen.</div>
    <div v-else class="norrli-support-admin-grid">
     <div class="norrli-support-admin-list">
      <button v-for="c in visible" :key="c.id" type="button" :class="{active:selected===c.id}" @click="selected=c.id">
       <span><strong>{{ extractCategory(c.message) }}</strong><small>{{ c.name }} · {{ formatDate(c.created_at) }}</small></span>
       <em :class="'case-'+c.status">{{ stateNames[c.status] }}</em>
      </button>
     </div>
     <section v-if="selectedCase" class="norrli-support-admin-detail" aria-label="Valt ärende">
      <span class="norrli-support-kicker"><MessageSquareText :size="16"/> ÄRENDEREGISTRERING</span>
      <h3>{{ extractCategory(selectedCase.message) }}</h3>
      <dl><div><dt>Från</dt><dd>{{ selectedCase.name }}</dd></div><div><dt>E-post</dt><dd>{{ selectedCase.email }}</dd></div><div><dt>Mottaget</dt><dd>{{ formatDate(selectedCase.created_at) }}</dd></div></dl>
      <p class="norrli-support-admin-message">{{ extractText(selectedCase.message) }}</p>
      <div class="norrli-support-admin-state"><label>Ärendestatus
       <select v-model="nowStatus[selectedCase.id]"><option value="new">Nytt</option><option value="open">Pågående</option><option value="closed">Avslutat</option></select></label>
       <button type="button" :disabled="nowStatus[selectedCase.id]===selectedCase.status||!!savingId" @click="saveStatus(selectedCase)">
        <CheckCircle2 :size="16"/>{{ savingId===selectedCase.id?'Sparar…':'Spara status' }}
       </button></div>
      <p class="norrli-support-admin-notice"><Clock3 :size="16"/> Intern status ändras. Svar, e-postnotiser och ärendenummer skapas inte.</p>
     </section>
     <div v-else class="norrli-support-admin-empty"><Inbox :size="32"/><p>Välj ett ärende till vänster för att se innehållet.</p></div>
    </div>
   </div>
  </template>
 </main>
</template>
