export type CatalogCsvRow = {
  sku:string
  title:string
  unit_cost?:number
  currency?:'SEK'|'EUR'|'USD'|'GBP'|'DKK'|'NOK'
  stock_status?:'unknown'|'in_stock'|'low_stock'|'out_of_stock'|'backorder'|'discontinued'
  stock_quantity?:number
  lead_time_days?:number
  source_url?:string
}
export type CsvReport={rows:CatalogCsvRow[],warnings:string[]}
const currencies=new Set(['SEK','EUR','USD','GBP','DKK','NOK'])
const statuses=new Set(['unknown','in_stock','low_stock','out_of_stock','backorder','discontinued'])
const aliases:Record<string,string>={
  sku:'sku',supplier_sku:'sku',item_sku:'sku',
  title:'title',name:'title',product_name:'title',
  unit_cost:'unit_cost',cost:'unit_cost',wholesale_price:'unit_cost',supplier_price:'unit_cost',
  currency:'currency',
  stock_status:'stock_status',availability:'stock_status',
  stock_quantity:'stock_quantity',quantity:'stock_quantity',stock:'stock_quantity',qty:'stock_quantity',
  lead_time_days:'lead_time_days',lead_days:'lead_time_days',shipping_days:'lead_time_days',
  source_url:'source_url',url:'source_url',product_url:'source_url'
}
const keys=['sku','title','unit_cost','currency','stock_status','stock_quantity','lead_time_days','source_url']
export const catalogTemplate=keys.join(',')+'\r\n'
const validUrl=(v:string)=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)}catch{return false}}
const normalize=(v:string)=>v.trim().toLowerCase().replace(/[\s-]+/g,'_')
const cost=(str:string,line:number)=>{
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(str))throw new Error(`Row ${line}: wholesale price must be a nonnegative number with up to 2 decimals.`)
  const n=Number(str.replace(',','.'))
  if(!Number.isFinite(n)||n>9999999999)throw new Error(`Row ${line}: wholesale price out of range.`)
  return n
}
const int=(str:string,line:number,kind:string,max:number)=>{
  if(!/^\d+$/.test(str))throw new Error(`Row ${line}: ${kind} must be a whole nonnegative number.`)
  const n=Number(str)
  if(!Number.isSafeInteger(n)||n>max)throw new Error(`Row ${line}: ${kind} is out of range.`)
  return n
}
function guessDelimiter(header:string){
  let comma=0,semicolon=0,quoted=false
  for(let i=0;i<header.length;i++){
    const c=header[i]
    if(c==='"'&&header[i+1]==='"'){i++;continue}
    if(c==='"'){quoted=!quoted;continue}
    if(!quoted){if(c===',')comma++;if(c===';')semicolon++}
  }
  return semicolon>comma?';':','
}
function parseCells(text:string):string[][]{
  const firstLine=text.split(/\r?\n/,1)[0]||''
  const delimiter=guessDelimiter(firstLine)
  const rows:string[][]=[]
  let cells:string[]=[],cell='',quoted=false
  const flushCell=()=>{cells.push(cell.trim());cell=''}
  const flushRow=()=>{flushCell();if(cells.some(x=>x!==''))rows.push(cells);cells=[]}
  for(let i=0;i<text.length;i++){
    const c=text[i]
    if(c==='"'){
      if(quoted&&text[i+1]==='"'){cell+='"';i++}
      else if(!quoted&&cell.trim()==='')quoted=true
      else if(quoted)quoted=false
      else throw new Error('Malformed CSV: unexpected quotation mark.')
    }else if(!quoted&&c===delimiter)flushCell()
    else if(!quoted&&(c==='\n'||c==='\r')){
      if(c==='\r'&&text[i+1]==='\n')i++
      flushRow()
    }else cell+=c
  }
  if(quoted)throw new Error('Malformed CSV: unmatched quotation mark.')
  if(cell||cells.length)flushRow()
  return rows
}
export function parseCatalogCsv(text:string):CsvReport{
  if(text.length>250000)throw new Error('File exceeds the 250 KB preview limit.')
  const data=parseCells(text.replace(/^\uFEFF/,''))
  if(data.length<2)throw new Error('CSV must contain a header and at least one product row.')
  const indexes=new Map<string,number>()
  for(const [i,raw] of data[0].entries()){
    const name=aliases[normalize(raw)]
    if(name){
      if(indexes.has(name))throw new Error(`Duplicate column: ${name}`)
      indexes.set(name,i)
    }
  }
  for(const name of ['sku','title'])if(!indexes.has(name))throw new Error(`Missing required header: ${name}`)
  if(data.length>101)throw new Error('Only 100 product rows can be imported at once.')
  const rows:CatalogCsvRow[]=[]
  const seen=new Set<string>()
  const warnings:string[]=[]
  for(let rowIndex=1;rowIndex<data.length;rowIndex++){
    const row=data[rowIndex],line=rowIndex+1
    if(row.length>data[0].length)throw new Error(`Row ${line} contains extra columns.`)
    const get=(name:string)=>indexes.has(name)?(row[indexes.get(name)!]||'').trim():''
    const sku=get('sku'),title=get('title')
    if(!sku||sku.length>120)throw new Error(`Row ${line}: supplier SKU required (up to 120 characters).`)
    if(!title||title.length>250)throw new Error(`Row ${line}: product title required (up to 250 characters).`)
    if(seen.has(sku))throw new Error(`Row ${line}: duplicate supplier SKU ${sku}.`)
    seen.add(sku)
    const item:CatalogCsvRow={sku,title}
    const rawCost=get('unit_cost')
    if(rawCost)item.unit_cost=cost(rawCost,line)
    const curr=get('currency').toUpperCase()
    if(curr){
      if(!currencies.has(curr))throw new Error(`Row ${line}: unsupported currency.`)
      item.currency=curr as CatalogCsvRow['currency']
    }
    const status=normalize(get('stock_status'))
    if(status){
      if(!statuses.has(status))throw new Error(`Row ${line}: unknown availability status "${status}".`)
      item.stock_status=status as CatalogCsvRow['stock_status']
    }
    if(get('stock_quantity'))item.stock_quantity=int(get('stock_quantity'),line,'Stock quantity',10000000)
    if(get('lead_time_days'))item.lead_time_days=int(get('lead_time_days'),line,'Lead time',365)
    const url=get('source_url')
    if(url){
      if(url.length>2000||!validUrl(url))throw new Error(`Row ${line}: source URL must start with http:// or https://.`)
      item.source_url=url
    }
    rows.push(item)
    if(!indexes.has('currency')&&item.unit_cost!=null&&!warnings.includes('No currency column: prices will default to SEK for new catalog entries.'))
      warnings.push('No currency column: prices will default to SEK for new catalog entries.')
  }
  return {rows,warnings}
}
