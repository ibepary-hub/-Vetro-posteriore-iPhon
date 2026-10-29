/* Administrative data export. This is not a database or attachment disaster-recovery backup. */
(function(global){
'use strict';
const tables=[['backglass_inventory','user_id','item_key'],['beparytech_sections','workspace_owner_id','id'],['beparytech_products','workspace_owner_id','id'],['beparytech_parts','workspace_owner_id','id'],['beparytech_clients','workspace_owner_id','id'],['beparytech_admin_repairs','workspace_owner_id','id'],['beparytech_repair_history','workspace_owner_id','id'],['beparytech_sales','user_id','id'],['beparytech_admin_device_sales','workspace_owner_id','id'],['beparytech_requests','workspace_owner_id','id'],['beparytech_audit_events','workspace_owner_id','id'],['beparytech_stores','workspace_owner_id','id'],['beparytech_sale_prices','workspace_owner_id','id'],['beparytech_product_costs','workspace_owner_id','id'],['beparytech_work_ddts','workspace_owner_id','id'],['beparytech_work_ddt_items','workspace_owner_id','id'],['beparytech_used_intakes','workspace_owner_id','id'],['beparytech_work_hours','user_id','id'],['beparytech_work_extras','user_id','id']];
async function readTable(client,spec,owner,user){
 const [name,column,key]=spec,target=['beparytech_work_hours','beparytech_work_extras'].includes(name)?user:owner;
 let rows=[],expected=null;
 while(true){
  const result=await client.from(name).select('*',{count:'exact'}).eq(column,target).order(key,{ascending:true}).range(rows.length,rows.length+499);
  if(result.error)throw new Error(`Esportazione interrotta: ${name}. Nessun file parziale è stato creato.`);
  if(!Array.isArray(result.data)||!Number.isSafeInteger(result.count))throw new Error(`Conteggio non disponibile: ${name}.`);
  if(expected===null)expected=result.count;else if(expected!==result.count)throw new Error('I dati sono cambiati durante l’esportazione. Riprova in un momento senza modifiche.');
  if(result.data.some(r=>r[column]!==target))throw new Error('Controllo di separazione dati fallito. Esportazione bloccata.');
  rows.push(...result.data);
  if(rows.length===expected)break;
  if(!result.data.length||rows.length>expected)throw new Error('Risultato incompleto: esportazione bloccata.');
 }
 const keys=new Set(rows.map(r=>String(r[key])));if(keys.size!==rows.length)throw new Error('Dati cambiati durante l’esportazione: righe duplicate.');
 return rows;
}
async function collect(client,owner,user){
 const data={};for(const spec of tables)data[spec[0]]=await readTable(client,spec,owner,user);
 return {format:'beparytech-data-export',version:1,build:'V2.2-RC1',workspace_owner_id:owner,exported_by:user,created_at:new Date().toISOString(),consistency:'paginated-not-transactional',coverage:'19 operational tables; hours for current administrator only',excluded:['Auth accounts and credentials','Storage file bytes','Provider integrations and secrets','Other administrators work hours','Full schema, triggers and RLS policies','Device-local issuer/DYMO settings'],counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),data};
}
async function exportData(){
 if(!isAdmin())throw new Error('Esportazione riservata agli amministratori attivi.');
 const button=document.getElementById('exportFullBackup');button.disabled=true;
 try{const ctx=await btGetWorkspaceOwnerId();const data=await collect(sb,ctx.owner,currentUser.id);downloadText(`BeparyTech_dati_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),'application/json');}
 catch(e){alert(e.message||'Esportazione non riuscita.');}finally{button.disabled=false;}
}
global.BeparyExport={readTable,collect,tables};
document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('exportFullBackup');if(b){b.textContent='Esporta dati operativi (JSON)';b.onclick=exportData;}});
})(window);
