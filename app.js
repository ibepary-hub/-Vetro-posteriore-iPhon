
const MODEL_COLORS = {"iPhone 7": ["Nero", "Nero Jet", "Argento", "Oro", "Oro rosa", "Rosso"], "iPhone 7 Plus": ["Nero", "Nero Jet", "Argento", "Oro", "Oro rosa", "Rosso"], "iPhone 8": ["Grigio siderale", "Argento", "Oro", "Rosso"], "iPhone 8 Plus": ["Grigio siderale", "Argento", "Oro", "Rosso"], "iPhone X": ["Grigio siderale", "Argento"], "iPhone XR": ["Nero", "Bianco", "Blu", "Giallo", "Corallo", "Rosso"], "iPhone XS": ["Grigio siderale", "Argento", "Oro"], "iPhone XS Max": ["Grigio siderale", "Argento", "Oro"], "iPhone 11": ["Nero", "Bianco", "Verde", "Giallo", "Viola", "Rosso"], "iPhone 11 Pro": ["Grigio siderale", "Argento", "Oro", "Verde notte"], "iPhone 11 Pro Max": ["Grigio siderale", "Argento", "Oro", "Verde notte"], "iPhone SE (2ª gen)": ["Nero", "Bianco", "Rosso"], "iPhone 12 mini": ["Nero", "Bianco", "Blu", "Verde", "Viola", "Rosso"], "iPhone 12": ["Nero", "Bianco", "Blu", "Verde", "Viola", "Rosso"], "iPhone 12 Pro": ["Grafite", "Argento", "Oro", "Blu Pacifico"], "iPhone 12 Pro Max": ["Grafite", "Argento", "Oro", "Blu Pacifico"], "iPhone 13 mini": ["Mezzanotte", "Galassia", "Blu", "Rosa", "Verde", "Rosso"], "iPhone 13": ["Mezzanotte", "Galassia", "Blu", "Rosa", "Verde", "Rosso"], "iPhone 13 Pro": ["Grafite", "Argento", "Oro", "Blu Sierra", "Verde alpino"], "iPhone 13 Pro Max": ["Grafite", "Argento", "Oro", "Blu Sierra", "Verde alpino"], "iPhone SE (3ª gen)": ["Mezzanotte", "Galassia", "Rosso"], "iPhone 14": ["Mezzanotte", "Galassia", "Blu", "Viola", "Giallo", "Rosso"], "iPhone 14 Plus": ["Mezzanotte", "Galassia", "Blu", "Viola", "Giallo", "Rosso"], "iPhone 14 Pro": ["Nero siderale", "Argento", "Oro", "Viola scuro"], "iPhone 14 Pro Max": ["Nero siderale", "Argento", "Oro", "Viola scuro"], "iPhone 15": ["Nero", "Blu", "Verde", "Giallo", "Rosa"], "iPhone 15 Plus": ["Nero", "Blu", "Verde", "Giallo", "Rosa"], "iPhone 15 Pro": ["Titanio nero", "Titanio bianco", "Titanio blu", "Titanio naturale"], "iPhone 15 Pro Max": ["Titanio nero", "Titanio bianco", "Titanio blu", "Titanio naturale"], "iPhone 16e": ["Nero", "Bianco"], "iPhone 16": ["Nero", "Bianco", "Rosa", "Verde acqua", "Blu oltremare"], "iPhone 16 Plus": ["Nero", "Bianco", "Rosa", "Verde acqua", "Blu oltremare"], "iPhone 16 Pro": ["Titanio nero", "Titanio bianco", "Titanio naturale", "Titanio sabbia"], "iPhone 16 Pro Max": ["Titanio nero", "Titanio bianco", "Titanio naturale", "Titanio sabbia"], "iPhone 17": ["Nero", "Bianco", "Blu", "Verde", "Lavanda"], "iPhone 17e": ["Nero", "Bianco", "Rosa chiaro"], "iPhone Air": ["Nero", "Bianco", "Oro chiaro", "Azzurro"], "iPhone 17 Pro": ["Argento", "Blu profondo", "Arancione cosmico"], "iPhone 17 Pro Max": ["Argento", "Blu profondo", "Arancione cosmico"]};
const SUPABASE_URL = "https://kqdcbrpykaboabjglwxu.supabase.co";
const SUPABASE_KEY = "sb_publishable_h_JHhQI97d8RTKBz8oiLeQ_uCg26kxX";
const PASSWORD_RESET_REDIRECT = "https://ibepary-hub.github.io/-Vetro-posteriore-iPhon/";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});

let stock = {};
let currentUser = null;
let currentProfile = null;
let workspaceOwnerId = null;
let currentCategory = "BackGlass";
let pendingSale = null;
let selectedCustomer = null;
let sales = [];
let salesMode = "active"; // active | archive | summary
let selectedSale = null;
let selectedUserForOperatorPassword = null;
let accountOperators = [];
let selectedUserForAccountOperators = null;
let customSections = [];
let customProducts = [];
let currentCustomSectionId = null;
let storeList = [];
let adminCosts = {};
let supplierQuotes = {};
let salesStoreFilter = "ALL";

const inventory = document.getElementById("inventory");
const modelTemplate = document.getElementById("modelTemplate");
const colorTemplate = document.getElementById("colorTemplate");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const authMsg = document.getElementById("authMsg");

function keyFor(model,color){
  // Mantiene le chiavi BackGlass storiche per non perdere le quantità già salvate.
  return currentCategory === "BackGlass" ? model + "||" + color : "Housing||" + model + "||" + color;
}
function getQty(model,color){ return Number(stock[keyFor(model,color)] || 0); }
function statusFor(q){
  if(q===0) return ["ESAURITO","empty"];
  if(q<=2) return ["SCORTA BASSA","low"];
  return ["DISPONIBILE","ok"];
}
function colorDot(name){
  const n=name.toLowerCase();
  if(n.includes("nero")||n.includes("grafite")||n.includes("mezzanotte")) return "#111827";
  if(n.includes("bianco")||n.includes("galassia")||n.includes("argento")) return "#e5e7eb";
  if(n.includes("oro")) return "#d4a857"; if(n.includes("rosso")) return "#dc2626";
  if(n.includes("blu")||n.includes("azzurro")) return "#2563eb"; if(n.includes("verde")) return "#16a34a";
  if(n.includes("viola")||n.includes("lavanda")) return "#8b5cf6"; if(n.includes("giallo")) return "#eab308";
  if(n.includes("rosa")) return "#ec4899"; if(n.includes("corallo")||n.includes("arancione")) return "#f97316";
  if(n.includes("titanio")) return "#9ca3af"; return "#94a3b8";
}
function passesFilter(q){
  if(filter.value==="available") return q>0;
  if(filter.value==="low") return q>0 && q<=2;
  if(filter.value==="empty") return q===0;
  return true;
}


function fixedCostKey(category,itemKey){return `FIXED||${category}||${itemKey}`;}
function customCostKey(id){return `PRODUCT||${Number(id)}`;}
function costValue(key){const v=adminCosts[key];return v==null?null:Number(v);}
function supplierQuote(key){return supplierQuotes[key]||null;}
function costBadgeHtml(key){if(!isAdmin())return "";const v=costValue(key),q=supplierQuote(key);return `<div class="adminCostBadge"><div class="adminCostMain"><span>Costo</span><strong>${v==null?"Da impostare":eur(v)}</strong>${q?`<small>IT-Ricambi ${eur(q.displayed_price)}</small>`:""}</div><button type="button" class="itCostBtn" title="IT-Ricambi" data-cost-key="${escapeHtml(key)}">IT</button><button type="button" class="editCostBtn" title="Modifica costo" data-cost-key="${escapeHtml(key)}">✎</button></div>`;}
async function loadAdminCosts(){adminCosts={};supplierQuotes={};if(!isAdmin())return;const [{data:c,error:ce},{data:q,error:qe}]=await Promise.all([sb.from("beparytech_product_costs").select("item_key,cost_ex_vat"),sb.from("beparytech_supplier_quotes").select("item_key,source_url,source_title,displayed_price,currency,checked_at,supplier")]);if(ce)console.error(ce);else (c||[]).forEach(r=>adminCosts[r.item_key]=Number(r.cost_ex_vat));if(qe)console.error(qe);else (q||[]).forEach(r=>supplierQuotes[r.item_key]=r);}
async function saveManualCost(key,value){const {error}=await sb.from("beparytech_product_costs").upsert({workspace_owner_id:workspaceOwnerId,item_key:key,cost_ex_vat:value,updated_by:currentUser.id},{onConflict:"workspace_owner_id,item_key"});if(error)throw error;adminCosts[key]=value;}
async function editCost(key,label){if(!isAdmin())return;const old=costValue(key);const raw=prompt(`Costo prodotto · ${label}\nInserisci il tuo costo effettivo in euro IVA esclusa`,old==null?"":String(old).replace(".",","));if(raw===null)return;const value=Number(String(raw).replace(",","."));if(!Number.isFinite(value)||value<0){alert("Inserisci un costo valido.");return;}try{await saveManualCost(key,value);refreshCostUi();}catch(e){alert(e?.message||"Errore salvataggio costo");}}
function refreshCostUi(){if(String(currentCategory).startsWith("custom:"))renderCustomSection();else render();}
function wireCostBadge(costNode,key,label){const edit=costNode?.querySelector(".editCostBtn"),it=costNode?.querySelector(".itCostBtn");if(edit)edit.onclick=()=>editCost(key,label);if(it)it.onclick=()=>openItRicambiCost(key,label);}
function ensureItRicambiModal(){
  let m=document.getElementById("itRicambiCostModal");
  if(m)return m;
  document.body.insertAdjacentHTML("beforeend",`<div id="itRicambiCostModal" class="saleModal" hidden>
    <div class="saleDialog itRicambiDialog" role="dialog" aria-modal="true">
      <div class="saleDialogHead"><div><span class="saleKicker">SOLO ADMIN</span><h2>IT-Ricambi · costo prodotto</h2></div><button id="itRicambiClose" class="closeBtn" type="button">×</button></div>
      <div id="itRicambiItem" class="saleItemLabel"></div>
      <section class="itRicambiAccountCard">
        <div class="itRicambiAccountTop"><div><span class="fieldLabel">Account IT-Ricambi</span><strong id="itRicambiSessionState">Controllo sessione…</strong><small id="itRicambiSessionMeta">Il login viene conservato solo lato server.</small></div><div class="itRicambiSessionActions"><button id="itRicambiConnectBtn" class="miniBtn" type="button">Connetti</button><button id="itRicambiDisconnectBtn" class="miniBtn dangerSoft" type="button" hidden>Disconnetti</button></div></div>
        <div id="itRicambiLoginBox" class="itRicambiLoginBox" hidden>
          <label><span>Email / username</span><input id="itRicambiLoginUser" class="modalInput" autocomplete="username"></label>
          <label><span>Password</span><input id="itRicambiLoginPass" class="modalInput" type="password" autocomplete="current-password"></label>
          <div class="itRicambiActions"><button id="itRicambiLoginSubmit" class="primaryAction" type="button">Accedi a IT-Ricambi</button><button id="itRicambiLoginCancel" class="miniBtn" type="button">Annulla</button></div>
          <small>La password viene usata solo per creare la sessione e non viene salvata nel gestionale.</small>
        </div>
      </section>
      <label class="fieldLabel">Link prodotto IT-Ricambi</label><input id="itRicambiUrl" class="modalInput" type="url" placeholder="https://www.it-ricambi.com/...">
      <div class="itRicambiActions"><button id="itRicambiFetch" class="primaryAction" type="button">Aggiorna prezzo</button><a id="itRicambiOpen" class="miniBtn" target="_blank" rel="noopener noreferrer" hidden>Apri scheda</a></div>
      <div id="itRicambiResult" class="itRicambiResult">Incolla il link esatto del ricambio.</div>
      <div class="itRicambiApplyRow"><label><span>Prezzo trovato</span><input id="itRicambiPrice" class="modalInput" inputmode="decimal" readonly></label><button id="itRicambiApply" class="primaryAction" type="button" disabled>Usa come costo</button></div>
      <div class="itRicambiNotice">Il prezzo del tuo account IT-Ricambi viene conservato separatamente dal costo effettivo. Se la sessione scade, ti verrà chiesto di collegarti di nuovo.</div>
    </div></div>`);
  m=document.getElementById("itRicambiCostModal");
  document.getElementById("itRicambiClose").onclick=()=>m.hidden=true;
  m.onclick=e=>{if(e.target===m)m.hidden=true;};
  bindItRicambiActions();
  return m;
}
let itRicambiPending=null;
let itRicambiSession={connected:false,expires_at:null};
function setItRicambiLoginBox(show){const box=document.getElementById("itRicambiLoginBox");if(box)box.hidden=!show;if(show)setTimeout(()=>document.getElementById("itRicambiLoginUser")?.focus(),30);}
function renderItRicambiSession(){
  const state=document.getElementById("itRicambiSessionState"),meta=document.getElementById("itRicambiSessionMeta"),connect=document.getElementById("itRicambiConnectBtn"),disconnect=document.getElementById("itRicambiDisconnectBtn");
  if(!state)return;
  if(itRicambiSession.connected){state.textContent="● Collegato";state.classList.add("okText");const exp=itRicambiSession.expires_at?new Date(itRicambiSession.expires_at):null;meta.textContent=exp&&!Number.isNaN(exp.getTime())?`Sessione riutilizzabile fino al ${exp.toLocaleString("it-IT")}, salvo scadenza anticipata del sito.`:"Sessione IT-Ricambi attiva.";connect.textContent="Ricollega";disconnect.hidden=false;}
  else{state.textContent="Non collegato";state.classList.remove("okText");meta.textContent="Effettua il login una volta; la password non viene salvata.";connect.textContent="Connetti";disconnect.hidden=true;}
}
async function callItRicambi(body){const {data,error}=await sb.functions.invoke("beparytech-itricambi-price",{body});if(error)throw new Error(error.message||"Servizio IT-Ricambi non disponibile");if(!data?.ok)throw Object.assign(new Error(data?.error||"Operazione IT-Ricambi non riuscita"),{code:data?.code||"IT_ERROR",payload:data});return data;}
async function refreshItRicambiSession(){if(!isAdmin())return;try{const d=await callItRicambi({action:"status"});itRicambiSession={connected:!!d.connected,expires_at:d.expires_at||null};}catch(e){itRicambiSession={connected:false,expires_at:null};}renderItRicambiSession();}
async function connectItRicambi(){const user=document.getElementById("itRicambiLoginUser")?.value.trim(),pass=document.getElementById("itRicambiLoginPass")?.value||"",btn=document.getElementById("itRicambiLoginSubmit"),res=document.getElementById("itRicambiResult");if(!user||!pass){res.textContent="Inserisci email e password IT-Ricambi.";return;}btn.disabled=true;btn.textContent="Accesso…";res.innerHTML=`<strong>Connessione a IT-Ricambi…</strong><span>Sto creando una sessione sicura.</span>`;try{const d=await callItRicambi({action:"login",username:user,password:pass});itRicambiSession={connected:true,expires_at:d.expires_at||null};document.getElementById("itRicambiLoginPass").value="";setItRicambiLoginBox(false);renderItRicambiSession();res.innerHTML=`<strong>Account IT-Ricambi collegato.</strong><span>Sessione salvata lato server e riutilizzata automaticamente finché resta valida.</span>`;}catch(e){const code=e?.code||"";let title="Login IT-Ricambi non riuscito",detail=e?.message||"Operazione non riuscita.";if(code==="BAD_CREDENTIALS"){title="Credenziali rifiutate";}else if(code==="FORM_CHANGED"){title="Login IT-Ricambi cambiato";}else if(code==="LOGIN_FLOW_REJECTED"){title="IT-Ricambi non ha creato la sessione";detail+=" Se dal sito entri normalmente, inviami questa schermata e correggo il flusso senza farti cambiare password.";}else if(code==="NO_SESSION_COOKIE"){title="Sessione non riutilizzabile";}else if(code==="SITE_HTTP"){title="IT-Ricambi non raggiungibile";}res.innerHTML=`<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;}finally{btn.disabled=false;btn.textContent="Accedi a IT-Ricambi";}}
async function disconnectItRicambi(){const btn=document.getElementById("itRicambiDisconnectBtn");btn.disabled=true;try{await callItRicambi({action:"logout"});}catch(e){}itRicambiSession={connected:false,expires_at:null};renderItRicambiSession();setItRicambiLoginBox(false);document.getElementById("itRicambiResult").textContent="Sessione IT-Ricambi rimossa.";btn.disabled=false;}
function openItRicambiCost(key,label){if(!isAdmin())return;const m=ensureItRicambiModal(),q=supplierQuote(key);itRicambiPending={key,label,quote:q};document.getElementById("itRicambiItem").innerHTML=`<strong>${escapeHtml(label)}</strong><span>Fonte costo: IT-Ricambi</span>`;document.getElementById("itRicambiUrl").value=q?.source_url||"";document.getElementById("itRicambiPrice").value=q?.displayed_price!=null?String(q.displayed_price).replace(".",","):"";const res=document.getElementById("itRicambiResult");res.innerHTML=q?`<strong>${escapeHtml(q.source_title||"IT-Ricambi")}</strong><span>Ultimo controllo: ${new Date(q.checked_at).toLocaleString("it-IT")}</span>`:"Incolla il link esatto del ricambio.";const open=document.getElementById("itRicambiOpen");if(q?.source_url){open.href=q.source_url;open.hidden=false;}else open.hidden=true;document.getElementById("itRicambiApply").disabled=!(q?.displayed_price>=0);m.hidden=false;refreshItRicambiSession();}
function bindItRicambiActions(){
  const bind=(id,fn)=>{const el=document.getElementById(id);if(el&&el.dataset.bound!=="1"){el.dataset.bound="1";el.onclick=fn;}};
  bind("itRicambiFetch",fetchItRicambiPrice);bind("itRicambiApply",applyItRicambiPrice);bind("itRicambiConnectBtn",()=>setItRicambiLoginBox(true));bind("itRicambiLoginCancel",()=>setItRicambiLoginBox(false));bind("itRicambiLoginSubmit",connectItRicambi);bind("itRicambiDisconnectBtn",disconnectItRicambi);
}
async function fetchItRicambiPrice(){if(!isAdmin()||!itRicambiPending)return;const url=document.getElementById("itRicambiUrl").value.trim(),btn=document.getElementById("itRicambiFetch"),res=document.getElementById("itRicambiResult");if(!url){res.textContent="Inserisci il link IT-Ricambi.";return;}btn.disabled=true;btn.textContent="Controllo…";res.textContent="Lettura prezzo del tuo account IT-Ricambi…";try{const data=await callItRicambi({action:"price",url});itRicambiSession={connected:true,expires_at:data.expires_at||itRicambiSession.expires_at};renderItRicambiSession();const quote={source_url:data.url||url,source_title:data.title||"IT-Ricambi",displayed_price:Number(data.price),currency:data.currency||"EUR",checked_at:data.checked_at||new Date().toISOString(),supplier:"IT-Ricambi"};if(!Number.isFinite(quote.displayed_price))throw new Error("Prezzo IT-Ricambi non valido.");const {error:saveErr}=await sb.from("beparytech_supplier_quotes").upsert({workspace_owner_id:workspaceOwnerId,item_key:itRicambiPending.key,supplier:"IT-Ricambi",source_url:quote.source_url,source_title:quote.source_title,displayed_price:quote.displayed_price,currency:quote.currency,checked_at:quote.checked_at,updated_by:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"workspace_owner_id,item_key,supplier"});if(saveErr)throw saveErr;supplierQuotes[itRicambiPending.key]=quote;itRicambiPending.quote=quote;document.getElementById("itRicambiPrice").value=String(quote.displayed_price).replace(".",",");res.innerHTML=`<strong>${escapeHtml(quote.source_title)}</strong><span>Prezzo account trovato: ${eur(quote.displayed_price)} · ${new Date(quote.checked_at).toLocaleString("it-IT")}</span>`;const open=document.getElementById("itRicambiOpen");open.href=quote.source_url;open.hidden=false;document.getElementById("itRicambiApply").disabled=false;refreshCostUi();}catch(e){if(e?.code==="SESSION_REQUIRED"||e?.code==="SESSION_EXPIRED"){itRicambiSession={connected:false,expires_at:null};renderItRicambiSession();setItRicambiLoginBox(true);res.innerHTML=`<strong>Login IT-Ricambi necessario.</strong><span>${escapeHtml(e.message||"La sessione è scaduta.")}</span>`;}else res.textContent=e?.message||"Non riesco a leggere automaticamente questo prezzo.";}finally{btn.disabled=false;btn.textContent="Aggiorna prezzo";}}
async function applyItRicambiPrice(){const q=itRicambiPending?.quote;if(!q||!Number.isFinite(Number(q.displayed_price)))return;const value=Number(q.displayed_price);if(!confirm(`Impostare ${eur(value)} come costo effettivo di questo prodotto?`))return;try{await saveManualCost(itRicambiPending.key,value);document.getElementById("itRicambiResult").innerHTML+=`<span class="okText">Costo aggiornato a ${eur(value)}</span>`;refreshCostUi();}catch(e){alert(e?.message||"Errore salvataggio costo");}}
async function loadStores(){if(!currentUser){storeList=[];return;}const {data,error}=await sb.rpc("list_beparytech_stores");if(error){console.error(error);storeList=[];return;}storeList=Array.isArray(data)?data:[];populateStoreControls();renderSalesStoreTabs();if(isAdmin())renderStoreAdmin();}
function populateStoreControls(){const ids=["saleCustomerSelect","editStoreSelect","deviceSaleStore","adminRepairStore"];ids.forEach(id=>{const el=document.getElementById(id);if(!el)return;const prev=el.value;el.innerHTML=`<option value="">Seleziona negozio…</option>`+storeList.filter(x=>x.active!==false).map(x=>`<option value="${escapeHtml(x.name)}">${escapeHtml(x.name)}${x.admin_only?" · ADMIN":""}</option>`).join("");if([...el.options].some(o=>o.value===prev))el.value=prev;});}
function renderSalesStoreTabs(){const box=document.getElementById("salesStoreTabs");if(!box)return;const names=["ALL",...storeList.filter(x=>x.active!==false).map(x=>x.name)];if(salesStoreFilter!=="ALL"&&!names.includes(salesStoreFilter))salesStoreFilter="ALL";box.innerHTML=names.map(n=>`<button type="button" class="salesStoreTab ${salesStoreFilter===n?"active":""}" data-store="${escapeHtml(n)}">${n==="ALL"?"Tutti i negozi":escapeHtml(n)}</button>`).join("");box.querySelectorAll(".salesStoreTab").forEach(b=>b.onclick=()=>{salesStoreFilter=b.dataset.store;renderSales();renderSalesStoreTabs();});}
async function renderStoreAdmin(){const box=document.getElementById("storeAdminList");if(!box||!isAdmin())return;box.innerHTML=storeList.length?storeList.map(s=>`<div class="storeAdminRow" data-id="${s.id}"><div><strong>${escapeHtml(s.name)}</strong><small>${s.admin_only?"Solo Admin":"Visibile agli operatori"}${s.active===false?" · Disattivato":""}</small></div><div><button type="button" class="miniBtn renameStore">Rinomina</button><button type="button" class="miniBtn toggleStore">${s.active===false?"Riattiva":"Disattiva"}</button></div></div>`).join(""):"<div class='emptyState'>Nessun negozio.</div>";box.querySelectorAll(".renameStore").forEach(b=>b.onclick=async()=>{const row=storeList.find(x=>Number(x.id)===Number(b.closest("[data-id]").dataset.id));if(!row)return;const name=prompt("Nuovo nome negozio",row.name);if(!name||!name.trim())return;const {error}=await sb.from("beparytech_stores").update({name:name.trim()}).eq("id",row.id);if(error)alert(error.message);else await loadStores();});box.querySelectorAll(".toggleStore").forEach(b=>b.onclick=async()=>{const row=storeList.find(x=>Number(x.id)===Number(b.closest("[data-id]").dataset.id));if(!row)return;const {error}=await sb.from("beparytech_stores").update({active:row.active===false}).eq("id",row.id);if(error)alert(error.message);else await loadStores();});}

async function loadCloud(){
  if(!currentUser) return;
  document.getElementById("cloudStatus").textContent="☁︎ Sincronizzo…";
  const { data, error } = await sb.from("backglass_inventory").select("item_key,quantity");
  if(error){ document.getElementById("cloudStatus").textContent="Errore cloud"; return; }
  stock={};
  (data||[]).forEach(r=>stock[r.item_key]=r.quantity);
  document.getElementById("cloudStatus").textContent="☁︎ Online";
  render();
}

async function setQty(model,color,value){
  if(!isAdmin()) return;
  value=Math.max(0, parseInt(value||0,10)||0);
  document.getElementById("cloudStatus").textContent="☁︎ Salvataggio…";
  const itemKey=keyFor(model,color);
  const {data,error}=await sb.rpc("set_beparytech_inventory_quantity",{
    p_item_key:itemKey,p_model:model,p_color:color,p_quantity:value
  });
  if(error){
    document.getElementById("cloudStatus").textContent="Errore cloud";
    return;
  }
  stock[itemKey]=Number(data);
  render();
  document.getElementById("cloudStatus").textContent="☁︎ Salvato";
}


function imageForModel(model){
  const slug=model.toLowerCase().replaceAll("ª","a").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return slug+".png";
}
function modelSortKey(name){
  const n=String(name||"").trim().toLowerCase();
  const m=n.match(/iphone\s+(\d+)/);
  if(!m){
    if(n.includes("iphone x")){
      const rank=n.includes("xr")?1:n.includes("xs max")?3:n.includes("xs")?2:0;
      return [10,rank,n];
    }
    if(n.includes("iphone air")) return [17,2,n];
    if(n.includes("iphone se")){ const gen=n.match(/(2|3)/); return [gen?Number(gen[1])===2?11.5:13.5:99,9,n]; }
    return [999,99,n];
  }
  const num=Number(m[1]);
  let rank=0;
  if(/\be\b/.test(n)||n.includes(`${num}e`)) rank=0.5;
  if(n.includes("mini")) rank=1;
  if(n.includes("plus")) rank=2;
  if(n.includes("pro max")) rank=4; else if(n.includes("pro")) rank=3;
  return [num,rank,n];
}
function compareModels(a,b){
  const A=modelSortKey(typeof a==="string"?a:a?.name),B=modelSortKey(typeof b==="string"?b:b?.name);
  return A[0]-B[0]||A[1]-B[1]||String(A[2]).localeCompare(String(B[2]),"it",{numeric:true,sensitivity:"base"});
}

function render(){
  if(!currentUser) return;
  inventory.innerHTML="";
  const q=search.value.trim().toLowerCase(); let visibleModels=0;
  Object.entries(MODEL_COLORS).sort((a,b)=>compareModels(a[0],b[0])).forEach(([model,colors])=>{
    if(currentCategory === "BackGlass" && (model === "iPhone 7" || model === "iPhone 7 Plus")) return;
    const filteredColors=colors.filter(color=>{
      const qty=getQty(model,color); return (model+" "+color).toLowerCase().includes(q)&&passesFilter(qty);
    });
    if(!filteredColors.length)return; visibleModels++;
    const node=modelTemplate.content.cloneNode(true), section=node.querySelector(".model"), header=node.querySelector(".modelHeader");
    section.classList.add("closed");
    header.setAttribute("aria-expanded","false");
    node.querySelector("h2").textContent=model;
    const thumb=node.querySelector(".modelThumb");
    thumb.src=imageForModel(model);
    thumb.alt=model;
    node.querySelector(".modelCount").textContent=colors.reduce((s,c)=>s+getQty(model,c),0)+" pezzi";
    const colorsBox=node.querySelector(".colors");
    filteredColors.forEach(color=>{
      const row=colorTemplate.content.cloneNode(true), qtyInput=row.querySelector(".qty"), status=row.querySelector(".status");
      const qty=getQty(model,color), [label,cls]=statusFor(qty);
      row.querySelector(".colorName").textContent=color; row.querySelector(".dot").style.background=colorDot(color);
      qtyInput.value=qty; status.textContent=label; status.className="status "+cls;
      if(isAdmin()){const colorRow=row.querySelector(".colorRow")||row.firstElementChild;const k=fixedCostKey(currentCategory,keyFor(model,color));if(colorRow){const wrap=document.createElement("div");wrap.innerHTML=costBadgeHtml(k);const costNode=wrap.firstElementChild;if(costNode){wireCostBadge(costNode,k,`${model} · ${color}`);colorRow.appendChild(costNode);}}}
      row.querySelector(".minus").onclick=()=>openSaleModal(model,color,qty);
      const plusBtn=row.querySelector(".plus");
      if(isAdmin()){
        plusBtn.onclick=()=>setQty(model,color,qty+1);
        qtyInput.onchange=()=>setQty(model,color,qtyInput.value);
      }else{
        plusBtn.hidden=true;
        qtyInput.readOnly=true;
        qtyInput.classList.add("readonlyQty");
      }
      colorsBox.appendChild(row);
    });
    header.onclick=()=>{
      const willOpen=section.classList.contains("closed");
      section.classList.toggle("closed");
      header.setAttribute("aria-expanded", willOpen ? "true" : "false");
    };
    inventory.appendChild(node);
  });
  if(!visibleModels) inventory.innerHTML='<div class="emptyState">Nessun articolo trovato.</div>';
  updateStats();
}
function updateStats(){
  const all=Object.entries(MODEL_COLORS).filter(([m])=>!(currentCategory === "BackGlass" && (m === "iPhone 7" || m === "iPhone 7 Plus"))).flatMap(([m,colors])=>colors.map(c=>getQty(m,c)));
  document.getElementById("totalPieces").textContent=all.reduce((a,b)=>a+b,0);
  document.getElementById("availableTypes").textContent=all.filter(x=>x>0).length;
  document.getElementById("lowStock").textContent=all.filter(x=>x>0&&x<=2).length;
}
function isAdmin(){
  return !!(currentUser && currentProfile?.role === "admin" && currentProfile?.active);
}
function applyRoleVisibility(){
  const admin=isAdmin();
  const usersTab=document.getElementById("usersTab");
  const usersView=document.getElementById("usersView");
  const catalogView=document.getElementById("catalogView");
  const catalogMenu=document.getElementById("catalogMenuItem");
  const usersMenu=document.getElementById("usersMenuItem");
  const backupMenu=document.getElementById("backupMenuItem");
  const zeroStockMenu=document.getElementById("zeroStockMenuItem");
  const hoursMenu=document.getElementById("hoursMenuItem");
  const deviceSalesMenu=document.getElementById("deviceSalesMenuItem");
  const bestekCatalogMenu=document.getElementById("bestekCatalogMenuItem");
  usersTab.hidden=!admin;
  if(catalogMenu) catalogMenu.hidden=!admin;
  if(usersMenu) usersMenu.hidden=!admin;
  if(backupMenu) backupMenu.hidden=!admin;
  if(zeroStockMenu) zeroStockMenu.hidden=!admin;
  if(hoursMenu) hoursMenu.hidden=!admin;
  if(deviceSalesMenu) deviceSalesMenu.hidden=!admin;
  if(bestekCatalogMenu) bestekCatalogMenu.hidden=!admin;
  if(!admin){
    usersView.hidden=true;
    if(catalogView) catalogView.hidden=true;
    usersTab.classList.remove("active");
    document.getElementById("hoursView").hidden=true;
    const dsv=document.getElementById("deviceSalesView"); if(dsv) dsv.hidden=true;
    if(["Utenti","GestioneMagazzino","ScorteZero","Backup","Orari","VenditeAdmin","CatalogoBestek"].includes(currentCategory)) setCategory("Dashboard");
  }
  const menuUser=document.getElementById("menuUserName"), menuRole=document.getElementById("menuUserRole");
  if(menuUser) menuUser.textContent=currentProfile?.username||currentUser?.email||"Utente";
  if(menuRole) menuRole.textContent=admin?"Amministratore":"Operatore standard";
}
async function loadAccountOperators(){
  accountOperators=[];
  if(!currentUser) return;
  const {data,error}=await sb.rpc("list_beparytech_account_operators");
  if(error){
    console.error("Impossibile caricare gli operatori account:",error.message);
    return;
  }
  if(Array.isArray(data)) accountOperators=data.filter(o=>o && o.name);
}
function populateSaleOperatorControl(){
  const hidden=document.getElementById("saleOperatorName");if(hidden){hidden.innerHTML='<option value=""></option>';hidden.value="";}
  const code=document.getElementById("saleOperatorPassword");if(code){code.placeholder="Codice operatore";code.value="";}
  const resolved=document.getElementById("saleOperatorResolvedName");if(resolved)resolved.textContent="Automatico dal codice";
}
async function loadMyProfile(){
  currentProfile=null; workspaceOwnerId=currentUser?.id || null; accountOperators=[];
  applyRoleVisibility();
  if(!currentUser) return;
  const {data,error}=await sb.from("beparytech_profiles").select("username,role,active,workspace_owner_id").eq("user_id",currentUser.id).maybeSingle();
  if(!error && data){
    currentProfile=data; workspaceOwnerId=data.workspace_owner_id || currentUser.id;
  }
  await loadAccountOperators();
  applyRoleVisibility();
}
async function showAuth(user){
  currentUser=user||null; currentProfile=null; workspaceOwnerId=user?.id||null; document.body.classList.toggle("logged-in",!!user);
  document.getElementById("signedOut").hidden=!!user; document.getElementById("signedIn").hidden=!user;
  document.getElementById("authPanel")?.classList.toggle("loggedIn",!!user);
  const headerLogout=document.getElementById("headerLogoutBtn"); if(headerLogout) headerLogout.hidden=!user;
  const headerCloud=document.getElementById("headerCloudPill"); if(headerCloud) headerCloud.hidden=!user;
  if(user){
    document.getElementById("userEmail").textContent=user.email;
    await loadMyProfile();
    await Promise.all([loadCloud(),loadCustomCatalog(),loadAdminCosts(),loadStores()]);
    document.getElementById("globalSearchBar").hidden=false;
    setCategory("Dashboard");
  }else{
    document.getElementById("globalSearchBar").hidden=true;
    document.getElementById("globalSearchResults").hidden=true;
    document.getElementById("usersTab").hidden=true;
    document.getElementById("usersView").hidden=true;
  }
}

document.getElementById("loginBtn").onclick=async()=>{
  authMsg.textContent="";
  const email=document.getElementById("email").value.trim(), password=document.getElementById("password").value;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error) authMsg.textContent=error.message; else showAuth(data.user);
};

document.getElementById("forgotPasswordBtn").onclick=async()=>{
  const email=document.getElementById("email").value.trim();
  authMsg.textContent="";
  if(!email){authMsg.textContent="Inserisci prima la tua email.";return;}
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:PASSWORD_RESET_REDIRECT});
  authMsg.textContent=error?error.message:"Email di recupero inviata. Controlla la posta.";
};
async function performLogout(){await sb.auth.signOut(); stock={}; showAuth(null);}
document.getElementById("logoutBtn").onclick=performLogout;
document.getElementById("headerLogoutBtn")?.addEventListener("click",performLogout);


function setCategory(category){
  const isDashboard=category==="Dashboard", isSales=category==="Vendite", isAudit=category==="Cronologia", isUsers=category==="Utenti", isCatalog=category==="GestioneMagazzino", isZeroStock=category==="ScorteZero", isBackup=category==="Backup", isHours=category==="Orari", isDeviceSales=category==="VenditeAdmin", isBestekCatalog=category==="CatalogoBestek";
  const isCustom=String(category).startsWith("custom:");
  if((isUsers||isCatalog||isZeroStock||isBackup||isHours||isDeviceSales||isBestekCatalog)&&!isAdmin()) return;
  currentCategory=category;
  currentCustomSectionId=isCustom?Number(String(category).split(":")[1]):null;
  const sec=isCustom?customSections.find(s=>Number(s.id)===currentCustomSectionId):null;
  const title=isDashboard?"Dashboard":isAudit?"Cronologia":isSales?"Vendute":isUsers?"Utenti":isCatalog?"Gestione magazzino":isZeroStock?"Scorte a zero":isBackup?"Backup":isHours?"I miei orari":isDeviceSales?"Vendite ricambi":isBestekCatalog?"Catalogo Bestek":sec?.name||category;
  const desc=isDashboard?"Riepilogo generale":isAudit?"Tutte le attività del gestionale":isSales?"Vendite, note, stampa DYMO e rientri":isUsers?"Gestione accessi":isCatalog?"Crea e gestisci sezioni e prodotti":isZeroStock?"BackGlass e Housing esauriti, separati":isBackup?"Esporta una copia dei dati":isHours?"Area privata Admin · ore lavorate ed extra":isDeviceSales?"Area privata Admin · ricambi elettronici, IVA e acquisti":isBestekCatalog?"Area privata Admin · codici e accessori Bestek":sec?.description||"Sezione magazzino";
  document.getElementById("categoryName").textContent=title;
  document.getElementById("categoryDescription").textContent=desc;
  document.querySelector(".tools").hidden=isDashboard||isSales||isAudit||isUsers||isCatalog||isZeroStock||isBackup||isHours||isDeviceSales||isBestekCatalog;
  document.querySelector(".stats").hidden=isDashboard||isSales||isAudit||isUsers||isCatalog||isZeroStock||isBackup||isHours||isDeviceSales||isBestekCatalog;
  inventory.hidden=isDashboard||isSales||isAudit||isUsers||isCatalog||isZeroStock||isBackup||isHours||isDeviceSales||isBestekCatalog;
  document.getElementById("dashboardView").hidden=!isDashboard;
  document.getElementById("salesView").hidden=!isSales;
  document.getElementById("auditView").hidden=!isAudit;
  document.getElementById("usersView").hidden=!isUsers;
  document.getElementById("catalogView").hidden=!isCatalog;
  const bestekView=document.getElementById("bestekCatalogView"); if(bestekView) bestekView.hidden=!isBestekCatalog;
  document.getElementById("zeroStockView").hidden=!isZeroStock;
  document.getElementById("backupView").hidden=!isBackup;
  document.getElementById("hoursView").hidden=!isHours;
  const deviceSalesView=document.getElementById("deviceSalesView"); if(deviceSalesView) deviceSalesView.hidden=!isDeviceSales;
  document.querySelectorAll(".menuItem[data-category]").forEach(b=>b.classList.toggle("active",b.dataset.category===category));
  search.value=""; filter.value="all"; closeMainMenu();
  if(isDashboard) loadDashboard(); else if(isAudit) loadAudit(); else if(isSales) loadSales(); else if(isUsers) loadUsers(); else if(isCatalog) renderCatalogAdmin(); else if(isZeroStock) renderZeroStock(); else if(isBackup){} else if(isHours) loadHours(); else if(isDeviceSales) loadDeviceSales(); else if(isBestekCatalog) renderBestekCatalog(); else if(isCustom) renderCustomSection();
}


let BESTEK_CATALOG = [];
let bestekCatalogLoaded = false;
let bestekCatalogLoading = false;
let bestekEditingCode = null;
const bestekEuro = new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});

function bestekPriceText(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return "Prezzo non impostato";
  return `${bestekEuro.format(n)} + IVA`;
}
function bestekGrossText(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return "";
  return `${bestekEuro.format(n*1.22)} IVA incl.`;
}
function resetBestekForm(){
  bestekEditingCode=null;
  const form=document.getElementById("bestekProductForm"); if(form) form.reset();
  const title=document.getElementById("bestekFormTitle"); if(title) title.textContent="Aggiungi prodotto Bestek";
  const save=document.getElementById("bestekSaveBtn"); if(save) save.textContent="+ Aggiungi prodotto";
  const cancel=document.getElementById("bestekCancelEdit"); if(cancel) cancel.hidden=true;
  const code=document.getElementById("bestekCodeInput"); if(code) code.disabled=false;
  const msg=document.getElementById("bestekFormMsg"); if(msg) msg.textContent="";
}
function editBestekProduct(code){
  if(!isAdmin()) return;
  const row=BESTEK_CATALOG.find(x=>x.code===code); if(!row) return;
  bestekEditingCode=code;
  document.getElementById("bestekCodeInput").value=row.code||"";
  document.getElementById("bestekCodeInput").disabled=true;
  document.getElementById("bestekNameInput").value=row.name||"";
  document.getElementById("bestekCategoryInput").value=row.category||"";
  document.getElementById("bestekPriceInput").value=row.price_ex_vat==null?"":Number(row.price_ex_vat).toFixed(2);
  document.getElementById("bestekFormTitle").textContent=`Modifica ${row.code}`;
  document.getElementById("bestekSaveBtn").textContent="Salva modifiche";
  document.getElementById("bestekCancelEdit").hidden=false;
  document.getElementById("bestekProductForm")?.scrollIntoView({behavior:"smooth",block:"center"});
}
async function deleteBestekProduct(code){
  if(!isAdmin()) return;
  const row=BESTEK_CATALOG.find(x=>x.code===code);
  if(!row || !confirm(`Rimuovere ${row.code} · ${row.name} dal catalogo Bestek?`)) return;
  const {error}=await sb.from("beparytech_bestek_catalog").delete().eq("code",code);
  if(error){alert(error.message||"Impossibile rimuovere il prodotto.");return;}
  if(bestekEditingCode===code) resetBestekForm();
  bestekCatalogLoaded=false;
  await loadBestekCatalog();
}

async function loadBestekCatalog(){
  if(!isAdmin()) return;
  if(bestekCatalogLoading) return;
  bestekCatalogLoading = true;
  const list=document.getElementById("bestekCatalogList");
  if(list && !bestekCatalogLoaded) list.innerHTML='<div class="emptyState">Caricamento catalogo protetto…</div>';
  try{
    const {data,error}=await sb
      .from("beparytech_bestek_catalog")
      .select("code,name,category,price_ex_vat,active,updated_at")
      .eq("active",true)
      .order("category",{ascending:true})
      .order("code",{ascending:true});
    if(error) throw error;
    BESTEK_CATALOG=Array.isArray(data)?data:[];
    bestekCatalogLoaded=true;
    const sel=document.getElementById("bestekCategory");
    if(sel){
      const selected=sel.value||"all";
      sel.innerHTML='<option value="all">Tutte le categorie</option>';
      [...new Set(BESTEK_CATALOG.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it")).forEach(c=>sel.insertAdjacentHTML("beforeend",`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`));
      if([...sel.options].some(o=>o.value===selected)) sel.value=selected;
    }
  }catch(e){
    console.error("Catalogo Bestek non disponibile:",e?.message||e);
    BESTEK_CATALOG=[];
    bestekCatalogLoaded=false;
    if(list) list.innerHTML='<div class="emptyState">Catalogo non disponibile. Accesso consentito solo all\'Admin.</div>';
  }finally{
    bestekCatalogLoading=false;
  }
  renderBestekCatalog();
}

function renderBestekCatalog(){
  if(!isAdmin()) return;
  const list=document.getElementById("bestekCatalogList"), q=(document.getElementById("bestekSearch")?.value||"").trim().toLowerCase(), cat=document.getElementById("bestekCategory")?.value||"all";
  if(!list) return;
  if(!bestekCatalogLoaded){loadBestekCatalog();return;}
  const rows=BESTEK_CATALOG.filter(x=>(cat==="all"||x.category===cat)&&(!q||`${x.code} ${x.name} ${x.category}`.toLowerCase().includes(q)));
  const count=document.getElementById("bestekCount"); if(count) count.textContent=rows.length;
  list.innerHTML=rows.length?rows.map(x=>{
    const hasPrice=x.price_ex_vat!==null&&x.price_ex_vat!==""&&Number.isFinite(Number(x.price_ex_vat));
    return `<article class="bestekCard premiumBestekCard"><div class="bestekCodeWrap"><div class="bestekCode">${escapeHtml(x.code)}</div><span class="bestekPrivateBadge">ADMIN</span></div><div class="bestekInfo"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.category)}</span></div><div class="bestekPrice ${hasPrice?"hasPrice":"noPrice"}"><strong>${hasPrice?bestekPriceText(x.price_ex_vat):"Da impostare"}</strong>${hasPrice?`<small>${bestekGrossText(x.price_ex_vat)}</small>`:`<small>Nessun prezzo salvato</small>`}</div><div class="bestekCardActions"><button type="button" class="miniBtn bestekCopy" data-code="${escapeHtml(x.code)}">Copia</button><button type="button" class="miniBtn bestekEdit" data-code="${escapeHtml(x.code)}">Modifica</button><button type="button" class="miniBtn danger bestekDelete" data-code="${escapeHtml(x.code)}">Rimuovi</button></div></article>`;
  }).join(""):'<div class="emptyState">Nessun prodotto trovato</div>';
  list.querySelectorAll(".bestekCopy").forEach(b=>b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(b.dataset.code);const old=b.textContent;b.textContent="Copiato ✓";setTimeout(()=>b.textContent=old,1200)}catch(e){}}));
  list.querySelectorAll(".bestekEdit").forEach(b=>b.addEventListener("click",()=>editBestekProduct(b.dataset.code)));
  list.querySelectorAll(".bestekDelete").forEach(b=>b.addEventListener("click",()=>deleteBestekProduct(b.dataset.code)));
}
document.getElementById("bestekSearch")?.addEventListener("input",renderBestekCatalog);
document.getElementById("bestekCategory")?.addEventListener("change",renderBestekCatalog);
document.getElementById("bestekCancelEdit")?.addEventListener("click",resetBestekForm);
document.getElementById("bestekProductForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!isAdmin()) return;
  const code=(document.getElementById("bestekCodeInput")?.value||"").trim().toUpperCase();
  const name=(document.getElementById("bestekNameInput")?.value||"").trim();
  const category=(document.getElementById("bestekCategoryInput")?.value||"").trim();
  const rawPrice=(document.getElementById("bestekPriceInput")?.value||"").trim();
  const price=rawPrice===""?null:Number(rawPrice);
  const msg=document.getElementById("bestekFormMsg"), save=document.getElementById("bestekSaveBtn");
  if(!code||!name||!category){if(msg) msg.textContent="Compila codice, nome e categoria.";return;}
  if(price!==null&&(!Number.isFinite(price)||price<0)){if(msg) msg.textContent="Inserisci un prezzo valido.";return;}
  if(msg) msg.textContent="Salvataggio…"; if(save) save.disabled=true;
  try{
    let error;
    if(bestekEditingCode){
      ({error}=await sb.from("beparytech_bestek_catalog").update({name,category,price_ex_vat:price}).eq("code",bestekEditingCode));
    }else{
      ({error}=await sb.from("beparytech_bestek_catalog").insert({code,name,category,price_ex_vat:price,active:true}));
    }
    if(error) throw error;
    if(msg) msg.textContent=bestekEditingCode?"Modifiche salvate ✓":"Prodotto aggiunto ✓";
    resetBestekForm();
    bestekCatalogLoaded=false;
    await loadBestekCatalog();
  }catch(err){
    if(msg) msg.textContent=err?.code==="23505"?"Questo codice Bestek esiste già.":(err?.message||"Impossibile salvare il prodotto.");
  }finally{if(save) save.disabled=false;}
});

async function loadUsers(){
  if(!isAdmin()) return;
  const list=document.getElementById("usersList");
  list.innerHTML='<div class="emptyState">Caricamento utenti…</div>';
  const {data,error}=await sb.functions.invoke("beparytech-users",{method:"GET"});
  if(error || data?.error){
    list.innerHTML='<div class="emptyState">Impossibile caricare gli utenti.</div>';
    return;
  }
  const users=data?.users||[];
  document.getElementById("usersCount").textContent=users.length;
  const loginPwSelect=document.getElementById("adminLoginPasswordUser"); if(loginPwSelect){ loginPwSelect.innerHTML=`<option value="">Seleziona utente…</option>`+users.map(u=>`<option value="${escapeHtml(u.user_id)}">${escapeHtml(u.username||u.email||"Utente")}${u.email?` · ${escapeHtml(u.email)}`:""}</option>`).join(""); }
  if(!users.length){list.innerHTML='<div class="emptyState">Nessun utente.</div>';return;}
  list.innerHTML=users.map(u=>{
    const initial=(u.username||u.email||"U").trim().charAt(0).toUpperCase();
    return `<article class="userRow"><div class="userAvatar">${escapeHtml(initial)}</div><div class="userInfo"><strong>${escapeHtml(u.username||"Utente")}</strong><span>${escapeHtml(u.email||"")}</span><small class="operatorPasswordState ${u.operator_password_set?"set":""}">${u.operator_password_set?"Password operatore impostata":"Password operatore da impostare"}</small></div><div class="userRowActions"><span class="roleBadge ${u.role==="admin"?"admin":""}">${u.role==="admin"?"Admin":"Standard"}</span><button class="rowAction manageAccountOperators" type="button" data-user-id="${escapeHtml(u.user_id)}" data-username="${escapeHtml(u.username||"Utente")}">Operatori</button><button class="rowAction setOperatorPassword" type="button" data-user-id="${escapeHtml(u.user_id)}" data-username="${escapeHtml(u.username||"Utente")}">Password operatore</button></div></article>`;
  }).join("");
  list.querySelectorAll(".setOperatorPassword").forEach(btn=>btn.addEventListener("click",()=>openOperatorPassword(btn.dataset.userId,btn.dataset.username)));
  list.querySelectorAll(".manageAccountOperators").forEach(btn=>btn.addEventListener("click",()=>openAccountOperators(btn.dataset.userId,btn.dataset.username)));
}

document.getElementById("createUserForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!isAdmin()) return;
  const btn=document.getElementById("createUserBtn"), msg=document.getElementById("createUserMsg");
  const payload={
    username:document.getElementById("newUsername").value.trim(),
    email:document.getElementById("newUserEmail").value.trim(),
    password:document.getElementById("newUserPassword").value,
    operator_password:document.getElementById("newOperatorPassword").value,
    role:document.getElementById("newUserRole").value
  };
  if(!isStrongLoginPassword(payload.password)){msg.textContent="Password: minimo 12 caratteri con maiuscola, minuscola, numero e simbolo.";return;}
  if(!isStrongLoginPassword(payload.operator_password)){msg.textContent="Password operatore: minimo 12 caratteri con maiuscola, minuscola, numero e simbolo.";return;}
  if(payload.password.length>128||payload.operator_password.length>128){msg.textContent="Password troppo lunga.";return;}
  msg.className="createUserMsg"; msg.textContent=""; btn.disabled=true; btn.textContent="Creazione…";
  const {data,error}=await sb.functions.invoke("beparytech-users",{body:payload,method:"POST"});
  btn.disabled=false; btn.textContent="Crea utente";
  if(error || data?.error){msg.className="createUserMsg error";msg.textContent=data?.error||error?.message||"Impossibile creare l'utente.";return;}
  msg.className="createUserMsg ok";msg.textContent="Utente creato correttamente.";
  e.target.reset(); document.getElementById("newUserRole").value="standard";
  await loadUsers();
});

document.getElementById("refreshUsersBtn").onclick=loadUsers;
async function openSaleModal(model,color,qty){
  if(qty<=0) return;
  pendingSale={model,color,category:currentCategory,itemKey:keyFor(model,color)};
  selectedCustomer=null;
  await loadAccountOperators();
  populateSaleOperatorControl();
  document.getElementById("saleOperatorPassword").value="";
  document.getElementById("saleNote").value="";
  document.getElementById("saleEShareRef").value="";
  document.getElementById("saleItemLabel").innerHTML=`<strong>${escapeHtml(model)}</strong><span>${escapeHtml(color)} · ${currentCategory === "BackGlass" ? "Vetro posteriore" : "Scocca completa"}</span>`;
  const customerSelect=document.getElementById("saleCustomerSelect");
  customerSelect.value="";
  document.getElementById("confirmSaleBtn").disabled=true;
  document.getElementById("saleError").textContent="";
  document.getElementById("saleModal").hidden=false;
}
function closeSaleModal(){
  document.getElementById("saleModal").hidden=true; pendingSale=null; selectedCustomer=null;
}
function updateSaleConfirmState(){
  selectedCustomer=document.getElementById("saleCustomerSelect").value||null;
  const pass=document.getElementById("saleOperatorPassword").value.trim();
  document.getElementById("confirmSaleBtn").disabled=!(selectedCustomer&&pass.length>=4);
}
document.getElementById("saleCustomerSelect").addEventListener("change",updateSaleConfirmState);
document.getElementById("saleOperatorPassword").addEventListener("input",updateSaleConfirmState);
document.getElementById("cancelSaleBtn").onclick=closeSaleModal;
document.getElementById("cancelSaleX").onclick=closeSaleModal;
document.getElementById("saleModal").addEventListener("click",e=>{if(e.target.id==="saleModal") closeSaleModal();});

document.getElementById("confirmSaleBtn").onclick=async()=>{
  if(!pendingSale || !selectedCustomer || !currentUser) return;
  const btn=document.getElementById("confirmSaleBtn");
  btn.disabled=true; btn.textContent="Salvo…"; document.getElementById("saleError").textContent="";
  const p=pendingSale;
  const commonOperator={
    p_customer:selectedCustomer,
    p_operator_name:"",
    p_operator_password:document.getElementById("saleOperatorPassword").value,
    p_note:(()=>{const r=document.getElementById("saleEShareRef").value.trim();const n=document.getElementById("saleNote").value.trim();return [r?`Rif. e-Share: ${r}`:"",n].filter(Boolean).join(" · ")||null;})()
  };
  const result=p.kind==="custom"
    ? await sb.rpc("record_beparytech_product_sale",{p_product_id:p.productId,...commonOperator})
    : await sb.rpc("record_beparytech_sale",{p_category:p.category,p_item_key:p.itemKey,p_model:p.model,p_color:p.color,...commonOperator});
  const {data,error}=result;
  btn.textContent="Conferma −1";
  if(error){
    document.getElementById("saleError").textContent=error.message || "Impossibile registrare la vendita.";
    btn.disabled=false; return;
  }
  if(p.kind==="custom"){
    const product=customProducts.find(x=>Number(x.id)===Number(p.productId));
    if(product) product.quantity=Number(data);
    closeSaleModal(); renderCustomSection();
  }else{
    stock[p.itemKey]=Number(data);
    closeSaleModal(); render();
  }
  document.getElementById("cloudStatus").textContent="☁︎ Scarico −1 salvato";
};

async function loadSales(){
  if(!currentUser) return;
  const list=document.getElementById("salesList");
  list.innerHTML='<div class="emptyState">Caricamento vendite…</div>';
  const {data,error}=await sb.from("beparytech_sales").select("id,customer,category,item_key,model,color,quantity,sold_at,is_archived,deleted_at,delete_reason,restored_to_inventory,actor_user_id,operator_name,operator_note,restore_reason,delivered_at,delivered_by").order("sold_at",{ascending:false}).limit(1000);
  if(error){list.innerHTML='<div class="emptyState">Errore nel caricamento delle vendite.</div>'; return;}
  sales=data||[]; renderSalesStoreTabs(); renderSales();
}
function renderSales(){
  const list=document.getElementById("salesList");
  const summary=salesMode==="summary";
  const archived=salesMode==="archive";
  document.getElementById("activeSalesTab").classList.toggle("active",salesMode==="active");
  document.getElementById("archiveSalesTab").classList.toggle("active",archived);
  document.getElementById("soldSummaryTab")?.classList.toggle("active",summary);
  if(summary){renderSalesSummary();return;}

  const visible=sales.filter(s=>Boolean(s.is_archived)===archived).filter(s=>salesStoreFilter==="ALL"||s.customer===salesStoreFilter);
  if(!visible.length){list.innerHTML=`<div class="emptyState">${archived?"Nessuna vendita nell’archivio.":"Nessuna vendita registrata."}</div>`; return;}
  const fmt=new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
  list.innerHTML=visible.map(s=>{
    const sold=fmt.format(new Date(s.sold_at));
    const price=salePriceHtml(s);
    if(archived){
      const delivered=Boolean(s.delivered_at) || s.delete_reason==="__CONSEGNATO__";
      if(delivered){
        const deliveredDate=s.delivered_at||s.deleted_at||s.sold_at;
        const deliveredAt=fmt.format(new Date(deliveredDate));
        return `<article class="saleRow archiveRow deliveredRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}</span><b class="archiveBadge deliveredBadge">✓ CONSEGNATO</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Consegnato ${deliveredAt}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}</div><div class="saleNoteActions"><button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>${isAdmin()?`<button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button>`:""}</div></article>`;
      }
      const deleted=s.deleted_at?fmt.format(new Date(s.deleted_at)):"—";
      return `<article class="saleRow archiveRow deletedArchiveRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}</span><b class="archiveBadge">ARCHIVIATA</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Eliminata ${deleted}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}${s.restored_to_inventory?`<span class="restoredBadge">↩ Rimesso in magazzino +${s.quantity}</span>`:""}</div><div class="archiveReason"><strong>Motivo:</strong> ${escapeHtml(s.delete_reason||"Nessun motivo registrato")}</div><div class="saleNoteActions"><button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>${isAdmin()?`<button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button>`:""}</div></article>`;
    }
    const ownSale=String(s.actor_user_id||"")===String(currentUser?.id||"");
    const commonActions=`${isAdmin()?`<button class="rowAction deliveredSale" type="button" data-id="${s.id}">✓ Consegnato</button>`:""}<button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>`;
    const actions=isAdmin()
      ? `<div class="saleActionsRow">${commonActions}<button class="rowAction editStore" type="button" data-id="${s.id}">Modifica negozio</button><button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button><button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button><button class="rowAction delete archiveSale" type="button" data-id="${s.id}">Elimina</button></div>`
      : ownSale ? `<div class="saleActionsRow">${commonActions}<button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button></div>` : `<div class="saleActionsRow">${commonActions}</div>`;
    return `<article class="saleRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}</span>${s.operator_name?`<span class="operatorTag">Operatore: ${escapeHtml(s.operator_name)}</span>`:""}</div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · ${sold}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}</div>${actions}</article>`;
  }).join("");
  list.querySelectorAll(".printSaleNote").forEach(btn=>btn.addEventListener("click",()=>printSaleNote(Number(btn.dataset.id))));
  list.querySelectorAll(".exportSaleNote").forEach(btn=>btn.addEventListener("click",()=>exportSaleNote(Number(btn.dataset.id))));
  if(isAdmin()) list.querySelectorAll(".editSaleNote").forEach(btn=>btn.addEventListener("click",()=>openSaleNoteEditor(Number(btn.dataset.id))));
  if(!archived){
    list.querySelectorAll(".deliveredSale").forEach(btn=>btn.addEventListener("click",()=>markSaleDelivered(Number(btn.dataset.id),btn)));
    list.querySelectorAll(".restoreSale").forEach(btn=>btn.addEventListener("click",()=>openRestoreSale(Number(btn.dataset.id))));
    if(isAdmin()){
      list.querySelectorAll(".editStore").forEach(btn=>btn.addEventListener("click",()=>openEditStore(Number(btn.dataset.id))));
      list.querySelectorAll(".archiveSale").forEach(btn=>btn.addEventListener("click",()=>openDeleteSale(Number(btn.dataset.id))));
    }
  }
}
async function markSaleDelivered(id,btn){
  const s=saleById(id); if(!s)return;
  const ok=window.confirm(`Segnare come consegnato?\n\n${s.model} · ${s.color}\n${s.customer}\n\nLa vendita verrà spostata nell’Archivio vendite.`);
  if(!ok)return;
  const old=btn.textContent; btn.disabled=true; btn.textContent="Salvo…";
  // v64: usa esclusivamente la RPC protetta lato database.
  // La RPC verifica che l'utente autenticato abbia ruolo ADMIN.
  const {error}=await sb.rpc("mark_beparytech_sale_delivered",{p_id:id});
  if(error){alert(error.message||"Impossibile segnare la vendita come consegnata.");btn.disabled=false;btn.textContent=old;return;}
  document.getElementById("cloudStatus").textContent="☁︎ Vendita consegnata";
  await loadSales();
}
function saleById(id){ return sales.find(s=>Number(s.id)===Number(id)); }

// v60 — Listino BackGlass. I prezzi sono imponibili (IVA 22% esclusa).
// Le regole sono applicate anche alle vendite storiche perché il prezzo viene calcolato dal modello.
function backGlassUnitPrice(model){
  const n=String(model||"").trim().toLowerCase();
  const match=n.match(/iphone\s+(\d+)/);
  if(n==="iphone air") return 25; // linea attuale, trattata come serie 17 non-Pro
  if(!match) return 20; // prezzo predefinito per modelli senza listino specifico
  const series=Number(match[1]);
  if(series<11) return 15; // iPhone 8 / X / XR / XS / XS Max / SE: 15 € + IVA
  if(series>17) return 20; // default per future serie senza listino specifico
  const isPlus=n.includes("plus");
  const isProMax=n.includes("pro max");
  const isPro=n.includes("pro") && !isProMax;

  if(series===17){
    if(isPro || isProMax) return 20;
    return 25; // 17 / 17e
  }
  if(series===16){
    if(isPro || isProMax) return 30; // 16 Pro / 16 Pro Max
    return 25; // 16 / 16e / 16 Plus
  }
  if(series===15){
    if(isPlus || isProMax) return 25;
    return 20; // 15 / 15 Pro
  }
  if(isPlus) return 25;
  return 20; // 11–14 normali, mini, Pro e Pro Max fino al 14
}
function saleUnitPrice(s){
  return s?.category==="BackGlass" ? backGlassUnitPrice(s.model) : null;
}
function eur(v){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(Number(v||0));}
function salePriceHtml(s,{showLineTotal=true}={}){
  const unit=saleUnitPrice(s); if(unit==null) return "";
  const gross=unit*1.22;
  const qty=Math.max(1,Number(s.quantity||1));
  const adminLine=isAdmin()&&showLineTotal?`<span class="saleLineTotal">Totale riga: <b>${eur(unit*qty)}</b> + IVA = <b>${eur(gross*qty)}</b></span>`:"";
  return `<span class="salePriceTag">Prezzo: <b>${eur(unit)}</b> + IVA <small>(${eur(gross)} IVA incl.)</small></span>${adminLine}`;
}
function saleCountsAsSold(s){
  if(s?.restored_to_inventory) return false;
  if(!s?.is_archived) return true;
  return Boolean(s?.delivered_at) || s?.delete_reason==="__CONSEGNATO__"; // consegne legacy/fallback contano come vendite effettive
}
function renderSalesSummary(){
  const list=document.getElementById("salesList");
  const valid=sales.filter(saleCountsAsSold);
  const groups=new Map();
  valid.forEach(s=>{
    const k=`${s.category}||${s.model}`;
    const row=groups.get(k)||{category:s.category,model:s.model,quantity:0,unit:saleUnitPrice(s)};
    row.quantity+=Number(s.quantity||0); groups.set(k,row);
  });
  const rows=[...groups.values()].sort((a,b)=>String(a.category).localeCompare(String(b.category),"it")||compareModels(a.model,b.model));
  const totalQty=rows.reduce((n,r)=>n+r.quantity,0);
  const priced=rows.filter(r=>r.unit!=null);
  const net=priced.reduce((n,r)=>n+r.unit*r.quantity,0), vat=net*.22, gross=net+vat;
  const adminTotals=isAdmin()?`<div class="salesMoneySummary"><div><span>Imponibile BackGlass</span><strong>${eur(net)}</strong></div><div><span>IVA 22%</span><strong>${eur(vat)}</strong></div><div class="grand"><span>Totale IVA inclusa</span><strong>${eur(gross)}</strong></div></div>`:"";
  const top=`<section class="salesSummaryHero"><div><span class="summaryKicker">RIEPILOGO VENDUTO</span><h3>${totalQty} pezzi venduti</h3><p>Quantità raggruppate modello per modello. Gli articoli rimessi in magazzino e le righe eliminate non vengono conteggiati.</p></div>${adminTotals}</section>`;
  if(!rows.length){list.innerHTML=top+'<div class="emptyState">Nessuna vendita da riepilogare.</div>';return;}
  list.innerHTML=top+`<div class="modelSalesSummary">${rows.map(r=>{
    const grossUnit=r.unit==null?null:r.unit*1.22;
    const unit=r.unit==null?'<span class="summaryNoPrice">Prezzo non impostato</span>':`<span class="summaryUnitPrice">${eur(r.unit)} + IVA <small>(${eur(grossUnit)})</small></span>`;
    const total=isAdmin()&&r.unit!=null?`<span class="summaryModelTotal">Totale: <b>${eur(r.unit*r.quantity*1.22)}</b></span>`:"";
    return `<article class="modelSaleSummaryRow"><div class="summaryModelInfo"><strong>${escapeHtml(r.model)}</strong><span>${escapeHtml(r.category)}</span></div><div class="summaryPriceInfo">${unit}${total}</div><div class="summaryQty"><span>Venduti</span><strong>${r.quantity}</strong></div></article>`;
  }).join("")}</div>`;
}
function saleLabelHtml(s){ return `<strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)} · ${escapeHtml(s.customer)}</span>`; }


function saleNoteText(s){ return (s?.operator_note||"").trim(); }
function prepareDymoLabel(s){
  const label=document.getElementById("dymoPrintLabel");
  const title=document.getElementById("dymoPrintTitle");
  const meta=document.getElementById("dymoPrintMeta");
  const note=document.getElementById("dymoPrintNote");
  const noteText=saleNoteText(s)||"Nessuna nota";
  title.textContent=s?.model||"Vendita";
  meta.textContent=[s?.color,s?.customer].filter(Boolean).join(" · ");
  note.textContent=noteText;

  // Adattamento automatico DYMO 32x57 mm: il testo si compatta in base alla nota.
  const score=noteText.length + Math.max(0,(title.textContent.length-20)*2) + Math.max(0,(meta.textContent.length-28));
  let fit="normal";
  if(score>230) fit="micro";
  else if(score>150) fit="tiny";
  else if(score>90) fit="compact";
  label.dataset.fit=fit;
}
function printSaleNote(id){
  const s=saleById(id); if(!s)return;
  prepareDymoLabel(s);
  document.body.classList.add("printingDymo");
  const cleanup=()=>document.body.classList.remove("printingDymo");
  window.addEventListener("afterprint",cleanup,{once:true});
  setTimeout(()=>{window.print();setTimeout(cleanup,1200);},50);
}
function safeFilePart(v){return String(v||"nota").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60)||"nota";}
function exportSaleNote(id){
  const s=saleById(id); if(!s)return;
  const text=`BEPARYTECH - NOTA VENDITA\nArticolo: ${s.model}\nVariante: ${s.color}\nNegozio: ${s.customer}\nOperatore: ${s.operator_name||"—"}\nData: ${new Date(s.sold_at).toLocaleString("it-IT")}\n\nNOTA\n${saleNoteText(s)||"Nessuna nota"}\n`;
  const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`nota_${safeFilePart(s.model)}_${s.id}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function loadSaleNoteHistory(id){
  const box=document.getElementById("saleNoteHistory");box.innerHTML='<div class="emptyState">Caricamento…</div>';
  const {data,error}=await sb.from("beparytech_sale_note_history").select("id,old_note,new_note,changed_by_name,changed_at").eq("sale_id",id).order("changed_at",{ascending:false}).limit(100);
  if(error){box.innerHTML='<div class="emptyState">Impossibile caricare lo storico.</div>';return;}
  if(!data?.length){box.innerHTML='<div class="emptyState">Nessuna modifica precedente.</div>';return;}
  const fmt=new Intl.DateTimeFormat("it-IT",{dateStyle:"short",timeStyle:"short"});
  box.innerHTML=data.map(h=>`<div class="noteHistoryItem"><strong>${escapeHtml(h.changed_by_name||"Admin")} · ${escapeHtml(fmt.format(new Date(h.changed_at)))}</strong><span>${escapeHtml(h.new_note||"(nota vuota)")}</span><small>Prima: ${escapeHtml(h.old_note||"(nota vuota)")}</small></div>`).join("");
}
async function openSaleNoteEditor(id){
  if(!isAdmin())return; selectedSale=saleById(id);if(!selectedSale)return;
  document.getElementById("saleNoteEditItem").innerHTML=saleLabelHtml(selectedSale);
  document.getElementById("saleNoteEditText").value=saleNoteText(selectedSale);
  document.getElementById("saleNoteEditError").textContent="";
  document.getElementById("saleNoteModal").hidden=false;
  await loadSaleNoteHistory(id);
}
function closeSaleNoteEditor(){document.getElementById("saleNoteModal").hidden=true;selectedSale=null;}
document.getElementById("saleNoteEditX").onclick=closeSaleNoteEditor;
document.getElementById("saleNoteEditCancel").onclick=closeSaleNoteEditor;
document.getElementById("saleNoteModal").addEventListener("click",e=>{if(e.target.id==="saleNoteModal")closeSaleNoteEditor();});
document.getElementById("saleNotePrint").onclick=()=>{if(selectedSale)printSaleNote(selectedSale.id);};
document.getElementById("saleNoteExport").onclick=()=>{if(selectedSale)exportSaleNote(selectedSale.id);};
document.getElementById("saleNoteEditSave").onclick=async()=>{
  if(!selectedSale||!isAdmin())return;
  const btn=document.getElementById("saleNoteEditSave"),note=document.getElementById("saleNoteEditText").value.trim();
  btn.disabled=true;btn.textContent="Salvo…";document.getElementById("saleNoteEditError").textContent="";
  const {error}=await sb.rpc("update_beparytech_sale_note",{p_id:selectedSale.id,p_note:note});
  btn.disabled=false;btn.textContent="Salva modifica";
  if(error){document.getElementById("saleNoteEditError").textContent=error.message||"Impossibile modificare la nota.";return;}
  selectedSale.operator_note=note||null;
  await loadSaleNoteHistory(selectedSale.id);renderSales();document.getElementById("cloudStatus").textContent="☁︎ Nota salvata con storico";
};

function openEditStore(id){
  if(!isAdmin()) return;
  selectedSale=saleById(id); if(!selectedSale) return;
  document.getElementById("editStoreItem").innerHTML=saleLabelHtml(selectedSale);
  const select=document.getElementById("editStoreSelect");
  if([...select.options].some(o=>o.value===selectedSale.customer)) select.value=selectedSale.customer;
  else select.selectedIndex=0;
  document.getElementById("editStoreError").textContent="";
  document.getElementById("editStoreModal").hidden=false;
}
function closeEditStore(){document.getElementById("editStoreModal").hidden=true; selectedSale=null;}
document.getElementById("editStoreX").onclick=closeEditStore;
document.getElementById("editStoreCancel").onclick=closeEditStore;
document.getElementById("editStoreModal").addEventListener("click",e=>{if(e.target.id==="editStoreModal")closeEditStore();});
document.getElementById("editStoreSave").onclick=async()=>{
  if(!selectedSale)return;
  const btn=document.getElementById("editStoreSave"), customer=document.getElementById("editStoreSelect").value;
  btn.disabled=true; btn.textContent="Salvo…"; document.getElementById("editStoreError").textContent="";
  const {error}=await sb.rpc("update_beparytech_sale_customer",{p_id:selectedSale.id,p_customer:customer});
  btn.disabled=false; btn.textContent="Salva";
  if(error){document.getElementById("editStoreError").textContent=error.message||"Impossibile modificare il negozio.";return;}
  closeEditStore(); await loadSales();
};

function openDeleteSale(id){
  if(!isAdmin()) return;
  selectedSale=saleById(id); if(!selectedSale)return;
  document.getElementById("deleteSaleItem").innerHTML=saleLabelHtml(selectedSale);
  const reason=document.getElementById("deleteReason"); reason.value="";
  document.getElementById("deleteSaleError").textContent="";
  document.getElementById("restoreToStock").checked=false;
  document.getElementById("deleteSaleConfirm").disabled=true;
  document.getElementById("deleteSaleModal").hidden=false; reason.focus();
}
function closeDeleteSale(){document.getElementById("deleteSaleModal").hidden=true; selectedSale=null;}
document.getElementById("deleteSaleX").onclick=closeDeleteSale;
document.getElementById("deleteSaleCancel").onclick=closeDeleteSale;
document.getElementById("deleteSaleModal").addEventListener("click",e=>{if(e.target.id==="deleteSaleModal")closeDeleteSale();});
document.getElementById("deleteReason").addEventListener("input",e=>{document.getElementById("deleteSaleConfirm").disabled=!e.target.value.trim();});
document.getElementById("deleteSaleConfirm").onclick=async()=>{
  if(!selectedSale)return;
  const reason=document.getElementById("deleteReason").value.trim(); if(!reason)return;
  const btn=document.getElementById("deleteSaleConfirm"); btn.disabled=true; btn.textContent="Archivio…"; document.getElementById("deleteSaleError").textContent="";
  const restore=document.getElementById("restoreToStock").checked;
  const saleSnapshot={...selectedSale};
  const {error}=await sb.rpc("archive_beparytech_sale_v2",{p_id:selectedSale.id,p_reason:reason,p_restore_inventory:restore});
  btn.textContent="Archivia riga";
  if(error){document.getElementById("deleteSaleError").textContent=error.message||"Impossibile archiviare la vendita.";btn.disabled=false;return;}
  closeDeleteSale();
  if(restore){
    const k=saleSnapshot.item_key || (saleSnapshot.category==="BackGlass" ? saleSnapshot.model+"||"+saleSnapshot.color : "Housing||"+saleSnapshot.model+"||"+saleSnapshot.color);
    if(String(k).startsWith("CUSTOM||")||String(k).startsWith("PRODUCT||")){
      const pid=Number(String(k).split("||")[1]), product=customProducts.find(x=>Number(x.id)===pid);
      if(product) product.quantity=Number(product.quantity||0)+Number(saleSnapshot.quantity||1);
    }else{
      stock[k]=Number(stock[k]||0)+Number(saleSnapshot.quantity||1);
    }
    document.getElementById("cloudStatus").textContent="☁︎ Pezzo rimesso in magazzino";
  }
  await loadSales();
};

function openRestoreSale(id){
  selectedSale=saleById(id); if(!selectedSale)return;
  document.getElementById("restoreSaleItem").innerHTML=saleLabelHtml(selectedSale);
  document.getElementById("restoreReasonStandard").value="";
  document.getElementById("restoreOperatorPassword").value="";
  document.getElementById("restoreSaleError").textContent="";
  document.getElementById("restoreSaleConfirm").disabled=true;
  document.getElementById("restoreSaleModal").hidden=false;
}
function closeRestoreSale(){document.getElementById("restoreSaleModal").hidden=true;selectedSale=null;}
function updateRestoreState(){
  document.getElementById("restoreSaleConfirm").disabled=!(document.getElementById("restoreReasonStandard").value.trim()&&document.getElementById("restoreOperatorPassword").value.length>=4);
}
document.getElementById("restoreReasonStandard").addEventListener("input",updateRestoreState);
document.getElementById("restoreOperatorPassword").addEventListener("input",updateRestoreState);
document.getElementById("restoreSaleX").onclick=closeRestoreSale;
document.getElementById("restoreSaleCancel").onclick=closeRestoreSale;
document.getElementById("restoreSaleModal").addEventListener("click",e=>{if(e.target.id==="restoreSaleModal")closeRestoreSale();});
document.getElementById("restoreSaleConfirm").onclick=async()=>{
  if(!selectedSale)return;
  const btn=document.getElementById("restoreSaleConfirm"); btn.disabled=true;btn.textContent="Ripristino…";document.getElementById("restoreSaleError").textContent="";
  const snapshot={...selectedSale};
  const {data,error}=await sb.rpc("restore_beparytech_sale",{p_id:selectedSale.id,p_reason:document.getElementById("restoreReasonStandard").value.trim(),p_operator_password:document.getElementById("restoreOperatorPassword").value});
  btn.textContent="Rimetti +1";
  if(error){document.getElementById("restoreSaleError").textContent=error.message||"Impossibile rimettere il pezzo in magazzino.";updateRestoreState();return;}
  const k=snapshot.item_key;
  if(String(k).startsWith("CUSTOM||")||String(k).startsWith("PRODUCT||")){
    const pid=Number(String(k).split("||")[1]), product=customProducts.find(x=>Number(x.id)===pid); if(product)product.quantity=Number(data);
  }else stock[k]=Number(data);
  closeRestoreSale();await loadSales();document.getElementById("cloudStatus").textContent="☁︎ Pezzo rimesso in magazzino";
};

function openOperatorPassword(userId,username){
  selectedUserForOperatorPassword={userId,username};
  document.getElementById("operatorPasswordUser").innerHTML=`<strong>${escapeHtml(username)}</strong><span>Imposta o sostituisci la password usata per confermare le operazioni.</span>`;
  document.getElementById("operatorPasswordValue").value="";
  document.getElementById("operatorPasswordError").textContent="";
  document.getElementById("operatorPasswordModal").hidden=false;
}
function closeOperatorPassword(){document.getElementById("operatorPasswordModal").hidden=true;selectedUserForOperatorPassword=null;}
document.getElementById("operatorPasswordX").onclick=closeOperatorPassword;
document.getElementById("operatorPasswordCancel").onclick=closeOperatorPassword;
document.getElementById("operatorPasswordSave").onclick=async()=>{
  if(!selectedUserForOperatorPassword)return;
  const pass=document.getElementById("operatorPasswordValue").value;
  if(!isStrongLoginPassword(pass)){document.getElementById("operatorPasswordError").textContent="Usa almeno 12 caratteri con maiuscola, minuscola, numero e simbolo.";return;}
  if(pass.length>128){document.getElementById("operatorPasswordError").textContent="Password troppo lunga.";return;}
  const btn=document.getElementById("operatorPasswordSave");btn.disabled=true;btn.textContent="Salvo…";
  const {data,error}=await sb.functions.invoke("beparytech-users",{method:"POST",body:{action:"set_operator_password",user_id:selectedUserForOperatorPassword.userId,operator_password:pass}});
  btn.disabled=false;btn.textContent="Salva password";
  if(error||data?.error){document.getElementById("operatorPasswordError").textContent=data?.error||error?.message||"Errore salvataggio.";return;}
  closeOperatorPassword();await loadUsers();
};

document.getElementById("activeSalesTab").onclick=()=>{salesMode="active";renderSales();};
document.getElementById("archiveSalesTab").onclick=()=>{salesMode="archive";renderSales();};
document.getElementById("soldSummaryTab")?.addEventListener("click",()=>{salesMode="summary";renderSales();});

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function safeExternalUrl(v){try{const u=new URL(String(v||""),window.location.origin);return ["http:","https:"].includes(u.protocol)?u.href:"#";}catch(_){return "#";}}

document.getElementById("backglassTab").onclick=()=>setCategory("BackGlass");
document.getElementById("housingTab").onclick=()=>setCategory("Housing");
document.getElementById("salesTab").onclick=()=>setCategory("Vendite");
document.getElementById("usersTab").onclick=()=>setCategory("Utenti");
document.getElementById("refreshSalesBtn").onclick=loadSales;

search.oninput=()=>String(currentCategory).startsWith("custom:")?renderCustomSection():render();
filter.onchange=()=>String(currentCategory).startsWith("custom:")?renderCustomSection():render();
sb.auth.getUser().then(({data})=>showAuth(data.user));


// ===== Menu, sezioni personalizzate e catalogo Admin =====
const mainMenu=document.getElementById("mainMenu");
const menuOverlay=document.getElementById("menuOverlay");
function openMainMenu(){ if(!currentUser)return; mainMenu.classList.add("open"); mainMenu.setAttribute("aria-hidden","false"); menuOverlay.hidden=false; document.body.classList.add("menu-open"); }
function closeMainMenu(){ mainMenu.classList.remove("open"); mainMenu.setAttribute("aria-hidden","true"); menuOverlay.hidden=true; document.body.classList.remove("menu-open"); }
document.getElementById("menuToggle").onclick=openMainMenu;
document.getElementById("menuClose").onclick=closeMainMenu;
menuOverlay.onclick=closeMainMenu;
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMainMenu();});
document.querySelectorAll(".menuItem[data-category]").forEach(btn=>btn.addEventListener("click",()=>setCategory(btn.dataset.category)));

async function loadCustomCatalog(){
  if(!currentUser)return;
  let sectionQuery=sb.from("beparytech_sections").select("id,name,description,position,active,section_type,created_at").order("position").order("created_at");
  if(!isAdmin()) sectionQuery=sectionQuery.eq("active",true);
  const [{data:sections,error:sErr},{data:products,error:pErr}]=await Promise.all([
    sectionQuery,
    sb.from("beparytech_products").select("id,section_id,name,variant,quantity,low_stock_threshold,active,sku,barcode,sort_order,created_at,updated_at").eq("active",true).order("sort_order").order("created_at")
  ]);
  if(sErr||pErr){console.error(sErr||pErr);return;}
  customSections=sections||[]; customProducts=products||[];
  renderCustomMenu();
  renderCatalogAdmin();
}
function renderCustomMenu(){
  const box=document.getElementById("customMenuSections"); if(!box)return;
  box.innerHTML=customSections.filter(s=>s.active!==false).map(s=>{const req=s.section_type==="requests";const icon=req?"🛒":(s.name==="BackGlass"?"◫":s.name==="Housing"?"▣":"▤");return `<button class="menuItem customMenuItem" type="button" data-category="custom:${s.id}"><span class="menuIcon">${icon}</span><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.description||"Sezione magazzino")}</small></span></button>`}).join("");
  box.querySelectorAll(".menuItem").forEach(btn=>btn.addEventListener("click",()=>setCategory(btn.dataset.category)));
}
function customStatus(q,threshold){if(q===0)return["ESAURITO","empty"];if(q<=threshold)return["SCORTA BASSA","low"];return["DISPONIBILE","ok"]}
function renderCustomSection(){
  if(!currentUser||!currentCustomSectionId)return;
  const section=customSections.find(s=>Number(s.id)===currentCustomSectionId);
  if(section?.section_type==="requests"){ renderOrderRequests(section); return; }
  const query=search.value.trim().toLowerCase();
  const items=customProducts.filter(p=>Number(p.section_id)===currentCustomSectionId).filter(p=>`${p.name} ${p.variant||""} ${p.sku||""} ${p.barcode||""}`.toLowerCase().includes(query)).filter(p=>passesFilter(Number(p.quantity||0))).sort((a,b)=>compareModels(a,b)||String(a.variant||"").localeCompare(String(b.variant||""),"it",{numeric:true,sensitivity:"base"}));
  inventory.innerHTML="";
  if(!items.length){inventory.innerHTML='<div class="emptyState">Nessun prodotto in questa sezione.</div>';updateCustomStats([]);return;}
  const groups=new Map();
  items.forEach(p=>{const key=String(p.name||"Senza modello");if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)});
  const accordion=document.createElement("div");accordion.className="customModelAccordion";
  [...groups.entries()].sort((a,b)=>compareModels(a[0],b[0])).forEach(([model,products])=>{
    const total=products.reduce((sum,p)=>sum+Number(p.quantity||0),0);
    const group=document.createElement("section");group.className="customModelGroup closed";group.dataset.model=model;
    group.innerHTML=`<button class="customModelHeader" type="button" aria-expanded="false"><div class="customModelHeaderMain"><img class="customModelThumb" src="${escapeHtml(imageForModel(model))}" alt="${escapeHtml(model)}"><div><strong>${escapeHtml(model)}</strong><small>${products.length} varianti · ${total} pezzi</small></div></div><span class="chevron">⌄</span></button><div class="customModelBody"><div class="customProductGrid"></div></div>`;
    const bodyGrid=group.querySelector(".customProductGrid");
    products.sort((a,b)=>String(a.variant||"").localeCompare(String(b.variant||""),"it",{numeric:true,sensitivity:"base"})).forEach(p=>{
      const q=Number(p.quantity||0),[status,cls]=customStatus(q,Number(p.low_stock_threshold||2));
      const card=document.createElement("article");card.className="customProductCard";card.dataset.productId=String(p.id);
      const customUnitPrice=String(section?.name||"").trim().toLowerCase()==="backglass" ? backGlassUnitPrice(p.name) : null;
      const customPriceHtml=(customUnitPrice==null?"":`<div class="inventoryPriceTag"><span>Prezzo vendita</span><strong>${eur(customUnitPrice)} + IVA</strong><small>${eur(customUnitPrice*1.22)} IVA incl.</small></div>`)+costBadgeHtml(customCostKey(p.id));
      card.innerHTML=`<div class="customProductTop"><div class="productVisual"><img class="productModelImage" src="${escapeHtml(imageForModel(p.name))}" alt="${escapeHtml(p.name)}"><span>${escapeHtml(p.name).charAt(0).toUpperCase()}</span></div><div class="customProductInfo"><strong>${escapeHtml(p.variant||p.name)}</strong><span>${escapeHtml(p.variant? p.name : (section?.name||""))}</span>${p.sku||p.barcode?`<small>${escapeHtml(p.sku||p.barcode)}</small>`:""}<b class="status ${cls}">${status}</b></div></div>${customPriceHtml}<div class="customProductBottom"><div class="customQty"><small>Giacenza</small><strong>${q}</strong></div><div class="customActions"><button class="minus customMinus animatedBtn" type="button" title="Scarica 1 dalla giacenza" ${q<=0?"disabled":""}>−1 Scarica</button>${isAdmin()?'<button class="plus customPlus animatedBtn" type="button">+1</button><button class="edit customEdit animatedBtn" type="button" title="Modifica prodotto">✎</button>':""}</div></div>`;
      const modelImg=card.querySelector(".productModelImage");modelImg.onerror=()=>{modelImg.hidden=true;modelImg.nextElementSibling.hidden=false};modelImg.onload=()=>{modelImg.nextElementSibling.hidden=true};
      card.querySelector(".customMinus").onclick=()=>openCustomSaleModal(p,section);
      const plus=card.querySelector(".customPlus"); if(plus)plus.onclick=()=>updateCustomProductQty(p,q+1);
      const edit=card.querySelector(".customEdit");if(edit)edit.onclick=()=>editCustomProduct(p);const costNode=card.querySelector(".adminCostBadge");if(costNode)wireCostBadge(costNode,customCostKey(p.id),`${p.name} · ${p.variant||""}`);
      bodyGrid.appendChild(card);
    });
    const header=group.querySelector(".customModelHeader");
    header.onclick=()=>{
      const willOpen=group.classList.contains("closed");
      accordion.querySelectorAll(".customModelGroup:not(.closed)").forEach(other=>{if(other!==group){other.classList.add("closed");other.querySelector(".customModelHeader")?.setAttribute("aria-expanded","false")}});
      group.classList.toggle("closed",!willOpen);
      header.setAttribute("aria-expanded",willOpen?"true":"false");
    };
    accordion.appendChild(group);
  });
  inventory.appendChild(accordion);updateCustomStats(items);
}
async function renderOrderRequests(section){
  const operatorFields=accountOperators.length?`<div class="catalogTwoCols operatorRequestFields"><label><span>Operatore *</span><select id="requestOperatorName" required><option value="">Seleziona operatore…</option>${accountOperators.map(o=>`<option value="${escapeHtml(o.name)}">${escapeHtml(o.name)}</option>`).join("")}</select></label><label><span>Codice operatore *</span><input id="requestOperatorCode" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="Codice personale" required></label></div>`:"";
  inventory.innerHTML=`<div class="orderRequestWrap"><form id="orderRequestForm" class="orderRequestCard"><div class="catalogCardTitle"><span class="catalogIcon">🛒</span><div><strong>Nuova richiesta</strong><small>Qualsiasi materiale, ricambio o accessorio</small></div></div>${operatorFields}<label><span>Cosa serve *</span><input id="requestItem" type="text" maxlength="160" placeholder="es. Display iPhone 15 Pro nero" required></label><div class="catalogTwoCols"><label><span>Quantità *</span><input id="requestQty" type="number" min="1" value="1" required></label><label><span>Codice articolo</span><input id="requestCode" type="text" maxlength="100" placeholder="SKU / codice ricambio"></label></div><label><span>Link prodotto</span><input id="requestLink" type="url" maxlength="500" placeholder="https://..."></label><label><span>Nota</span><input id="requestNote" type="text" maxlength="240" placeholder="Facoltativa"></label><button class="primaryAction animatedBtn" type="submit">Invia richiesta</button><div id="requestMsg" class="createUserMsg"></div></form><div class="orderRequestCard"><div class="catalogListHead"><div><strong>Da ordinare</strong><small>Richieste di tutti gli utenti</small></div><button id="refreshRequestsBtn" class="miniBtn animatedBtn" type="button">Aggiorna</button></div><div id="requestsList"><div class="emptyState">Caricamento richieste…</div></div></div></div>`;
  document.getElementById("orderRequestForm").addEventListener("submit",submitOrderRequest);document.getElementById("refreshRequestsBtn").onclick=loadOrderRequests;await loadOrderRequests();
}
async function submitOrderRequest(e){
  e.preventDefault();
  const msg=document.getElementById("requestMsg"),item=document.getElementById("requestItem").value.trim(),quantity=Math.max(1,Number(document.getElementById("requestQty").value)||1),note=document.getElementById("requestNote").value.trim(),code=document.getElementById("requestCode").value.trim(),link=document.getElementById("requestLink").value.trim();
  const operatorName=document.getElementById("requestOperatorName")?.value||null;
  const operatorCode=document.getElementById("requestOperatorCode")?.value||null;
  if(accountOperators.length&&(!operatorName||!operatorCode)){msg.textContent="Seleziona operatore e inserisci il suo codice.";msg.className="createUserMsg error";return;}
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.rpc("create_beparytech_request",{p_item:item,p_quantity:quantity,p_note:note||null,p_code:code||null,p_link:link||null,p_operator_name:operatorName,p_operator_code:operatorCode});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();document.getElementById("requestQty").value=1;msg.textContent="Richiesta inviata.";msg.className="createUserMsg ok";await loadOrderRequests();
}
async function loadOrderRequests(){
  const list=document.getElementById("requestsList"); if(!list)return;
  const {data,error}=await sb.from("beparytech_requests").select("id,requester_name,item,quantity,note,code,link,status,created_at,updated_at").order("created_at",{ascending:false});
  if(error){list.innerHTML='<div class="emptyState">Impossibile caricare le richieste.</div>';return;}
  const rows=data||[]; window.btRequests=rows;
  if(!rows.length){list.innerHTML='<div class="emptyState">Nessuna richiesta.</div>';return;}
  const labels={richiesto:"Richiesto",approvato:"Approvato",ordinato:"Ordinato",arrivato:"Arrivato",consegnato:"Consegnato"};
  list.innerHTML=rows.map(r=>`<div class="requestRow"><div class="requestMain"><strong>${escapeHtml(r.item)}</strong><span>${escapeHtml(r.requester_name)} · Qtà ${Number(r.quantity||1)} · ${new Date(r.created_at).toLocaleString("it-IT")}</span>${r.code?`<small>Codice: ${escapeHtml(r.code)}</small>`:""}${r.note?`<small>${escapeHtml(r.note)}</small>`:""}${r.link?`<a href="${escapeHtml(safeExternalUrl(r.link))}" target="_blank" rel="noopener noreferrer">Apri link prodotto ↗</a>`:""}</div><div class="requestSide"><b class="requestStatus ${r.status}">${labels[r.status]||r.status}</b>${isAdmin()?`<select class="requestStatusSelect" data-id="${r.id}">${Object.entries(labels).map(([v,l])=>`<option value="${v}" ${r.status===v?"selected":""}>${l}</option>`).join("")}</select>`:""}</div></div>`).join("");
  list.querySelectorAll(".requestStatusSelect").forEach(sel=>sel.addEventListener("change",async()=>{const complete=sel.value==="consegnato";const {error}=await sb.from("beparytech_requests").update({status:sel.value,updated_by:currentUser.id,updated_at:new Date().toISOString(),completed_at:complete?new Date().toISOString():null}).eq("id",Number(sel.dataset.id));if(error)alert(error.message);else{loadOrderRequests();loadDashboard();}}));
  document.getElementById("totalPieces").textContent=rows.filter(r=>!['consegnato'].includes(r.status)).reduce((a,r)=>a+Number(r.quantity||1),0);document.getElementById("availableTypes").textContent=rows.filter(r=>!['consegnato'].includes(r.status)).length;document.getElementById("lowStock").textContent=rows.filter(r=>r.status==="richiesto").length;
}
function updateCustomStats(items){
  const vals=items.length?items:customProducts.filter(p=>Number(p.section_id)===currentCustomSectionId);
  document.getElementById("totalPieces").textContent=vals.reduce((s,p)=>s+Number(p.quantity||0),0);
  document.getElementById("availableTypes").textContent=vals.filter(p=>Number(p.quantity)>0).length;
  document.getElementById("lowStock").textContent=vals.filter(p=>Number(p.quantity)>0&&Number(p.quantity)<=Number(p.low_stock_threshold||2)).length;
}
async function openCustomSaleModal(product,section){
  if(Number(product.quantity)<=0)return;
  pendingSale={kind:"custom",productId:product.id,model:product.name,color:product.variant||"—",category:section?.name||"Prodotti",itemKey:`PRODUCT||${product.id}`};
  selectedCustomer=null;
  await loadAccountOperators();
  populateSaleOperatorControl();
  document.getElementById("saleOperatorPassword").value="";document.getElementById("saleNote").value="";
  document.getElementById("saleEShareRef").value="";
  document.getElementById("saleItemLabel").innerHTML=`<strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.variant||section?.name||"")}</span>`;
  document.getElementById("saleCustomerSelect").value="";document.getElementById("confirmSaleBtn").disabled=true;document.getElementById("saleError").textContent="";document.getElementById("saleModal").hidden=false;
}
async function editCustomProduct(product){
  if(!isAdmin())return;
  const name=prompt("Nome prodotto",product.name);if(!name||!name.trim())return;
  const variant=prompt("Variante / colore",product.variant||"");if(variant===null)return;
  const sku=prompt("SKU / codice interno",product.sku||"");if(sku===null)return;
  const barcode=prompt("Barcode / QR code",product.barcode||"");if(barcode===null)return;
  const low=prompt("Soglia scorta bassa",String(product.low_stock_threshold??2));if(low===null)return;
  const {error}=await sb.from("beparytech_products").update({name:name.trim(),variant:variant.trim(),sku:sku.trim()||null,barcode:barcode.trim()||null,low_stock_threshold:Math.max(0,Number(low)||0),updated_at:new Date().toISOString()}).eq("id",product.id);
  if(error){alert(error.message);return;}
  await loadCustomCatalog();renderCustomSection();
}

async function updateCustomProductQty(product,value){
  if(!isAdmin())return;
  const next=Math.max(0,Number(value)||0);
  document.getElementById("cloudStatus").textContent="☁︎ Salvataggio…";
  const {data,error}=await sb.rpc("adjust_beparytech_product_quantity",{p_product_id:product.id,p_new_quantity:next,p_reason:"Modifica manuale Admin"});
  if(error){document.getElementById("cloudStatus").textContent="Errore cloud";alert(error.message);return;}
  product.quantity=Number(data);renderCustomSection();document.getElementById("cloudStatus").textContent="☁︎ Salvato";
}
function fillProductSectionSelect(){
  const sel=document.getElementById("productSection");if(!sel)return;
  const previous=sel.value;sel.innerHTML='<option value="">Seleziona sezione…</option>'+customSections.filter(s=>s.active!==false&&s.section_type!=="requests").map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
  if([...sel.options].some(o=>o.value===previous))sel.value=previous;
}
function renderCatalogAdmin(){
  if(!isAdmin())return;
  fillProductSectionSelect();
  const list=document.getElementById("catalogAdminList");if(!list)return;
  if(!customSections.length){list.innerHTML='<div class="emptyState">Crea la prima sezione per iniziare.</div>';return;}
  list.innerHTML=customSections.map(s=>{
    const products=customProducts.filter(p=>Number(p.section_id)===Number(s.id));
    const pieces=products.reduce((a,p)=>a+Number(p.quantity||0),0);
    return `<div class="catalogSectionRow ${s.active===false?'sectionInactive':''}" data-section-id="${s.id}"><div class="catalogSectionInfo"><strong>${escapeHtml(s.name)} ${s.active===false?'<em>DISATTIVATA</em>':''}</strong><span>${escapeHtml(s.description||"Nessuna descrizione")}</span></div><div class="catalogSectionStats"><b>${products.length}</b><small>prodotti</small><b>${pieces}</b><small>pezzi</small></div><div class="catalogSectionActions"><button class="miniBtn renameSection" type="button">Rinomina</button><button class="miniBtn moveSection" data-dir="-1" type="button" title="Sposta su">↑</button><button class="miniBtn moveSection" data-dir="1" type="button" title="Sposta giù">↓</button><button class="miniBtn toggleSection" type="button">${s.active===false?'Riattiva':'Disattiva'}</button></div></div>`;
  }).join("");
  list.querySelectorAll(".renameSection").forEach(btn=>btn.onclick=async()=>{const id=Number(btn.closest("[data-section-id]").dataset.sectionId),sec=customSections.find(x=>Number(x.id)===id);if(!sec)return;const name=prompt("Nuovo nome sezione",sec.name);if(!name||!name.trim()||name.trim()===sec.name)return;const description=prompt("Descrizione sezione",sec.description||"");const {error}=await sb.from("beparytech_sections").update({name:name.trim(),description:(description??sec.description??"").trim()}).eq("id",id);if(error)alert(error.message);else await loadCustomCatalog();});
  list.querySelectorAll(".toggleSection").forEach(btn=>btn.onclick=async()=>{const id=Number(btn.closest("[data-section-id]").dataset.sectionId),sec=customSections.find(x=>Number(x.id)===id);if(!sec)return;if(sec.active!==false&&!confirm(`Disattivare la sezione “${sec.name}”? I dati non saranno eliminati.`))return;const {error}=await sb.from("beparytech_sections").update({active:sec.active===false}).eq("id",id);if(error)alert(error.message);else await loadCustomCatalog();});
  list.querySelectorAll(".moveSection").forEach(btn=>btn.onclick=async()=>{const id=Number(btn.closest("[data-section-id]").dataset.sectionId),sec=customSections.find(x=>Number(x.id)===id);if(!sec)return;const dir=Number(btn.dataset.dir),ordered=[...customSections].sort((a,b)=>Number(a.position||0)-Number(b.position||0)||Number(a.id)-Number(b.id)),idx=ordered.findIndex(x=>Number(x.id)===id),other=ordered[idx+dir];if(!other)return;const a=Number(sec.position||0),b=Number(other.position||0);const {error:e1}=await sb.from("beparytech_sections").update({position:b}).eq("id",sec.id);if(e1){alert(e1.message);return;}const {error:e2}=await sb.from("beparytech_sections").update({position:a}).eq("id",other.id);if(e2){alert(e2.message);return;}await loadCustomCatalog();});
}
document.getElementById("createSectionForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin())return;
  const msg=document.getElementById("sectionFormMsg"),name=document.getElementById("sectionName").value.trim(),description=document.getElementById("sectionDescription").value.trim();
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.from("beparytech_sections").insert({workspace_owner_id:workspaceOwnerId,name,description,section_type:"inventory",created_by:currentUser.id});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();msg.textContent="Sezione creata.";msg.className="createUserMsg ok";await loadCustomCatalog();
});
document.getElementById("createProductForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin())return;
  const msg=document.getElementById("productFormMsg"),sectionId=Number(document.getElementById("productSection").value),name=document.getElementById("productName").value.trim(),variant=document.getElementById("productVariant").value.trim(),sku=document.getElementById("productSku").value.trim(),barcode=document.getElementById("productBarcode").value.trim(),quantity=Math.max(0,Number(document.getElementById("productQuantity").value)||0),low=Math.max(0,Number(document.getElementById("productLowStock").value)||2);
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.from("beparytech_products").insert({workspace_owner_id:workspaceOwnerId,section_id:sectionId,name,variant,sku:sku||null,barcode:barcode||null,quantity,low_stock_threshold:low,created_by:currentUser.id});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();document.getElementById("productQuantity").value=0;document.getElementById("productLowStock").value=2;msg.textContent="Prodotto aggiunto.";msg.className="createUserMsg ok";await loadCustomCatalog();
});
document.getElementById("refreshCatalogBtn").onclick=loadCustomCatalog;
// Ricerca/filtro anche nelle sezioni personalizzate
search.addEventListener("input",()=>{if(String(currentCategory).startsWith("custom:"))renderCustomSection();});
filter.addEventListener("change",()=>{if(String(currentCategory).startsWith("custom:"))renderCustomSection();});


// ===== v17 Dashboard, audit, ricerca globale, scanner e backup =====
let auditEvents=[];
async function loadAudit(){
  const list=document.getElementById("auditList"); if(!list)return; list.innerHTML='<div class="emptyState">Caricamento cronologia…</div>';
  const {data,error}=await sb.from("beparytech_audit_events").select("id,actor_name,event_type,entity_type,title,details,created_at").order("created_at",{ascending:false}).limit(1000);
  if(error){list.innerHTML='<div class="emptyState">Impossibile caricare la cronologia.</div>';return;} auditEvents=data||[];
  const labels={inventory_out:"Uscita −1",inventory_set:"Giacenza modificata",inventory_restore:"Rientro +1",request_created:"Richiesta creata",request_updated:"Richiesta aggiornata",section_created:"Sezione creata",section_updated:"Sezione modificata",product_created:"Prodotto creato",product_updated:"Prodotto modificato",sale_legacy:"Vendita storica",sale_archived:"Vendita archiviata"};
  list.innerHTML=auditEvents.length?auditEvents.map(e=>`<article class="auditRow"><div class="auditIcon">${e.event_type.includes("request")?"🛒":e.event_type.includes("section")?"▤":e.event_type.includes("product")?"◫":e.event_type==="inventory_out"?"−":e.event_type==="inventory_restore"?"↩":"±"}</div><div class="auditMain"><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(labels[e.event_type]||e.event_type)} · ${escapeHtml(e.actor_name||"Sistema")}</span><small>${new Date(e.created_at).toLocaleString("it-IT")}</small></div><div class="auditDetails">${auditDetailsText(e.details)}</div></article>`).join(""):'<div class="emptyState">Nessuna attività registrata.</div>';
}
function auditDetailsText(d){if(!d)return"";const parts=[];if(d.before!==undefined&&d.after!==undefined)parts.push(`${d.before} → ${d.after}`);if(d.customer)parts.push(d.customer);if(d.status)parts.push(d.status);if(d.quantity)parts.push(`Qtà ${d.quantity}`);if(d.reason)parts.push(d.reason);return escapeHtml(parts.join(" · "));}
async function loadDashboard(){
  if(!currentUser)return;
  const startToday=new Date();startToday.setHours(0,0,0,0);
  const [reqRes,auditRes,todayRes]=await Promise.all([
    sb.from("beparytech_requests").select("id,item,quantity,status,requester_name,created_at").order("created_at",{ascending:false}).limit(500),
    sb.from("beparytech_audit_events").select("id,actor_name,event_type,title,details,created_at").order("created_at",{ascending:false}).limit(8),
    sb.from("beparytech_audit_events").select("id",{count:"exact",head:true}).gte("created_at",startToday.toISOString())
  ]);
  const req=reqRes.data||[], audit=auditRes.data||[]; window.btRequests=req;
  const activeSectionIds=new Set(customSections.filter(s=>s.active!==false&&s.section_type==="inventory").map(s=>Number(s.id)));
  const inv=customProducts.filter(p=>p.active!==false&&activeSectionIds.has(Number(p.section_id))), total=inv.reduce((a,p)=>a+Number(p.quantity||0),0), low=inv.filter(p=>Number(p.quantity)>0&&Number(p.quantity)<=Number(p.low_stock_threshold||2)), empty=inv.filter(p=>Number(p.quantity)===0), openReq=req.filter(r=>r.status!=="consegnato"),todayCount=Number(todayRes.count||0);
  document.getElementById("totalPieces").textContent=total;document.getElementById("availableTypes").textContent=inv.filter(p=>Number(p.quantity)>0).length;document.getElementById("lowStock").textContent=low.length;
  document.getElementById("dashboardCards").innerHTML=`<button class="dashCard" data-go="stock"><span>Pezzi totali</span><strong>${total}</strong><small>${inv.length} articoli</small></button><button class="dashCard warning" data-go="low"><span>Da controllare</span><strong>${low.length+empty.length}</strong><small>${empty.length} esauriti · ${low.length} bassi</small></button><button class="dashCard" data-go="requests"><span>Da ordinare</span><strong>${openReq.length}</strong><small>richieste aperte</small></button><button class="dashCard" data-go="audit"><span>Operazioni oggi</span><strong>${todayCount}</strong><small>attività registrate</small></button>`;
  document.getElementById("dashboardLowStock").innerHTML=[...empty,...low].slice(0,12).map(p=>{const s=customSections.find(x=>Number(x.id)===Number(p.section_id));return `<button class="dashboardLine" data-section="${p.section_id}"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(s?.name||"")} · ${escapeHtml(p.variant||"")}</small></span><b>${p.quantity}</b></button>`}).join("")||'<div class="emptyState">Nessuna scorta critica.</div>';
  document.getElementById("dashboardActivity").innerHTML=audit.map(e=>`<div class="dashboardLine"><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.actor_name||"Sistema")} · ${new Date(e.created_at).toLocaleString("it-IT")}</small></span></div>`).join("")||'<div class="emptyState">Nessuna attività.</div>';
  document.querySelectorAll(".dashboardLine[data-section]").forEach(b=>b.onclick=()=>setCategory(`custom:${b.dataset.section}`));
  document.querySelectorAll(".dashCard").forEach(b=>b.onclick=()=>{if(b.dataset.go==="requests"){const sec=customSections.find(s=>s.active!==false&&s.section_type==="requests");if(sec)setCategory(`custom:${sec.id}`)}else if(b.dataset.go==="audit")setCategory("Cronologia");else if(b.dataset.go==="low"||b.dataset.go==="stock"){const sec=customSections.find(s=>s.active!==false&&s.section_type==="inventory");if(sec)setCategory(`custom:${sec.id}`)}});
}
document.getElementById("refreshDashboardBtn").onclick=loadDashboard;document.getElementById("refreshAuditBtn").onclick=loadAudit;
document.querySelectorAll(".dashboardToggle").forEach(btn=>btn.addEventListener("click",()=>{const panel=btn.closest(".dashboardPanel");const open=panel.classList.toggle("open");btn.setAttribute("aria-expanded",open?"true":"false");}));

const gSearch=document.getElementById("globalSearch"),gResults=document.getElementById("globalSearchResults");
function openGlobalProduct(sectionId,productId){
  gResults.hidden=true;
  setCategory(`custom:${sectionId}`);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const card=document.querySelector(`.customProductCard[data-product-id="${productId}"]`);
    if(card){const group=card.closest(".customModelGroup");if(group){group.classList.remove("closed");group.querySelector(".customModelHeader")?.setAttribute("aria-expanded","true");}card.scrollIntoView({behavior:"smooth",block:"center"});card.classList.add("searchFocus");setTimeout(()=>card.classList.remove("searchFocus"),2200);}
  }));
}
function runGlobalSearch(code){const q=String(code??gSearch.value).trim().toLowerCase();if(code!==undefined)gSearch.value=code;if(!q){gResults.hidden=true;gResults.innerHTML="";return;}const activeIds=new Set(customSections.filter(s=>s.active!==false).map(s=>Number(s.id)));const hits=customProducts.filter(p=>activeIds.has(Number(p.section_id))&&`${p.name} ${p.variant||""} ${p.sku||""} ${p.barcode||""}`.toLowerCase().includes(q)).sort((a,b)=>compareModels(a,b)||String(a.variant||"").localeCompare(String(b.variant||""),"it",{numeric:true,sensitivity:"base"})).slice(0,18);const req=(window.btRequests||[]).filter(r=>`${r.item} ${r.requester_name||""}`.toLowerCase().includes(q)).slice(0,8);gResults.innerHTML=`${hits.map(p=>{const sec=customSections.find(s=>Number(s.id)===Number(p.section_id));return `<button class="globalResult" data-section="${p.section_id}" data-product="${p.id}"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(sec?.name||"")} · ${escapeHtml(p.variant||"")}${p.sku?` · ${escapeHtml(p.sku)}`:""}</small></span><b>${p.quantity}</b></button>`}).join("")}${req.map(r=>`<button class="globalResult requestGlobal" data-request="1"><span><strong>${escapeHtml(r.item)}</strong><small>Da ordinare · ${escapeHtml(r.requester_name||"")}</small></span></button>`).join("")}`||'<div class="emptyState">Nessun risultato.</div>';gResults.hidden=false;gResults.querySelectorAll("[data-section][data-product]").forEach(b=>b.onclick=()=>openGlobalProduct(b.dataset.section,b.dataset.product));gResults.querySelectorAll("[data-request]").forEach(b=>b.onclick=()=>{const sec=customSections.find(s=>s.section_type==="requests");gResults.hidden=true;if(sec)setCategory(`custom:${sec.id}`)});}
gSearch.addEventListener("input",()=>runGlobalSearch());document.addEventListener("click",e=>{if(!e.target.closest("#globalSearchBar"))gResults.hidden=true;});

let scannerStream=null,scannerTimer=null,zxingReader=null,scannerStarting=false;
async function finishScannerResult(code){
  const value=String(code||"").trim(); if(!value)return; closeScanner(); runGlobalSearch(value);
}
async function openScanner(){
  if(scannerStarting)return; scannerStarting=true;
  const modal=document.getElementById("scannerModal"),msg=document.getElementById("scannerMsg"),video=document.getElementById("scannerVideo");
  modal.hidden=false; msg.textContent="Richiesta accesso alla fotocamera…";
  try{
    if(!navigator.mediaDevices?.getUserMedia) throw new Error("Fotocamera non supportata");
    scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    video.srcObject=scannerStream; await video.play(); msg.textContent="Inquadra un QR o un codice a barre.";
    if("BarcodeDetector" in window){
      const detector=new BarcodeDetector({formats:["qr_code","code_128","code_39","code_93","codabar","ean_13","ean_8","itf","upc_a","upc_e"]});
      const tick=async()=>{if(modal.hidden)return;try{const codes=await detector.detect(video);if(codes?.[0]?.rawValue){finishScannerResult(codes[0].rawValue);return;}}catch(_){ }scannerTimer=setTimeout(tick,180)}; tick();
    }else if(window.ZXing?.BrowserMultiFormatReader){
      scannerStream.getTracks().forEach(t=>t.stop()); scannerStream=null; video.srcObject=null;
      zxingReader=new ZXing.BrowserMultiFormatReader();
      await zxingReader.decodeFromConstraints({video:{facingMode:{ideal:"environment"}}},video,(result,err)=>{if(result?.getText){finishScannerResult(result.getText());}});
    }else{
      msg.textContent="Fotocamera aperta. La lettura automatica non è disponibile: usa il campo manuale.";
    }
  }catch(e){
    console.warn("Scanner camera:",e); msg.textContent="Non riesco ad aprire la fotocamera. Controlla il permesso Fotocamera per Safari e riprova.";
  }finally{scannerStarting=false;}
}
function closeScanner(){
  const modal=document.getElementById("scannerModal"); if(modal)modal.hidden=true;
  if(scannerTimer){clearTimeout(scannerTimer);scannerTimer=null;}
  if(zxingReader){try{zxingReader.reset();}catch(_){ }zxingReader=null;}
  if(scannerStream){scannerStream.getTracks().forEach(t=>t.stop());scannerStream=null;}
  const video=document.getElementById("scannerVideo"); if(video)video.srcObject=null; scannerStarting=false;
}
document.getElementById("scanBarcodeBtn").onclick=openScanner;document.getElementById("scannerClose").onclick=closeScanner;document.getElementById("scannerManualSearch").onclick=()=>{const v=document.getElementById("scannerManualCode").value.trim();if(v)finishScannerResult(v)};

function downloadText(filename,text,type="text/plain;charset=utf-8"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvEscape(v){const x=String(v??"");return /[",\n]/.test(x)?`"${x.replaceAll('"','""')}"`:x}
async function openAccountOperators(userId,username){
  if(!isAdmin()) return;
  selectedUserForAccountOperators={userId,username};
  document.getElementById("accountOperatorsTitle").textContent=`Operatori · ${username}`;
  document.getElementById("accountOperatorName").value="";
  document.getElementById("accountOperatorCode").value="";
  document.getElementById("accountOperatorsMsg").textContent="";
  document.getElementById("accountOperatorsModal").hidden=false;
  await loadAdminAccountOperators();
}
function closeAccountOperators(){document.getElementById("accountOperatorsModal").hidden=true;selectedUserForAccountOperators=null;}
async function loadAdminAccountOperators(){
  const list=document.getElementById("accountOperatorsList");
  if(!selectedUserForAccountOperators||!list)return;
  list.innerHTML='<div class="emptyState">Caricamento operatori…</div>';
  const {data,error}=await sb.rpc("admin_list_beparytech_account_operators",{p_account_user_id:selectedUserForAccountOperators.userId});
  if(error){list.innerHTML=`<div class="emptyState">${escapeHtml(error.message)}</div>`;return;}
  const rows=data||[];
  list.innerHTML=rows.length?rows.map(o=>`<div class="accountOperatorRow"><div><strong>${escapeHtml(o.name)}</strong><small>${o.code_set?"Codice impostato":"Codice da impostare"} · ${o.active?"Attivo":"Disattivato"}</small></div><div class="accountOperatorActions"><button class="rowAction resetAccountOperator" data-name="${escapeHtml(o.name)}" type="button">Imposta codice</button><button class="rowAction toggleAccountOperator" data-id="${o.id}" data-active="${o.active?"1":"0"}" type="button">${o.active?"Disattiva":"Attiva"}</button></div></div>`).join(""):'<div class="emptyState">Nessun operatore configurato.</div>';
  list.querySelectorAll(".resetAccountOperator").forEach(b=>b.onclick=()=>{document.getElementById("accountOperatorName").value=b.dataset.name;document.getElementById("accountOperatorCode").focus();});
  list.querySelectorAll(".toggleAccountOperator").forEach(b=>b.onclick=async()=>{const {error}=await sb.rpc("admin_set_beparytech_account_operator_active",{p_operator_id:Number(b.dataset.id),p_active:b.dataset.active!=="1"});if(error)alert(error.message);else loadAdminAccountOperators();});
}
document.getElementById("accountOperatorsX").onclick=closeAccountOperators;
document.getElementById("accountOperatorsCancel").onclick=closeAccountOperators;
document.getElementById("accountOperatorsModal").addEventListener("click",e=>{if(e.target.id==="accountOperatorsModal")closeAccountOperators();});
document.getElementById("accountOperatorForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!selectedUserForAccountOperators)return;
  const name=document.getElementById("accountOperatorName").value.trim(),code=document.getElementById("accountOperatorCode").value.trim(),msg=document.getElementById("accountOperatorsMsg");
  if(!/^\d{6,8}$/.test(code)){msg.textContent="Il codice deve avere da 6 a 8 cifre.";msg.className="createUserMsg error";return;}
  const {error}=await sb.rpc("admin_set_beparytech_account_operator",{p_account_user_id:selectedUserForAccountOperators.userId,p_name:name,p_code:code});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  msg.textContent=`Codice salvato per ${name}.`;msg.className="createUserMsg ok";document.getElementById("accountOperatorCode").value="";await loadAdminAccountOperators();
});

function exportInventory(){const rows=[["Sezione","Prodotto","Variante","SKU","Barcode","Quantità","Soglia"]];customProducts.forEach(p=>{const sec=customSections.find(s=>Number(s.id)===Number(p.section_id));rows.push([sec?.name,p.name,p.variant,p.sku,p.barcode,p.quantity,p.low_stock_threshold])});downloadText(`BeparyTech_magazzino_${new Date().toISOString().slice(0,10)}.csv`,rows.map(r=>r.map(csvEscape).join(",")).join("\n"),"text/csv;charset=utf-8")}
async function exportRequests(){const {data}=await sb.from("beparytech_requests").select("requester_name,item,quantity,code,link,note,status,created_at").order("created_at");const rows=[["Operatore","Articolo","Quantità","Codice","Link","Nota","Stato","Data"],...(data||[]).map(r=>[r.requester_name,r.item,r.quantity,r.code,r.link,r.note,r.status,r.created_at])];downloadText(`BeparyTech_da_ordinare_${new Date().toISOString().slice(0,10)}.csv`,rows.map(r=>r.map(csvEscape).join(",")).join("\n"),"text/csv;charset=utf-8")}
async function exportFull(){const [requests,sales,audit]=await Promise.all([sb.from("beparytech_requests").select("*"),sb.from("beparytech_sales").select("*").limit(5000),sb.from("beparytech_audit_events").select("*").limit(5000)]);downloadText(`BeparyTech_backup_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({version:17,created_at:new Date().toISOString(),sections:customSections,products:customProducts,requests:requests.data||[],sales:sales.data||[],audit:audit.data||[]},null,2),"application/json")}
document.getElementById("exportInventoryCsv").onclick=exportInventory;document.getElementById("exportRequestsCsv").onclick=exportRequests;document.getElementById("exportFullBackup").onclick=exportFull;




// ===== v55: sezione Scorte a zero =====
function zeroStockRows(category){
  return Object.entries(MODEL_COLORS)
    .filter(([model])=>!(category==="BackGlass" && (model==="iPhone 7"||model==="iPhone 7 Plus")))
    .flatMap(([model,colors])=>colors.map(color=>({model,color,qty:Number(stock[category==="BackGlass"?model+"||"+color:"Housing||"+model+"||"+color]||0)})))
    .filter(x=>x.qty===0)
    .sort((a,b)=>compareModels(a.model,b.model)||String(a.color).localeCompare(String(b.color),"it",{numeric:true,sensitivity:"base"}));
}
function renderZeroStock(){
  if(!isAdmin())return;
  const bg=zeroStockRows("BackGlass"),hs=zeroStockRows("Housing");
  document.getElementById("zeroBackglassCount").textContent=bg.length;
  document.getElementById("zeroHousingCount").textContent=hs.length;
  const render=(rows,kind)=>rows.length?rows.map(x=>`<div class="zeroStockRow"><span><strong>${escapeHtml(x.model)}</strong><small>${escapeHtml(x.color)} · ${kind}</small></span><b class="zeroStockBadge">0</b></div>`).join(""):'<div class="emptyState">Nessun articolo a quantità 0.</div>';
  document.getElementById("zeroBackglassList").innerHTML=render(bg,"BackGlass");
  document.getElementById("zeroHousingList").innerHTML=render(hs,"Housing");
}
function exportZeroStock(category){
  const rows=zeroStockRows(category);
  const csv=[["Categoria","Modello","Colore","Quantità"],...rows.map(x=>[category,x.model,x.color,0])];
  downloadText(`BeparyTech_${category}_quantita_0_${new Date().toISOString().slice(0,10)}.csv`,csv.map(r=>r.map(csvEscape).join(",")).join("\n"),"text/csv;charset=utf-8");
}
document.getElementById("exportZeroBackglass")?.addEventListener("click",()=>exportZeroStock("BackGlass"));
document.getElementById("exportZeroHousing")?.addEventListener("click",()=>exportZeroStock("Housing"));

// ===== v55: pull-to-refresh sui dispositivi touch =====
(function(){
  let startY=0,pull=0,tracking=false,refreshing=false;
  const threshold=78;
  const indicator=()=>document.getElementById("pullRefreshIndicator");
  function paint(){const el=indicator();if(!el)return;el.classList.toggle("show",pull>8||refreshing);el.classList.toggle("ready",pull>=threshold&&!refreshing);el.style.transform=`translate(-50%, ${Math.min(68,Math.max(-60,pull-54))}px)`;el.querySelector("b").textContent=refreshing?"Aggiornamento…":pull>=threshold?"Rilascia per aggiornare":"Tira giù per aggiornare";}
  async function refreshCurrent(){
    if(refreshing)return;refreshing=true;const el=indicator();el?.classList.add("refreshing");paint();
    try{
      await loadStock();
      if(typeof loadCustomCatalog==="function") await loadCustomCatalog();
      if(currentCategory==="Dashboard") await loadDashboard();
      else if(currentCategory==="Cronologia") await loadAudit();
      else if(currentCategory==="Vendite") await loadSales();
      else if(currentCategory==="ScorteZero") renderZeroStock();
      else if(currentCategory==="Orari") await loadHours();
      else if(currentCategory==="VenditeAdmin") await loadDeviceSales();
      else if(String(currentCategory).startsWith("custom:")) renderCustomSection();
      else if(currentCategory==="BackGlass"||currentCategory==="Housing") render();
      const cs=document.getElementById("cloudStatus");if(cs)cs.textContent="☁︎ Aggiornato";
    }catch(e){console.error("Pull refresh",e)}
    finally{setTimeout(()=>{refreshing=false;pull=0;const x=indicator();x?.classList.remove("refreshing","ready","show");if(x)x.style.transform="translate(-50%,-160%)"},350)}
  }
  document.addEventListener("touchstart",e=>{if(refreshing||e.touches.length!==1||window.scrollY>1)return;startY=e.touches[0].clientY;pull=0;tracking=true},{passive:true});
  document.addEventListener("touchmove",e=>{if(!tracking||refreshing)return;const d=e.touches[0].clientY-startY;if(d<=0){pull=0;paint();return;}pull=Math.min(120,d*.55);paint()},{passive:true});
  document.addEventListener("touchend",()=>{if(!tracking)return;tracking=false;if(pull>=threshold)refreshCurrent();else{pull=0;const el=indicator();el?.classList.remove("show","ready");if(el)el.style.transform="translate(-50%,-160%)"}},{passive:true});
})();

// v28 - Orari privati Admin
function timeToMinutes(v){if(!v)return null;const [h,m]=String(v).split(":").map(Number);return h*60+m;}
function workedMinutes(r){if(r&&r.total_minutes_override!==null&&r.total_minutes_override!==undefined&&r.total_minutes_override!=="")return Math.max(0,Number(r.total_minutes_override)||0);let n=0;const mi=timeToMinutes(r.morning_in),mo=timeToMinutes(r.morning_out),ai=timeToMinutes(r.afternoon_in),ao=timeToMinutes(r.afternoon_out);if(mi!==null&&mo!==null&&mo>=mi)n+=mo-mi;if(ai!==null&&ao!==null&&ao>=ai)n+=ao-ai;return n;}
function fmtMinutes(n){n=Math.max(0,Number(n)||0);return `${Math.floor(n/60)}h ${String(n%60).padStart(2,"0")}m`;}
function fmtDateIt(d){return new Date(`${d}T12:00:00`).toLocaleDateString("it-IT",{weekday:"short",day:"2-digit",month:"short"});}
function monthBounds(v){const [y,m]=v.split("-").map(Number),start=`${y}-${String(m).padStart(2,"0")}-01`,last=new Date(y,m,0).getDate(),end=`${y}-${String(m).padStart(2,"0")}-${last}`;return {start,end};}
function localDateISO(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
async function loadHours(){
  if(!isAdmin())return;
  const month=document.getElementById("hoursMonth");if(!month.value)month.value=localDateISO().slice(0,7);
  const {start,end}=monthBounds(month.value),list=document.getElementById("hoursList");list.innerHTML='<div class="emptyState">Caricamento…</div>';
  const [hr,ex]=await Promise.all([sb.from("beparytech_work_hours").select("*").gte("work_date",start).lte("work_date",end).order("work_date",{ascending:false}),sb.from("beparytech_work_extras").select("*").gte("work_date",start).lte("work_date",end).order("work_date",{ascending:false}).order("created_at",{ascending:false})]);
  if(hr.error||ex.error){list.innerHTML=`<div class="emptyState">Errore nel caricamento: ${escapeHtml(hr.error?.message||ex.error?.message||"")}</div>`;return;}
  window.btWorkHours=hr.data||[];window.btWorkExtras=ex.data||[];renderHoursList();
}
function companyBucket(v){const c=String(v||"").trim().toLowerCase();if(c.includes("riparalo")||c.includes("rpl"))return "riparalo";if(c.includes("e-pol")||c.includes("epol")||c.includes("e pol"))return "epol";return "other";}
function monthLabel(monthNum){return new Date(2026,monthNum-1,1).toLocaleDateString("it-IT",{month:"short"}).replace(".","");}
function renderMonthColumns(){
  const host=document.getElementById("hoursMonthColumns"),sel=(document.getElementById("hoursMonth").value||localDateISO().slice(0,7)),[year,month]=sel.split("-").map(Number);
  const hours=window.btWorkHours||[],extras=window.btWorkExtras||[];
  host.innerHTML=Array.from({length:12},(_,i)=>{const m=i+1,active=m===month,mins=active?hours.reduce((a,r)=>a+workedMinutes(r),0)+extras.reduce((a,r)=>a+Number(r.minutes||0),0):0;return `<button class="hoursMonthBtn${active?" active":""}" type="button" data-month="${year}-${String(m).padStart(2,"0")}"><strong>${escapeHtml(monthLabel(m))}</strong><small>${active?fmtMinutes(mins):String(year)}</small></button>`}).join("");
  host.querySelectorAll("[data-month]").forEach(b=>b.onclick=()=>{document.getElementById("hoursMonth").value=b.dataset.month;loadHours();});
}
function hourTimeText(h){const a=h.morning_in||h.morning_out?`${(h.morning_in||"—").slice(0,5)}–${(h.morning_out||"—").slice(0,5)}`:"";const b=h.afternoon_in||h.afternoon_out?`${(h.afternoon_in||"—").slice(0,5)}–${(h.afternoon_out||"—").slice(0,5)}`:"";return [a,b].filter(Boolean).join(" · ")||"Orario non specificato";}
function renderCompanyColumn(title,bucket,hours,extras){
  const hs=hours.filter(h=>companyBucket(h.company)===bucket),xs=extras.filter(x=>companyBucket(x.company)===bucket),total=hs.reduce((a,h)=>a+workedMinutes(h),0)+xs.reduce((a,x)=>a+Number(x.minutes||0),0),dates=[...new Set([...hs.map(x=>x.work_date),...xs.map(x=>x.work_date)])].sort().reverse();
  const rows=dates.map(d=>{const h=hs.find(x=>x.work_date===d),dayXs=xs.filter(x=>x.work_date===d),mins=(h?workedMinutes(h):0)+dayXs.reduce((a,x)=>a+Number(x.minutes||0),0);return `<div class="hoursCompactDay"><div class="hoursCompactTop"><strong>${fmtDateIt(d)}</strong><b>${fmtMinutes(mins)}</b></div>${h?`<div class="hoursCompactTime">${escapeHtml(hourTimeText(h))}</div><div class="hoursCompactActions"><button class="hoursEdit" data-edit-hour="${h.id}" type="button">Modifica</button><button class="hoursDelete" data-del-hour="${h.id}" type="button">Elimina</button></div>`:""}${dayXs.map(x=>`<div class="hoursCompactTime"><b>Extra:</b> ${escapeHtml(x.description)} · ${fmtMinutes(x.minutes)}${Number(x.amount)>0?` · ${Number(x.amount).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}`:""}</div><div class="hoursCompactActions"><button class="hoursDelete" data-del-extra="${x.id}" type="button">Elimina extra</button></div>`).join("")}</div>`}).join("");
  return `<section class="hoursCompanyColumn"><div class="hoursColumnHead"><div><strong>${escapeHtml(title)}</strong><small>${dates.length} giorn${dates.length===1?"o":"i"}</small></div><b>${fmtMinutes(total)}</b></div>${rows||'<div class="hoursEmpty">Nessun orario.</div>'}</section>`;
}
function renderHoursList(){
  const hours=window.btWorkHours||[],extras=window.btWorkExtras||[],normal=hours.reduce((a,r)=>a+workedMinutes(r),0),extraMin=extras.reduce((a,r)=>a+Number(r.minutes||0),0),amount=extras.reduce((a,r)=>a+Number(r.amount||0),0);
  document.getElementById("hoursNormalTotal").textContent=fmtMinutes(normal);document.getElementById("hoursExtraTotal").textContent=fmtMinutes(extraMin);document.getElementById("hoursGrandTotal").textContent=fmtMinutes(normal+extraMin);document.getElementById("hoursExtraAmount").textContent=amount.toLocaleString("it-IT",{style:"currency",currency:"EUR"});
  renderMonthColumns();
  const list=document.getElementById("hoursList");if(!hours.length&&!extras.length){list.innerHTML='<div class="emptyState">Nessun orario registrato in questo mese.</div>';return;}
  const notes=[];hours.forEach(h=>{if(h.note)notes.push({d:h.work_date,text:h.note,src:h.company||"Orario"});});extras.forEach(x=>{if(x.note)notes.push({d:x.work_date,text:x.note,src:x.description||x.company||"Extra"});});notes.sort((a,b)=>b.d.localeCompare(a.d));
  const othersH=hours.filter(h=>companyBucket(h.company)==="other"),othersX=extras.filter(x=>companyBucket(x.company)==="other");
  const otherRows=[...new Set([...othersH.map(x=>x.work_date),...othersX.map(x=>x.work_date)])].sort().reverse().map(d=>{const h=othersH.find(x=>x.work_date===d),xs=othersX.filter(x=>x.work_date===d);return `<div class="hoursCompactDay"><div class="hoursCompactTop"><strong>${fmtDateIt(d)}</strong><b>${fmtMinutes((h?workedMinutes(h):0)+xs.reduce((a,x)=>a+Number(x.minutes||0),0))}</b></div>${h?`<div class="hoursCompactTime">${escapeHtml(h.company||"Altro")} · ${escapeHtml(hourTimeText(h))}</div><div class="hoursCompactActions"><button class="hoursEdit" data-edit-hour="${h.id}" type="button">Modifica</button><button class="hoursDelete" data-del-hour="${h.id}" type="button">Elimina</button></div>`:""}${xs.map(x=>`<div class="hoursCompactTime"><b>${escapeHtml(x.company||"Extra")}:</b> ${escapeHtml(x.description)} · ${fmtMinutes(x.minutes)}</div><div class="hoursCompactActions"><button class="hoursDelete" data-del-extra="${x.id}" type="button">Elimina extra</button></div>`).join("")}</div>`}).join("");
  list.innerHTML=`<div class="hoursSeparatedGrid">${renderCompanyColumn("e-Pol","epol",hours,extras)}${renderCompanyColumn("Riparalo","riparalo",hours,extras)}<section class="hoursNotesColumn"><div class="hoursColumnHead"><div><strong>Note</strong><small>Separate dagli orari</small></div><b>${notes.length}</b></div>${notes.map(n=>`<div class="hoursNoteItem"><strong>${fmtDateIt(n.d)} · ${escapeHtml(n.src)}</strong><span>${escapeHtml(n.text)}</span></div>`).join("")||'<div class="hoursEmpty">Nessuna nota.</div>'}</section>${otherRows?`<div class="hoursOtherWrap"><div class="hoursOtherTitle">Altro / extra senza e-Pol o Riparalo</div><div class="hoursOtherGrid">${otherRows}</div></div>`:""}</div>`;
  list.querySelectorAll("[data-edit-hour]").forEach(b=>b.onclick=()=>editHour(Number(b.dataset.editHour)));list.querySelectorAll("[data-del-hour]").forEach(b=>b.onclick=()=>deleteHour(Number(b.dataset.delHour)));list.querySelectorAll("[data-del-extra]").forEach(b=>b.onclick=()=>deleteExtra(Number(b.dataset.delExtra)));
}
function editHour(id){const r=(window.btWorkHours||[]).find(x=>Number(x.id)===id);if(!r)return;document.getElementById("workDate").value=r.work_date;document.getElementById("morningIn").value=(r.morning_in||"").slice(0,5);document.getElementById("morningOut").value=(r.morning_out||"").slice(0,5);document.getElementById("afternoonIn").value=(r.afternoon_in||"").slice(0,5);document.getElementById("afternoonOut").value=(r.afternoon_out||"").slice(0,5);document.getElementById("workCompany").value=r.company||"";document.getElementById("workNote").value=r.note||"";document.getElementById("hoursForm").scrollIntoView({behavior:"smooth",block:"start"});}
async function deleteHour(id){if(!isAdmin()||!confirm("Eliminare questo orario?"))return;const {error}=await sb.from("beparytech_work_hours").delete().eq("id",id);if(error)alert(error.message);else loadHours();}
async function deleteExtra(id){if(!isAdmin()||!confirm("Eliminare questo extra?"))return;const {error}=await sb.from("beparytech_work_extras").delete().eq("id",id);if(error)alert(error.message);else loadHours();}
document.getElementById("hoursForm").addEventListener("submit",async e=>{e.preventDefault();if(!isAdmin())return;const msg=document.getElementById("hoursMsg"),row={user_id:currentUser.id,work_date:document.getElementById("workDate").value,morning_in:document.getElementById("morningIn").value||null,morning_out:document.getElementById("morningOut").value||null,afternoon_in:document.getElementById("afternoonIn").value||null,afternoon_out:document.getElementById("afternoonOut").value||null,company:document.getElementById("workCompany").value.trim()||null,note:document.getElementById("workNote").value.trim()||null,total_minutes_override:null,updated_at:new Date().toISOString()};const {error}=await sb.from("beparytech_work_hours").upsert(row,{onConflict:"user_id,work_date"});msg.textContent=error?error.message:"Orario salvato.";msg.className=`createUserMsg ${error?"error":"ok"}`;if(!error){document.getElementById("hoursMonth").value=row.work_date.slice(0,7);await loadHours();}});
document.getElementById("extraForm").addEventListener("submit",async e=>{e.preventDefault();if(!isAdmin())return;const msg=document.getElementById("extraMsg"),mins=Math.max(0,Number(document.getElementById("extraHours").value)||0)*60+Math.max(0,Number(document.getElementById("extraMinutes").value)||0),row={user_id:currentUser.id,work_date:document.getElementById("extraDate").value,description:document.getElementById("extraDescription").value.trim(),minutes:mins,amount:Math.max(0,Number(document.getElementById("extraAmount").value)||0),company:document.getElementById("extraCompany").value.trim()||null,note:document.getElementById("extraNote").value.trim()||null};const {error}=await sb.from("beparytech_work_extras").insert(row);msg.textContent=error?error.message:"Extra aggiunto.";msg.className=`createUserMsg ${error?"error":"ok"}`;if(!error){e.target.reset();document.getElementById("extraDate").value=row.work_date;document.getElementById("extraHours").value=0;document.getElementById("extraMinutes").value=0;document.getElementById("extraAmount").value=0;document.getElementById("hoursMonth").value=row.work_date.slice(0,7);await loadHours();}});
document.getElementById("hoursMonth").addEventListener("change",loadHours);document.getElementById("hoursRefreshBtn").onclick=loadHours;document.getElementById("hoursTodayBtn").onclick=()=>{const d=localDateISO();document.getElementById("workDate").value=d;document.getElementById("extraDate").value=d;document.getElementById("hoursMonth").value=d.slice(0,7);loadHours();};

// Modalità giorno / notte
const themeToggle=document.getElementById("themeToggle");
const themeIcon=document.getElementById("themeIcon");
const themeLabel=document.getElementById("themeLabel");
const themeMeta=document.getElementById("themeColorMeta");

function applyTheme(theme){
  document.body.dataset.theme=theme;
  const light=theme==="light";
  themeIcon.textContent=light ? "☾" : "☀︎";
  themeLabel.textContent=light ? "Notte" : "Giorno";
  themeToggle.setAttribute("aria-label", light ? "Passa alla modalità notte" : "Passa alla modalità giorno");
  if(themeMeta) themeMeta.setAttribute("content", light ? "#f4f1ea" : "#070707");
  try{ localStorage.setItem("beparytech-theme",theme); }catch(_){}
}
let initialTheme="dark";
try{
  const saved=localStorage.getItem("beparytech-theme");
  if(saved==="light"||saved==="dark") initialTheme=saved;
  else if(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) initialTheme="light";
}catch(_){}
applyTheme(initialTheme);
themeToggle.addEventListener("click",()=>applyTheme(document.body.dataset.theme==="light" ? "dark" : "light"));



const euroFmt=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
function supplierFromUrl(value){
  const raw=String(value||"").trim(); if(!raw) return "";
  try{const u=new URL(raw); const h=u.hostname.toLowerCase().replace(/^www\./,"");
    if(h.includes("aliexpress.")) return "AliExpress";
    if(h.includes("ebay.")) return "eBay";
    if(h.includes("amazon.")) return "Amazon";
    if(h.includes("temu.")) return "Temu";
    if(h.includes("backmarket.")) return "Back Market";
    return h.split(".").slice(0,-1).join(".")||h;
  }catch(_){return "";}
}
function updateDeviceSaleVatPreview(){
  const net=Math.max(0,Number(document.getElementById("deviceSalePrice")?.value)||0);
  const rate=Math.min(100,Math.max(0,Number(document.getElementById("deviceSaleVatRate")?.value)||0));
  const vat=net*rate/100, gross=net+vat;
  document.getElementById("deviceSaleNet").textContent=euroFmt.format(net||0);
  document.getElementById("deviceSaleVat").textContent=euroFmt.format(vat||0);
  document.getElementById("deviceSaleGross").textContent=euroFmt.format(gross||0);
}
async function loadDeviceSales(){
  if(!isAdmin()) return;
  const list=document.getElementById("deviceSalesList"), sum=document.getElementById("deviceSalesSummary"); if(!list)return;
  list.innerHTML='<div class="emptyState">Caricamento…</div>';
  const {data,error}=await sb.from("beparytech_admin_device_sales").select("*").order("sold_at",{ascending:false}).order("id",{ascending:false}).limit(300);
  if(error){list.innerHTML='<div class="emptyState">Impossibile caricare le vendite.</div>';return;}
  const rows=data||[], vat=rows.reduce((a,r)=>a+Number(r.vat_amount||0),0), gross=rows.reduce((a,r)=>a+Number(r.sale_price||0)+Number(r.vat_amount||0),0);
  sum.innerHTML=`<div><span>Vendite</span><strong>${rows.length}</strong></div><div><span>Totale</span><strong>${euroFmt.format(gross)}</strong></div><div><span>IVA</span><strong>${euroFmt.format(vat)}</strong></div>`;
  if(!rows.length){list.innerHTML='<div class="emptyState">Nessuna vendita registrata.</div>';return;}
  list.innerHTML=rows.map(r=>`<article class="deviceAdminSaleRow"><div class="deviceAdminSaleTop"><div><strong>${escapeHtml(r.device_name)}</strong><span>${escapeHtml(r.store)} · ${new Date(r.sold_at+"T12:00:00").toLocaleDateString("it-IT")}</span></div><div class="deviceAdminSalePrice"><strong>${euroFmt.format(Number(r.sale_price||0)+Number(r.vat_amount||0))}</strong><span>Totale IVA inclusa · IVA ${Number(r.vat_rate||0).toLocaleString("it-IT")}%: ${euroFmt.format(Number(r.vat_amount||0))}</span></div></div><div class="deviceAdminSaleMeta"><span>Imponibile ${euroFmt.format(Number(r.net_amount||0))}</span>${r.supplier_name?`<span>Fornitore: ${escapeHtml(r.supplier_name)}</span>`:""}${r.note?`<span>Nota: ${escapeHtml(r.note)}</span>`:""}</div>${r.purchase_url?`<a class="deviceAdminSaleLink" href="${escapeHtml(safeExternalUrl(r.purchase_url))}" target="_blank" rel="noopener noreferrer">Apri riferimento acquisto ↗</a>`:""}<div class="deviceAdminSaleActions"><button class="rowAction deleteDeviceSale" data-id="${r.id}" type="button">Elimina</button></div></article>`).join("");
  list.querySelectorAll(".deleteDeviceSale").forEach(b=>b.onclick=async()=>{if(!confirm("Eliminare questa vendita?"))return; const {error}=await sb.from("beparytech_admin_device_sales").delete().eq("id",Number(b.dataset.id)); if(error)alert(error.message); else loadDeviceSales();});
}
const dsDate=document.getElementById("deviceSaleDate"); if(dsDate) dsDate.value=new Date().toISOString().slice(0,10);
["deviceSalePrice","deviceSaleVatRate"].forEach(id=>document.getElementById(id)?.addEventListener("input",updateDeviceSaleVatPreview));
document.getElementById("deviceSalePurchaseUrl")?.addEventListener("input",e=>{const supplier=supplierFromUrl(e.target.value); if(supplier)document.getElementById("deviceSaleSupplier").value=supplier;});
document.getElementById("refreshDeviceSalesBtn")?.addEventListener("click",loadDeviceSales);
document.getElementById("deviceSaleForm")?.addEventListener("submit",async e=>{e.preventDefault(); if(!isAdmin())return; const msg=document.getElementById("deviceSaleMsg");
  const url=document.getElementById("deviceSalePurchaseUrl").value.trim(); if(url && safeExternalUrl(url)==="#"){msg.className="createUserMsg error";msg.textContent="Link acquisto non valido.";return;}
  const row={workspace_owner_id:workspaceOwnerId,created_by:currentUser.id,sold_at:document.getElementById("deviceSaleDate").value,store:document.getElementById("deviceSaleStore").value,device_name:document.getElementById("deviceSaleName").value.trim(),sale_price:Number(document.getElementById("deviceSalePrice").value),vat_rate:Number(document.getElementById("deviceSaleVatRate").value)||0,purchase_url:url||null,supplier_name:document.getElementById("deviceSaleSupplier").value.trim()||supplierFromUrl(url)||null,note:document.getElementById("deviceSaleNote").value.trim()||null};
  const {error}=await sb.from("beparytech_admin_device_sales").insert(row); msg.className=`createUserMsg ${error?"error":"ok"}`; msg.textContent=error?error.message:"Vendita salvata."; if(!error){e.target.reset();document.getElementById("deviceSaleDate").value=new Date().toISOString().slice(0,10);document.getElementById("deviceSaleVatRate").value="22";updateDeviceSaleVatPreview();loadDeviceSales();}
});
document.getElementById("adminLoginPasswordForm")?.addEventListener("submit",async e=>{e.preventDefault(); if(!isAdmin())return; const msg=document.getElementById("adminLoginPasswordMsg"),btn=document.getElementById("adminLoginPasswordSave"), userId=document.getElementById("adminLoginPasswordUser").value,p1=document.getElementById("adminLoginPasswordValue").value,p2=document.getElementById("adminLoginPasswordValue2").value; msg.textContent=""; if(!userId){msg.textContent="Seleziona un utente.";return;} if(!isStrongLoginPassword(p1)){msg.textContent="Password: minimo 12 caratteri con maiuscola, minuscola, numero e simbolo.";return;} if(p1!==p2){msg.textContent="Le password non coincidono.";return;} btn.disabled=true; const {data,error}=await sb.functions.invoke("beparytech-users",{method:"POST",body:{action:"set_login_password",user_id:userId,password:p1}}); btn.disabled=false; if(error||data?.error){msg.className="createUserMsg error";msg.textContent=data?.error||error?.message||"Impossibile aggiornare la password.";return;} msg.className="createUserMsg ok";msg.textContent="Password login aggiornata correttamente.";e.target.reset();});

function isStrongLoginPassword(value){
  return typeof value==="string" && value.length>=12 && value.length<=128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function openPasswordRecovery(){
  try { sessionStorage.setItem("bt-password-recovery-pending","1"); } catch(_) {}
  document.body.classList.add("password-recovery-mode");
  const modal=document.getElementById("passwordRecoveryModal");
  if(modal) modal.hidden=false;
}

// Se un refresh avviene durante il recupero, il gestionale resta bloccato sul cambio password.
try {
  const bootUrl=new URL(window.location.href);
  const bootHash=new URLSearchParams((bootUrl.hash||"").replace(/^#/,""));
  if(bootHash.get("type")==="recovery" || bootUrl.searchParams.get("code") || sessionStorage.getItem("bt-password-recovery-pending")==="1") {
    document.body.classList.add("password-recovery-mode");
  }
} catch(_) {}

sb.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY"){
    openPasswordRecovery();
    return;
  }
  let recoveryPending=false;
  try { recoveryPending=sessionStorage.getItem("bt-password-recovery-pending")==="1"; } catch(_) {}
  if(recoveryPending && session?.user){ openPasswordRecovery(); return; }
  if(session?.user && session.user.id!==currentUser?.id) showAuth(session.user);
  if(!session?.user && currentUser) showAuth(null);
});

// Gestisce in modo robusto il ritorno dal link di recupero password.
// Supporta sia il flow implicito (#type=recovery) sia PKCE (?code=...).
(async function handlePasswordRecoveryReturn(){
  try{
    const url=new URL(window.location.href);
    const hashParams=new URLSearchParams((url.hash||"").replace(/^#/,""));
    const isRecovery=hashParams.get("type")==="recovery";
    const code=url.searchParams.get("code");

    if(code){
      const {error}=await sb.auth.exchangeCodeForSession(code);
      if(!error){
        openPasswordRecovery();
        url.searchParams.delete("code");
        history.replaceState({},document.title,url.pathname+url.search);
        return;
      }
    }

    let recoveryPending=false;
    try { recoveryPending=sessionStorage.getItem("bt-password-recovery-pending")==="1"; } catch(_) {}
    if(isRecovery || recoveryPending){
      const {data}=await sb.auth.getSession();
      if(data?.session) openPasswordRecovery();
    }
  }catch(_){/* Il listener PASSWORD_RECOVERY resta il fallback principale. */}
})();

document.getElementById("saveRecoveryPassword").onclick=async()=>{
  const p1=document.getElementById("recoveryPassword").value;
  const p2=document.getElementById("recoveryPassword2").value;
  const msg=document.getElementById("recoveryPasswordMsg");
  msg.textContent="";
  if(!isStrongLoginPassword(p1)){msg.textContent="Usa almeno 12 caratteri con maiuscola, minuscola, numero e simbolo.";return;}
  if(p1!==p2){msg.textContent="Le password non coincidono.";return;}
  const {error}=await sb.auth.updateUser({password:p1});
  if(error){msg.textContent=error.message;return;}
  document.getElementById("recoveryPassword").value="";
  document.getElementById("recoveryPassword2").value="";
  await sb.auth.signOut();
  try { sessionStorage.removeItem("bt-password-recovery-pending"); } catch(_) {}
  document.getElementById("passwordRecoveryModal").hidden=true;
  document.body.classList.remove("password-recovery-mode");
  try { history.replaceState({}, document.title, window.location.pathname); } catch(_) {}
  stock={};
  await showAuth(null);
  alert("Password aggiornata correttamente. Accedi con la nuova password.");
};


// Service Worker registration kept in external JS so CSP can block inline scripts.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js?v=62", { updateViaCache: "none" });
      await reg.update();
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!sessionStorage.getItem("bt-cache-reloaded-v62")) {
          sessionStorage.setItem("bt-cache-reloaded-v62", "1");
          location.reload();
        }
      });
    } catch (e) { console.warn("Service Worker non disponibile", e); }
  });
}


async function btGetWorkspaceOwnerId(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user) throw new Error("Sessione non valida");
  const {data,error}=await sb.from("beparytech_profiles").select("workspace_owner_id,role,active").eq("user_id",user.id).single();
  if(error||!data||data.role!=="admin"||!data.active) throw new Error("Accesso riservato agli amministratori");
  return {owner:data.workspace_owner_id,user:user.id};
}
function updateAdminRepairVatPreview(){
  const net=Math.max(0,Number(document.getElementById("adminRepairPrice")?.value)||0);
  const rate=Math.min(100,Math.max(0,Number(document.getElementById("adminRepairVatRate")?.value)||0));
  const vat=net*rate/100, gross=net+vat;
  if(document.getElementById("adminRepairNet")) document.getElementById("adminRepairNet").textContent=euroFmt.format(net);
  if(document.getElementById("adminRepairVat")) document.getElementById("adminRepairVat").textContent=euroFmt.format(vat);
  if(document.getElementById("adminRepairGross")) document.getElementById("adminRepairGross").textContent=euroFmt.format(gross);
}
let adminRepairRows=[];
let adminRepairEditingId=null;

function resetAdminRepairEditor(){
  adminRepairEditingId=null;
  const form=document.getElementById("adminRepairForm");
  if(form) form.dataset.editing="0";
  const submit=document.getElementById("adminRepairSubmitBtn");
  const cancel=document.getElementById("adminRepairCancelEdit");
  if(submit) submit.textContent="Salva riparazione";
  if(cancel) cancel.hidden=true;
  const d=document.getElementById("adminRepairDate");
  if(d) d.value=new Date().toISOString().slice(0,10);
  ["adminRepairStore","adminRepairDevice","adminRepairType","adminRepairPrice","adminRepairNote","adminRepairEShareRef"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  const vat=document.getElementById("adminRepairVatRate"); if(vat)vat.value="22";
  updateAdminRepairVatPreview();
}

function startAdminRepairEdit(id){
  const r=adminRepairRows.find(x=>Number(x.id)===Number(id)); if(!r)return;
  adminRepairEditingId=Number(r.id);
  const form=document.getElementById("adminRepairForm"); if(form)form.dataset.editing="1";
  document.getElementById("adminRepairDate").value=r.repaired_at||"";
  document.getElementById("adminRepairStore").value=r.store||"";
  document.getElementById("adminRepairDevice").value=r.device||"";
  document.getElementById("adminRepairType").value=r.repair_type||"";
  document.getElementById("adminRepairPrice").value=Number(r.price_ex_vat||0);
  document.getElementById("adminRepairVatRate").value=Number(r.vat_rate??22);
  const repairNote=r.note||""; const em=repairNote.match(/^Rif\. e-Share:\s*([^·]+?)(?:\s*·\s*(.*))?$/);
  document.getElementById("adminRepairEShareRef").value=em?em[1].trim():"";
  document.getElementById("adminRepairNote").value=em?(em[2]||"").trim():repairNote;
  const submit=document.getElementById("adminRepairSubmitBtn"); if(submit)submit.textContent="Salva modifiche";
  const cancel=document.getElementById("adminRepairCancelEdit"); if(cancel)cancel.hidden=false;
  const msg=document.getElementById("adminRepairMsg"); if(msg){msg.className="createUserMsg";msg.textContent="Stai modificando una riparazione registrata.";}
  updateAdminRepairVatPreview();
  form?.scrollIntoView({behavior:"smooth",block:"start"});
}

async function deleteAdminRepair(id){
  if(!confirm("Eliminare definitivamente questa riparazione?"))return;
  try{
    const ctx=await btGetWorkspaceOwnerId();
    const {error}=await sb.from("beparytech_admin_repairs").delete().eq("id",Number(id)).eq("workspace_owner_id",ctx.owner);
    if(error)throw error;
    if(adminRepairEditingId===Number(id)) resetAdminRepairEditor();
    await loadAdminRepairs();
  }catch(e){alert(e.message||"Impossibile eliminare la riparazione.");}
}

async function loadAdminRepairs(){
  const list=document.getElementById("adminRepairsList"); if(!list)return;
  list.innerHTML='<div class="emptyState">Caricamento…</div>';
  try{
    const ctx=await btGetWorkspaceOwnerId();
    const {data,error}=await sb.from("beparytech_admin_repairs").select("*").eq("workspace_owner_id",ctx.owner).order("repaired_at",{ascending:false}).order("id",{ascending:false}).limit(300);
    if(error)throw error;
    const rows=data||[]; adminRepairRows=rows;
    const net=rows.reduce((x,r)=>x+Number(r.price_ex_vat||0),0), vat=rows.reduce((x,r)=>x+Number(r.vat_amount||0),0), total=rows.reduce((x,r)=>x+Number(r.total_inc_vat||0),0);
    const sum=document.getElementById("adminRepairsSummary");
    if(sum)sum.innerHTML=`<div><span>Riparazioni</span><strong>${rows.length}</strong></div><div><span>Imponibile</span><strong>${euroFmt.format(net)}</strong></div><div><span>IVA</span><strong>${euroFmt.format(vat)}</strong></div><div><span>Totale</span><strong>${euroFmt.format(total)}</strong></div>`;
    list.innerHTML=rows.length?rows.map(r=>`<article class="deviceAdminSaleRow"><div class="deviceAdminSaleTop"><div><strong>${escapeHtml(r.device)}</strong><span>${escapeHtml(r.repair_type)} · ${escapeHtml(r.store)} · ${new Date(r.repaired_at+"T12:00:00").toLocaleDateString("it-IT")}</span>${r.note?`<small>${escapeHtml(r.note)}</small>`:""}</div><div class="deviceAdminSalePrice"><strong>${euroFmt.format(Number(r.total_inc_vat||0))}</strong><span>IVA ${Number(r.vat_rate||0).toLocaleString("it-IT")}% · ${euroFmt.format(Number(r.vat_amount||0))}</span></div></div><div class="deviceAdminSaleMeta"><span>Imponibile ${euroFmt.format(Number(r.price_ex_vat||0))}</span></div><div class="deviceAdminSaleActions repairRowActions"><button class="rowAction editAdminRepair" data-id="${r.id}" type="button">Modifica</button><button class="rowAction delete deleteAdminRepair" data-id="${r.id}" type="button">Elimina</button></div></article>`).join(""):'<div class="emptyState">Nessuna riparazione registrata</div>';
    list.querySelectorAll(".editAdminRepair").forEach(b=>b.onclick=()=>startAdminRepairEdit(Number(b.dataset.id)));
    list.querySelectorAll(".deleteAdminRepair").forEach(b=>b.onclick=()=>deleteAdminRepair(Number(b.dataset.id)));
  }catch(e){list.innerHTML=`<div class="emptyState">${escapeHtml(e.message||"Errore caricamento")}</div>`;}
}
function bindAdminRepairs(){
 const form=document.getElementById("adminRepairForm"); if(!form||form.dataset.bound==="1")return; form.dataset.bound="1";
 const d=document.getElementById("adminRepairDate"); if(d&&!d.value)d.value=new Date().toISOString().slice(0,10);
 document.getElementById("adminRepairPrice")?.addEventListener("input",updateAdminRepairVatPreview);
 document.getElementById("adminRepairVatRate")?.addEventListener("input",updateAdminRepairVatPreview);
 document.getElementById("refreshAdminRepairsBtn")?.addEventListener("click",loadAdminRepairs);
 document.getElementById("adminRepairCancelEdit")?.addEventListener("click",()=>{resetAdminRepairEditor();const msg=document.getElementById("adminRepairMsg");if(msg)msg.textContent="Modifica annullata.";});
 form.addEventListener("submit",async ev=>{
   ev.preventDefault(); const msg=document.getElementById("adminRepairMsg"); if(msg){msg.className="createUserMsg";msg.textContent=adminRepairEditingId?"Salvataggio modifiche…":"Salvataggio…";}
   try{
    const ctx=await btGetWorkspaceOwnerId();
    const payload={repaired_at:document.getElementById("adminRepairDate").value,store:document.getElementById("adminRepairStore").value,device:document.getElementById("adminRepairDevice").value.trim(),repair_type:document.getElementById("adminRepairType").value.trim(),price_ex_vat:Number(document.getElementById("adminRepairPrice").value||0),vat_rate:Number(document.getElementById("adminRepairVatRate").value||22),note:(()=>{const r=document.getElementById("adminRepairEShareRef").value.trim();const n=document.getElementById("adminRepairNote").value.trim();return `Rif. e-Share: ${r}${n?` · ${n}`:""}`;})()};
    let error;
    if(adminRepairEditingId){
      ({error}=await sb.from("beparytech_admin_repairs").update(payload).eq("id",adminRepairEditingId).eq("workspace_owner_id",ctx.owner));
    }else{
      ({error}=await sb.from("beparytech_admin_repairs").insert({...payload,workspace_owner_id:ctx.owner,created_by:ctx.user}));
    }
    if(error)throw error;
    if(msg){msg.className="createUserMsg ok";msg.textContent=adminRepairEditingId?"Riparazione modificata.":"Riparazione salvata.";}
    resetAdminRepairEditor(); await loadAdminRepairs();
   }catch(e){if(msg){msg.className="createUserMsg error";msg.textContent=e.message||"Errore salvataggio";}}
 });
 updateAdminRepairVatPreview();
}

const storeAdminForm=document.getElementById("storeAdminForm");
if(storeAdminForm)storeAdminForm.addEventListener("submit",async e=>{e.preventDefault();if(!isAdmin())return;const name=document.getElementById("storeAdminName").value.trim(),admin_only=document.getElementById("storeAdminPrivate").checked,msg=document.getElementById("storeAdminMsg");if(!name)return;const {error}=await sb.from("beparytech_stores").insert({workspace_owner_id:workspaceOwnerId,name,admin_only,active:true,created_by:currentUser.id});if(error){msg.className="createUserMsg error";msg.textContent=error.message;return;}e.target.reset();msg.className="createUserMsg ok";msg.textContent="Negozio aggiunto.";await loadStores();});

document.addEventListener("DOMContentLoaded",bindAdminRepairs);
setInterval(bindAdminRepairs,1500);



function bindBeparyProductTitle(){
 const url=document.getElementById("deviceSalePurchaseUrl"), name=document.getElementById("deviceSaleName");
 if(!url||!name||url.dataset.titleBound==="1")return; url.dataset.titleBound="1";
 let last="";
 const run=async()=>{
   const v=url.value.trim(); if(!v||v===last)return; last=v;
   const old=name.value.trim();
   name.placeholder="Recupero descrizione dal link…";
   try{
     const {data,error}=await sb.functions.invoke("beparytech-product-title",{body:{url:v}});
     const title=String(data?.title||"").trim();
     if(!error&&title&&(!old||name.dataset.autoTitle==="1")){name.value=title;name.dataset.autoTitle="1";name.dispatchEvent(new Event("input",{bubbles:true}));}
   }catch(e){}
   name.placeholder="Si compila dal link oppure scrivi manualmente";
 };
 url.addEventListener("change",run); url.addEventListener("blur",run); url.addEventListener("paste",()=>setTimeout(run,600));
}
document.addEventListener("DOMContentLoaded",bindBeparyProductTitle);
setInterval(bindBeparyProductTitle,1500);



function bindAdminRepairsAccordion(){
  const shell=document.getElementById("adminRepairsCard");
  if(shell?.dataset.adminFinancePanel==="repairs") return;
  const btn=document.getElementById("adminRepairsToggle");
  const panel=document.getElementById("adminRepairsPanel");
  if(!shell||!btn||!panel||btn.dataset.bound==="1")return;
  btn.dataset.bound="1";
  panel.hidden=true;
  shell.classList.remove("open");
  btn.setAttribute("aria-expanded","false");
  btn.addEventListener("click",()=>{
    const willOpen=panel.hidden;
    panel.hidden=!willOpen;
    shell.classList.toggle("open",willOpen);
    btn.setAttribute("aria-expanded",willOpen?"true":"false");
    if(willOpen){
      try{ bindAdminRepairs(); loadAdminRepairs(); }catch(e){}
    }
  });
}





function bindAdminFinanceTabs(){
 const root=document.getElementById("deviceSalesView");
 if(!root||root.dataset.financeTabsBound==="1")return;
 root.dataset.financeTabsBound="1";
 const tabs=[...root.querySelectorAll(".adminFinanceTab")];
 const panels=[...root.querySelectorAll("[data-admin-finance-panel]")];
 function show(which){
   tabs.forEach(t=>t.classList.toggle("active",t.dataset.adminPanel===which));
   panels.forEach(p=>p.hidden=p.dataset.adminFinancePanel!==which);
   if(which==="repairs"){
     const rp=document.getElementById("adminRepairsPanel"); if(rp)rp.hidden=false;
     try{bindAdminRepairs();loadAdminRepairs();}catch(e){}
   } else {
     try{loadAdminDeviceSales();}catch(e){}
   }
 }
 tabs.forEach(t=>t.addEventListener("click",()=>show(t.dataset.adminPanel)));
 show("parts");
}






function bindAdminWorkTabs(){
  const tabs=document.getElementById("adminWorkTabs");
  if(!tabs || tabs.dataset.bound==="1") return;
  tabs.dataset.bound="1";
  const buttons=[...tabs.querySelectorAll(".adminWorkTab")];
  const sales=document.getElementById("adminSalesPanel");
  const repairs=document.getElementById("adminRepairsPanel");
  let current=null;

  function show(panel){
    // Se tocchi il pulsante già aperto, richiude tutto.
    current=current===panel?null:panel;
    if(sales) sales.hidden=current!=="sales";
    if(repairs) repairs.hidden=current!=="repairs";
    buttons.forEach(btn=>{
      const on=btn.dataset.workTab===current;
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-selected",on?"true":"false");
      btn.setAttribute("aria-expanded",on?"true":"false");
    });
    if(current==="sales"){
      try{ loadDeviceSales(); }catch(_){}
    }else if(current==="repairs"){
      try{ bindAdminRepairs(); loadAdminRepairs(); }catch(_){}
    }
  }
  buttons.forEach(btn=>btn.addEventListener("click",()=>show(btn.dataset.workTab)));
  // All'apertura della pagina nessuna finestra è già aperta.
  if(sales) sales.hidden=true;
  if(repairs) repairs.hidden=true;
  buttons.forEach(btn=>{btn.classList.remove("active");btn.setAttribute("aria-selected","false");btn.setAttribute("aria-expanded","false");});
}
document.addEventListener("DOMContentLoaded",bindAdminWorkTabs);
setInterval(bindAdminWorkTabs,1500);


// ===== v53: pannelli Orari chiusi + navigazione contestuale responsive =====
function bindHourAccordions(){
 document.querySelectorAll('.collapsibleHourCard').forEach(card=>{
  const t=card.querySelector('.hourCardToggle'), body=card.querySelector('.hourCardBody');
  if(!t||!body||t.dataset.bound==='1')return;t.dataset.bound='1';body.hidden=true;
  t.addEventListener('click',()=>{const open=body.hidden;document.querySelectorAll('.collapsibleHourCard').forEach(c=>{const b=c.querySelector('.hourCardBody'),x=c.querySelector('.hourCardToggle');if(b)b.hidden=true;c.classList.remove('open');if(x)x.setAttribute('aria-expanded','false')});body.hidden=!open;card.classList.toggle('open',open);t.setAttribute('aria-expanded',open?'true':'false')});
 });
}
const btNavStack=[];
const btOriginalSetCategory=setCategory;
setCategory=function(category,fromBack=false){
 if(!fromBack && currentCategory && currentCategory!==category) btNavStack.push(currentCategory);
 btOriginalSetCategory(category); updateSmartNavigation();
};
function smartBack(){const prev=btNavStack.pop(); if(prev) setCategory(prev,true); else setCategory('Dashboard',true)}
function updateSmartNavigation(){
 const back=document.getElementById('smartBackBtn'), nav=document.getElementById('mobileBottomNav'); if(!back||!nav)return;
 const signed=!!currentUser; nav.hidden=!signed; back.hidden=!signed||currentCategory==='Dashboard';
 const p=nav.querySelector('[data-smart-action="primary"]'), h=nav.querySelector('[data-smart-action="history"]');
 let pl='Cerca', pi='⌕', hl='Cronologia', hi='≋';
 if(currentCategory==='Orari'){pl='Orario';pi='◷';hl='Extra';hi='＋'}
 else if(currentCategory==='VenditeAdmin'){pl='Vendita';pi='−1';hl='Riparazioni';hi='⌁'}
 else if(currentCategory==='Vendite'){pl='Vendite';pi='✓';hl='Cronologia';hi='≋'}
 else if(currentCategory==='Utenti'){pl='Nuovo utente';pi='＋';hl='Gestisci';hi='♙'}
 else if(String(currentCategory).startsWith('custom:')){pl='Cerca';pi='⌕';hl='Cronologia';hi='≋'}
 p.querySelector('b').textContent=pi;p.querySelector('span').textContent=pl;h.querySelector('b').textContent=hi;h.querySelector('span').textContent=hl;
}
document.addEventListener('DOMContentLoaded',()=>{
 bindHourAccordions(); const nav=document.getElementById('mobileBottomNav'), back=document.getElementById('smartBackBtn');
 back?.addEventListener('click',smartBack);
 nav?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.smartAction;if(a==='home')setCategory('Dashboard');else if(a==='scanner')openScanner();else if(a==='menu')openMainMenu();else if(currentCategory==='Orari'&&a==='primary')document.querySelector('#hoursForm .hourCardToggle')?.click();else if(currentCategory==='Orari'&&a==='history')document.querySelector('#extraForm .hourCardToggle')?.click();else if(currentCategory==='VenditeAdmin'&&a==='primary')document.querySelector('[data-work-tab="sales"]')?.click();else if(currentCategory==='VenditeAdmin'&&a==='history')document.querySelector('[data-work-tab="repairs"]')?.click();else if(a==='history')setCategory('Cronologia');else document.getElementById('globalSearch')?.focus();});
 let sx=0,sy=0,st=0;document.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now()},{passive:true});document.addEventListener('touchend',e=>{if(!e.changedTouches?.length||sx>35)return;const dx=e.changedTouches[0].clientX-sx,dy=Math.abs(e.changedTouches[0].clientY-sy);if(dx>85&&dy<70&&Date.now()-st<700)smartBack()},{passive:true});
 updateSmartNavigation();
});
setInterval(()=>{bindHourAccordions();updateSmartNavigation()},1800);

// ===== v73: barra mobile segue lo scroll verso il basso e torna salendo =====
(function(){
 let lastY=Math.max(0,window.scrollY||0), ticking=false, slide=0;
 function paint(returning=false){
   const nav=document.getElementById('mobileBottomNav');
   const back=document.getElementById('smartBackBtn');
   if(!nav)return;
   const maxSlide=Math.max(88,(nav.offsetHeight||78)+34);
   slide=Math.max(0,Math.min(maxSlide,slide));
   const ratio=Math.min(1,slide/maxSlide);
   nav.style.setProperty('--bt-nav-slide',slide.toFixed(1)+'px');
   nav.style.setProperty('--bt-nav-opacity',String(Math.max(.12,1-ratio*.88)));
   nav.classList.toggle('nav-hidden',ratio>.96);
   nav.classList.toggle('nav-returning',!!returning);
   if(back){
     const backSlide=Math.min(92,slide*.82);
     back.style.setProperty('--bt-back-slide',backSlide.toFixed(1)+'px');
     back.style.setProperty('--bt-back-opacity',String(Math.max(0,1-ratio)));
     back.classList.toggle('nav-hidden',ratio>.92);
     back.classList.toggle('nav-returning',!!returning);
   }
 }
 function showNow(){slide=0;paint(true);setTimeout(()=>{document.getElementById('mobileBottomNav')?.classList.remove('nav-returning');document.getElementById('smartBackBtn')?.classList.remove('nav-returning')},180)}
 function onScroll(){
   if(ticking)return; ticking=true;
   requestAnimationFrame(()=>{
     const y=Math.max(0,window.scrollY||0);
     const delta=y-lastY;
     if(y<35){slide=0;paint(true)}
     else if(delta>0){slide+=Math.min(delta,34);paint(false)}
     else if(delta<0){slide-=Math.min(-delta*1.45,48);paint(false)}
     lastY=y; ticking=false;
   });
 }
 window.addEventListener('scroll',onScroll,{passive:true});
 document.addEventListener('DOMContentLoaded',()=>{
   paint(false);
   const nav=document.getElementById('mobileBottomNav');
   nav?.addEventListener('focusin',showNow);
   nav?.addEventListener('click',showNow);
 });
})();

// ===== v71 premium quick access =====
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-quick-category]").forEach(btn=>btn.addEventListener("click",()=>setCategory(btn.dataset.quickCategory)));
});
function syncPremiumUserBits(){
  const g=document.getElementById("dashboardGreetingName"); if(g)g.textContent=currentProfile?.username||"Admin";
  document.querySelectorAll(".adminQuick").forEach(x=>x.hidden=!isAdmin());
}
const _v71ApplyRoleVisibility=applyRoleVisibility;
applyRoleVisibility=function(){_v71ApplyRoleVisibility();syncPremiumUserBits();};
