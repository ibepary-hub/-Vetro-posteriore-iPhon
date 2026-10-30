/* EGYPHONE V2 customer read-only status page.
   Only device and repair state returned by public RPC; no private customer data. */
(()=>{
const query=new URLSearchParams(location.search);
const token=query.get("egyStatus");
if(!token)return;
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))return;
async function render(){
 const root=document.createElement("main");root.id="egyCustomerPortal";
 root.innerHTML='<div class="egyCustomerCard"><h1>EGYPHONE</h1><h2>Stato riparazione</h2><p id="egyCustomerStatus">Ricerca della pratica…</p></div>';
 document.body.append(root);
 try{
  const {data,error}=await sb.rpc("bt_v2_public_repair_status",{p_token:token});
  if(error)throw error;
  const item=data?.[0];const status=root.querySelector("#egyCustomerStatus");
  if(!item){status.textContent="Link non disponibile o scaduto.";return;}
  status.textContent="Dispositivo: "+(item.device||"—")+" · Stato: "+(item.repair_status||"Da aggiornare");
 }catch(err){root.querySelector("#egyCustomerStatus").textContent="Impossibile controllare lo stato. Riprova più tardi.";}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();