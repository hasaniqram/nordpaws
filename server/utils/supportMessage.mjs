// Support form validation. Uses the existing contact_messages table without schema changes.
// No email or ticket generation occurs here.
export const SUPPORT_TOPICS = Object.freeze([
  ['general','Allmän fråga'],
  ['product','Produkter och sortiment'],
  ['delivery','Leverans och frakt'],
  ['returns','Returer och reklamation'],
  ['account','Mitt konto'],
  ['privacy','Personuppgifter och integritet'],
  ['copyright','Upphovsrätt och innehåll']
])
const allowed = new Map(SUPPORT_TOPICS)
export function prepareSupportMessage(body = {}) {
  const name=String(body.name??'').trim()
  const email=String(body.email??'').trim().toLowerCase()
  const message=String(body.message??'').trim()
  const topic=String(body.topic??'general').trim()
  const reference=String(body.orderReference??'').trim()
  if(name.length<2||name.length>100)throw new Error('Ange ett namn på 2–100 tecken.')
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Ange en giltig e-postadress.')
  if(!allowed.has(topic))throw new Error('Välj en giltig ärendekategori.')
  if(reference.length>64||!/^[-a-zA-Z0-9 _]*$/.test(reference))throw new Error('Orderreferensen får endast innehålla bokstäver, siffror, mellanslag och bindestreck.')
  if(message.length<10||message.length>3500)throw new Error('Meddelandet måste innehålla 10–3 500 tecken.')
  const storedMessage=['Ärende: '+allowed.get(topic),reference?'Orderreferens: '+reference:null,'',message]
    .filter(x=>x!==null).join('\n')
  if(storedMessage.length>4000)throw new Error('Meddelandet är för långt.')
  return {name,email,message:storedMessage,status:'new',topic}
}
