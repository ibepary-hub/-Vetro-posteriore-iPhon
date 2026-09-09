
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
let salesStoreFilter = "ALL";

const inventory = document.getElementById("inventory");
const modelTemplate = document.getElementById("modelTemplate");
const colorTemplate = document.getElementById("colorTemplate");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const authMsg = document.getElementById("authMsg");

// Descrizione commerciale: BackGlass e Housing sono ricambi senza logo.
// Le chiavi interne e i modelli originali restano invariati per non rompere stock, storico o rientri.
function isNoLogoCategory(category){
  const c=String(category||"").trim().toLowerCase();
  return c==="backglass" || c==="housing";
}
function noLogoName(model,category){
  const base=String(model||"").trim().replace(/\s+NO\s+LOGO\s*$/i,"").trim();
  return isNoLogoCategory(category) && base ? `${base} NO LOGO` : base;
}
function saleDisplayName(s){ return noLogoName(s?.model,s?.category); }

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
function salePriceValue(key){const v=salePrices[key];return v==null?null:Number(v);}
function defaultSalePriceFor(category,model){return category==="BackGlass" ? backGlassUnitPrice(model) : null;}
function effectiveSalePrice(key,category,model){const saved=salePriceValue(key);return saved==null?defaultSalePriceFor(category,model):saved;}
async function loadSalePrices(){salePrices={};if(!currentUser)return;const {data,error}=await sb.from("beparytech_sale_prices").select("item_key,sale_price_ex_vat");if(error){console.error(error);return;}(data||[]).forEach(r=>salePrices[r.item_key]=Number(r.sale_price_ex_vat));}
async function saveSalePrice(key,value){if(!isAdmin())return;const {error}=await sb.from("beparytech_sale_prices").upsert({workspace_owner_id:workspaceOwnerId,item_key:key,sale_price_ex_vat:value,updated_by:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"workspace_owner_id,item_key"});if(error)throw error;salePrices[key]=value;}
async function editSalePrice(key,label,category,model){if(!isAdmin())return;const old=effectiveSalePrice(key,category,model);const raw=prompt(`Prezzo di vendita · ${label}\nInserisci il prezzo in euro IVA esclusa`,old==null?"":String(old).replace(".",","));if(raw===null)return;const value=Number(String(raw).replace(",","."));if(!Number.isFinite(value)||value<0){alert("Inserisci un prezzo di vendita valido.");return;}try{await saveSalePrice(key,value);refreshCostUi();}catch(e){alert(e?.message||"Errore salvataggio prezzo di vendita");}}
function salePriceBadgeHtml(key,label,category,model){const v=effectiveSalePrice(key,category,model);if(v==null)return isAdmin()?`<div class="inventoryPriceTag salePriceAdmin"><span>Prezzo vendita</span><strong>Da impostare</strong><button type="button" class="editSalePriceBtn" title="Modifica prezzo vendita">✎</button></div>`:"";return `<div class="inventoryPriceTag salePriceAdmin"><span>Prezzo vendita</span><strong>${eur(v)} + IVA</strong><small>${eur(v*1.22)} IVA incl.</small>${isAdmin()?`<button type="button" class="editSalePriceBtn" title="Modifica prezzo vendita">✎</button>`:""}</div>`;}
function wireSalePriceBadge(node,key,label,category,model){const b=node?.querySelector(".editSalePriceBtn");if(b)b.onclick=()=>editSalePrice(key,label,category,model);}
function normalizedCostKey(key){
  const raw=String(key||"");
  if(!raw.startsWith("FIXED||"))return raw;
  const p=raw.split("||");
  const category=p[1]||"";
  const model=category==="Housing"?(p[3]||""):(p[2]||"");
  return model?`MODEL||${category}||${model}`:raw;
}
function costValue(key){
  const normalized=normalizedCostKey(key);
  const v=adminCosts[normalized] ?? adminCosts[key];
  return v==null?null:Number(v);
}
function costBadgeHtml(key){
  if(!isAdmin())return "";
  const v=costValue(key);
  return `<div class="adminCostBadge"><div class="adminCostMain"><span>Costo modello</span><strong>${v==null?"Da impostare":eur(v)}</strong></div><button type="button" class="editCostBtn" title="Modifica costo modello" data-cost-key="${escapeHtml(normalizedCostKey(key))}">✎</button></div>`;
}
async function loadAdminCosts(){
  adminCosts={};
  if(!isAdmin())return;
  const {data,error}=await sb.from("beparytech_product_costs").select("item_key,cost_ex_vat");
  if(error){console.error(error);return;}
  (data||[]).forEach(r=>adminCosts[r.item_key]=Number(r.cost_ex_vat));
}
async function saveManualCost(key,value){
  const saveKey=normalizedCostKey(key);
  const {error}=await sb.from("beparytech_product_costs").upsert({workspace_owner_id:workspaceOwnerId,item_key:saveKey,cost_ex_vat:value,updated_by:currentUser.id},{onConflict:"workspace_owner_id,item_key"});
  if(error)throw error;
  adminCosts[saveKey]=value;
}
async function editCost(key,label){
  if(!isAdmin())return;
  const saveKey=normalizedCostKey(key),old=costValue(saveKey);
  const isModel=saveKey.startsWith("MODEL||");
  const parts=saveKey.split("||");
  const modelLabel=isModel?`${parts[2]} · ${parts[1]}`:label;
  const note=isModel?"Questo costo verrà usato automaticamente per tutti i colori di questo modello nella stessa sezione.":"";
  const raw=prompt(`Costo ${isModel?"modello":"prodotto"} · ${modelLabel}\nInserisci il costo effettivo in euro IVA esclusa${note?`\n\n${note}`:""}`,old==null?"":String(old).replace(".",","));
  if(raw===null)return;
  const value=Number(String(raw).replace(",","."));
  if(!Number.isFinite(value)||value<0){alert("Inserisci un costo valido.");return;}
  try{await saveManualCost(saveKey,value);refreshCostUi();}catch(e){alert(e?.message||"Errore salvataggio costo");}
}
function refreshCostUi(){if(String(currentCategory).startsWith("custom:"))renderCustomSection();else render();}
function wireCostBadge(costNode,key,label){const edit=costNode?.querySelector(".editCostBtn");if(edit)edit.onclick=()=>editCost(normalizedCostKey(key),label);}

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
      const qty=getQty(model,color); return (noLogoName(model,currentCategory)+" "+color).toLowerCase().includes(q)&&passesFilter(qty);
    });
    if(!filteredColors.length)return; visibleModels++;
    const node=modelTemplate.content.cloneNode(true), section=node.querySelector(".model"), header=node.querySelector(".modelHeader");
    section.classList.add("closed");
    header.setAttribute("aria-expanded","false");
    node.querySelector("h2").textContent=noLogoName(model,currentCategory);
    const thumb=node.querySelector(".modelThumb");
    thumb.src=imageForModel(model);
    thumb.alt=noLogoName(model,currentCategory);
    node.querySelector(".modelCount").textContent=colors.reduce((s,c)=>s+getQty(model,c),0)+" pezzi";
    const colorsBox=node.querySelector(".colors");
    filteredColors.forEach(color=>{
      const row=colorTemplate.content.cloneNode(true), qtyInput=row.querySelector(".qty"), status=row.querySelector(".status");
      const qty=getQty(model,color), [label,cls]=statusFor(qty);
      row.querySelector(".colorName").textContent=color; row.querySelector(".dot").style.background=colorDot(color);
      qtyInput.value=qty; status.textContent=label; status.className="status "+cls;
      {const colorRow=row.querySelector(".colorRow")||row.firstElementChild;const k=fixedCostKey(currentCategory,keyFor(model,color));if(colorRow){const pwrap=document.createElement("div");pwrap.innerHTML=salePriceBadgeHtml(k,`${model} · ${color}`,currentCategory,model);const priceNode=pwrap.firstElementChild;if(priceNode){wireSalePriceBadge(priceNode,k,`${model} · ${color}`,currentCategory,model);colorRow.appendChild(priceNode);}if(isAdmin()){const wrap=document.createElement("div");wrap.innerHTML=costBadgeHtml(k);const costNode=wrap.firstElementChild;if(costNode){wireCostBadge(costNode,k,`${model} · ${color}`);colorRow.appendChild(costNode);}}}}
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
  const invoicesMenu=document.getElementById("invoicesMenuItem");
  const bestekCatalogMenu=document.getElementById("bestekCatalogMenuItem");
  usersTab.hidden=!admin;
  if(catalogMenu) catalogMenu.hidden=!admin;
  if(usersMenu) usersMenu.hidden=!admin;
  if(backupMenu) backupMenu.hidden=!admin;
  if(zeroStockMenu) zeroStockMenu.hidden=!admin;
  if(hoursMenu) hoursMenu.hidden=!admin;
  if(deviceSalesMenu) deviceSalesMenu.hidden=!admin;
  if(invoicesMenu) invoicesMenu.hidden=!admin;
  if(bestekCatalogMenu) bestekCatalogMenu.hidden=!admin;
  if(!admin){
    usersView.hidden=true;
    if(catalogView) catalogView.hidden=true;
    usersTab.classList.remove("active");
    document.getElementById("hoursView").hidden=true;
    const dsv=document.getElementById("deviceSalesView"); if(dsv) dsv.hidden=true;
    if(["Utenti","GestioneMagazzino","ScorteZero","Backup","Orari","VenditeAdmin","Fatturazione","CatalogoBestek"].includes(currentCategory)) setCategory("Dashboard");
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
    await Promise.all([loadCloud(),loadCustomCatalog(),loadAdminCosts(),loadSalePrices(),loadStores()]);
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
  const isDashboard=category==="Dashboard", isSales=category==="Vendite", isAudit=category==="Cronologia", isUsers=category==="Utenti", isCatalog=category==="GestioneMagazzino", isZeroStock=category==="ScorteZero", isBackup=category==="Backup", isHours=category==="Orari", isDeviceSales=(category==="VenditeAdmin" || category==="Fatturazione"), isBestekCatalog=category==="CatalogoBestek";
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
  if(category==="Fatturazione"){
    setTimeout(()=>{
      const btn=document.querySelector('[data-work-tab="invoices"]');
      const panel=document.getElementById("adminInvoicesPanel");
      if(btn && panel?.hidden) btn.click();
    },0);
  }
  search.value=""; filter.value="all"; closeMainMenu();
  if(isDashboard) loadDashboard(); else if(isAudit) loadAudit(); else if(isSales) loadSales(); else if(isUsers) loadUsers(); else if(isCatalog) renderCatalogAdmin(); else if(isZeroStock) renderZeroStock(); else if(isBackup){} else if(isHours) loadHours(); else if(isDeviceSales) loadDeviceSales(); else if(isBestekCatalog) renderBestekCatalog(); else if(isCustom) renderCustomSection(); else if(category==="BackGlass"||category==="Housing") render();
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
  document.getElementById("saleItemLabel").innerHTML=`<strong>${escapeHtml(noLogoName(model,currentCategory))}</strong><span>${escapeHtml(color)} · ${currentCategory === "BackGlass" ? "Vetro posteriore · NO LOGO" : "Scocca completa · NO LOGO"}</span>`;
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
        return `<article class="saleRow archiveRow deliveredRow"><div class="saleMain"><strong>${escapeHtml(saleDisplayName(s))}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}${isNoLogoCategory(s.category)?" · NO LOGO":""}</span><b class="archiveBadge deliveredBadge">✓ CONSEGNATO</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Consegnato ${deliveredAt}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}</div><div class="saleNoteActions"><button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>${isAdmin()?`<button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button>`:""}</div></article>`;
      }
      const deleted=s.deleted_at?fmt.format(new Date(s.deleted_at)):"—";
      return `<article class="saleRow archiveRow deletedArchiveRow"><div class="saleMain"><strong>${escapeHtml(saleDisplayName(s))}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}${isNoLogoCategory(s.category)?" · NO LOGO":""}</span><b class="archiveBadge">ARCHIVIATA</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Eliminata ${deleted}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}${s.restored_to_inventory?`<span class="restoredBadge">↩ Rimesso in magazzino +${s.quantity}</span>`:""}</div><div class="archiveReason"><strong>Motivo:</strong> ${escapeHtml(s.delete_reason||"Nessun motivo registrato")}</div><div class="saleNoteActions"><button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>${isAdmin()?`<button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button>`:""}</div></article>`;
    }
    const ownSale=String(s.actor_user_id||"")===String(currentUser?.id||"");
    const commonActions=`${isAdmin()?`<button class="rowAction deliveredSale" type="button" data-id="${s.id}">✓ Consegnato</button>`:""}<button class="rowAction printSaleNote" type="button" data-id="${s.id}">Stampa DYMO</button><button class="rowAction exportSaleNote" type="button" data-id="${s.id}">Esporta nota</button>`;
    const actions=isAdmin()
      ? `<div class="saleActionsRow">${commonActions}<button class="rowAction editStore" type="button" data-id="${s.id}">Modifica negozio</button><button class="rowAction editSaleNote" type="button" data-id="${s.id}">Modifica nota / storico</button><button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button><button class="rowAction delete archiveSale" type="button" data-id="${s.id}">Elimina</button></div>`
      : ownSale ? `<div class="saleActionsRow">${commonActions}<button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button></div>` : `<div class="saleActionsRow">${commonActions}</div>`;
    return `<article class="saleRow"><div class="saleMain"><strong>${escapeHtml(saleDisplayName(s))}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}${isNoLogoCategory(s.category)?" · NO LOGO":""}</span>${s.operator_name?`<span class="operatorTag">Operatore: ${escapeHtml(s.operator_name)}</span>`:""}</div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · ${sold}</span>${price}${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}</div>${actions}</article>`;
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
function saleKeyFromSale(s){if(!s)return "";const raw=String(s.item_key||"");if(raw.startsWith("PRODUCT||"))return raw;return fixedCostKey(s.category,raw||(s.category==="Housing"?`Housing||${s.model}||${s.color}`:`${s.model}||${s.color}`));}
function saleUnitPrice(s){
  return effectiveSalePrice(saleKeyFromSale(s),s?.category,s?.model);
}
function saleUnitCost(s){if(!isAdmin())return null;const v=costValue(saleKeyFromSale(s));return v==null?null:v;}
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
    const row=groups.get(k)||{category:s.category,model:s.model,quantity:0,salesValue:0,costValue:0,pricedQty:0,costedQty:0};
    const qty=Number(s.quantity||0),unit=saleUnitPrice(s),cost=saleUnitCost(s);
    row.quantity+=qty;if(unit!=null){row.salesValue+=unit*qty;row.pricedQty+=qty;}if(cost!=null){row.costValue+=cost*qty;row.costedQty+=qty;}groups.set(k,row);
  });
  const rows=[...groups.values()].sort((a,b)=>String(a.category).localeCompare(String(b.category),"it")||compareModels(a.model,b.model));
  const totalQty=rows.reduce((n,r)=>n+r.quantity,0);
  const salesNet=valid.reduce((n,s)=>{const p=saleUnitPrice(s);return n+(p==null?0:p*Number(s.quantity||0));},0);
  const costNet=isAdmin()?valid.reduce((n,s)=>{const c=saleUnitCost(s);return n+(c==null?0:c*Number(s.quantity||0));},0):0;
  const vat=salesNet*.22,gross=salesNet+vat,margin=salesNet-costNet;
  const adminTotals=isAdmin()?`<div class="salesMoneySummary"><div><span>Costo totale</span><strong>${eur(costNet)}</strong><small>IVA esclusa</small></div><div><span>Vendita totale</span><strong>${eur(salesNet)}</strong><small>IVA esclusa</small></div><div><span>Margine lordo</span><strong>${eur(margin)}</strong><small>prima di altri costi</small></div><div class="grand"><span>Vendita IVA inclusa</span><strong>${eur(gross)}</strong></div></div>`:"";
  const top=`<section class="salesSummaryHero"><div><span class="summaryKicker">RIEPILOGO VENDUTO</span><h3>${totalQty} pezzi venduti</h3><p>Gli utenti standard vedono i prezzi di vendita. Costo totale e totali economici sono riservati all’Admin.</p></div>${adminTotals}</section>`;
  if(!rows.length){list.innerHTML=top+'<div class="emptyState">Nessuna vendita da riepilogare.</div>';return;}
  list.innerHTML=top+`<div class="modelSalesSummary">${rows.map(r=>{
    const unitAvg=r.pricedQty? r.salesValue/r.pricedQty:null;
    const unit=unitAvg==null?'<span class="summaryNoPrice">Prezzo non impostato</span>':`<span class="summaryUnitPrice">${eur(unitAvg)} + IVA <small>(${eur(unitAvg*1.22)})</small></span>`;
    const adminDetail=isAdmin()?`<span class="summaryModelTotal">Vendita: <b>${eur(r.salesValue)}</b>${r.costedQty?` · Costo: <b>${eur(r.costValue)}</b>`:" · Costo non completo"}</span>`:"";
    return `<article class="modelSaleSummaryRow"><div class="summaryModelInfo"><strong>${escapeHtml(noLogoName(r.model,r.category))}</strong><span>${escapeHtml(r.category)}${isNoLogoCategory(r.category)?" · NO LOGO":""}</span></div><div class="summaryPriceInfo">${unit}${adminDetail}</div><div class="summaryQty"><span>Venduti</span><strong>${r.quantity}</strong></div></article>`;
  }).join("")}</div>`;
}
function saleLabelHtml(s){ return `<strong>${escapeHtml(saleDisplayName(s))}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}${isNoLogoCategory(s.category)?" · NO LOGO":""} · ${escapeHtml(s.customer)}</span>`; }


function saleNoteText(s){ return (s?.operator_note||"").trim(); }
function prepareDymoLabel(s){
  const label=document.getElementById("dymoPrintLabel");
  const title=document.getElementById("dymoPrintTitle");
  const meta=document.getElementById("dymoPrintMeta");
  const note=document.getElementById("dymoPrintNote");
  const noteText=saleNoteText(s)||"Nessuna nota";
  title.textContent=saleDisplayName(s)||"Vendita";
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
  const text=`BEPARYTECH - NOTA VENDITA\nArticolo: ${saleDisplayName(s)}\nVariante: ${s.color}\nNegozio: ${s.customer}\nOperatore: ${s.operator_name||"—"}\nData: ${new Date(s.sold_at).toLocaleString("it-IT")}\n\nNOTA\n${saleNoteText(s)||"Nessuna nota"}\n`;
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
      const customKey=customCostKey(p.id);
      const customCategory=String(section?.name||"");
      const customPriceHtml=salePriceBadgeHtml(customKey,`${p.name} · ${p.variant||""}`,customCategory,p.name)+costBadgeHtml(customKey);
      card.innerHTML=`<div class="customProductTop"><div class="productVisual"><img class="productModelImage" src="${escapeHtml(imageForModel(p.name))}" alt="${escapeHtml(p.name)}"><span>${escapeHtml(p.name).charAt(0).toUpperCase()}</span></div><div class="customProductInfo"><strong>${escapeHtml(p.variant||p.name)}</strong><span>${escapeHtml(p.variant? p.name : (section?.name||""))}</span>${p.sku||p.barcode?`<small>${escapeHtml(p.sku||p.barcode)}</small>`:""}<b class="status ${cls}">${status}</b></div></div>${customPriceHtml}<div class="customProductBottom"><div class="customQty"><small>Giacenza</small><strong>${q}</strong></div><div class="customActions"><button class="minus customMinus animatedBtn" type="button" title="Scarica 1 dalla giacenza" ${q<=0?"disabled":""}>−1 Scarica</button>${isAdmin()?'<button class="plus customPlus animatedBtn" type="button">+1</button><button class="edit customEdit animatedBtn" type="button" title="Modifica prodotto">✎</button>':""}</div></div>`;
      const modelImg=card.querySelector(".productModelImage");modelImg.onerror=()=>{modelImg.hidden=true;modelImg.nextElementSibling.hidden=false};modelImg.onload=()=>{modelImg.nextElementSibling.hidden=true};
      card.querySelector(".customMinus").onclick=()=>openCustomSaleModal(p,section);
      const plus=card.querySelector(".customPlus"); if(plus)plus.onclick=()=>updateCustomProductQty(p,q+1);
      const edit=card.querySelector(".customEdit");if(edit)edit.onclick=()=>editCustomProduct(p);const priceNode=card.querySelector(".salePriceAdmin");if(priceNode)wireSalePriceBadge(priceNode,customKey,`${p.name} · ${p.variant||""}`,customCategory,p.name);const costNode=card.querySelector(".adminCostBadge");if(costNode)wireCostBadge(costNode,customKey,`${p.name} · ${p.variant||""}`);
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
  const admin=isAdmin();
  const startToday=new Date();startToday.setHours(0,0,0,0);
  const reqPromise=sb.from("beparytech_requests").select("id,item,quantity,status,requester_name,created_at").order("created_at",{ascending:false}).limit(500);
  const auditPromise=admin?sb.from("beparytech_audit_events").select("id,actor_name,event_type,title,details,created_at").order("created_at",{ascending:false}).limit(8):Promise.resolve({data:[]});
  const todayPromise=admin?sb.from("beparytech_audit_events").select("id",{count:"exact",head:true}).gte("created_at",startToday.toISOString()):Promise.resolve({count:0});
  const [reqRes,auditRes,todayRes]=await Promise.all([reqPromise,auditPromise,todayPromise]);
  const req=reqRes.data||[], audit=auditRes.data||[]; window.btRequests=req;
  const activeSectionIds=new Set(customSections.filter(s=>s.active!==false&&s.section_type==="inventory").map(s=>Number(s.id)));
  const inv=customProducts.filter(p=>p.active!==false&&activeSectionIds.has(Number(p.section_id))), total=inv.reduce((a,p)=>a+Number(p.quantity||0),0), low=inv.filter(p=>Number(p.quantity)>0&&Number(p.quantity)<=Number(p.low_stock_threshold||2)), empty=inv.filter(p=>Number(p.quantity)===0), openReq=req.filter(r=>r.status!=="consegnato"),todayCount=Number(todayRes.count||0);
  document.getElementById("totalPieces").textContent=total;document.getElementById("availableTypes").textContent=inv.filter(p=>Number(p.quantity)>0).length;document.getElementById("lowStock").textContent=low.length;
  const initials=(currentProfile?.username||"BT").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const di=document.getElementById("dashUserInitials"); if(di)di.textContent=initials||"BT";
  const dn=document.getElementById("dashUserName"); if(dn)dn.textContent=currentProfile?.username||"BeparyTech";
  const dr=document.getElementById("dashUserRole"); if(dr)dr.textContent=admin?"Amministratore":"Operatore";
  const adminStats=document.getElementById("adminStatsArea"), adminOps=document.getElementById("adminOperationalPanels"), standardNote=document.getElementById("standardDashboardNotice");
  if(adminStats)adminStats.hidden=!admin;if(adminOps)adminOps.hidden=!admin;if(standardNote)standardNote.hidden=admin;
  document.querySelectorAll(".adminQuick").forEach(x=>x.hidden=!admin);
  if(!admin)return;

  const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);
  const dateISO=monthStart.toISOString().slice(0,10);
  let partsRows=[],repairRows=[];
  try{
    const [partsRes,repairsRes]=await Promise.all([
      sb.from("beparytech_admin_device_sales").select("sold_at,sale_price,vat_amount").gte("sold_at",dateISO).limit(1000),
      sb.from("beparytech_admin_repairs").select("repaired_at,total_inc_vat,price_ex_vat,vat_amount,repair_status").gte("repaired_at",dateISO).limit(1000)
    ]);
    partsRows=partsRes.data||[];repairRows=repairsRes.data||[];
  }catch(_){ }
  const monthRevenue=partsRows.reduce((a,r)=>a+Number(r.sale_price||0)+Number(r.vat_amount||0),0)+repairRows.reduce((a,r)=>a+Number(r.total_inc_vat||0),0);
  const doneRepairs=repairRows.filter(r=>String(r.repair_status||"").toLowerCase().includes("ripar")||String(r.repair_status||"").toLowerCase().includes("complet")).length;
  document.getElementById("dashboardCards").innerHTML=`<div class="dashCard kpiBlue"><span>Prodotti in magazzino</span><strong>${total}</strong><small>${inv.length} articoli censiti</small></div><div class="dashCard kpiGreen"><span>Vendite questo mese</span><strong>${euroFmt.format(monthRevenue)}</strong><small>${partsRows.length} vendite ricambi</small></div><div class="dashCard kpiOrange"><span>Riparazioni effettuate</span><strong>${repairRows.length}</strong><small>${doneRepairs} completate nel mese</small></div><div class="dashCard kpiPurple"><span>Da controllare</span><strong>${low.length+empty.length}</strong><small>${empty.length} esauriti · ${low.length} bassi</small></div>`;
  document.getElementById("dashboardLowStock").innerHTML=[...empty,...low].slice(0,8).map(p=>{const sec=customSections.find(x=>Number(x.id)===Number(p.section_id));return `<button class="dashboardLine" data-section="${p.section_id}"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(sec?.name||"")} · ${escapeHtml(p.variant||"")}</small></span><b>${p.quantity} pz</b></button>`}).join("")||'<div class="emptyState">Nessuna scorta critica.</div>';
  document.getElementById("dashboardActivity").innerHTML=audit.map(e=>`<div class="dashboardLine"><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.actor_name||"Sistema")} · ${new Date(e.created_at).toLocaleString("it-IT")}</small></span></div>`).join("")||'<div class="emptyState">Nessuna attività.</div>';
  document.querySelectorAll(".dashboardLine[data-section]").forEach(b=>b.onclick=()=>setCategory(`custom:${b.dataset.section}`));

  const chart=document.getElementById("dashboardMiniChart");
  if(chart){
    const vals=[32,48,58,52,68,82]; const months=[]; for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(d.toLocaleDateString("it-IT",{month:"short"}).replace('.',''));}
    chart.innerHTML=`<div class="chartBars">${vals.map((v,i)=>`<div class="chartCol"><div class="chartBar h${Math.round(v/10)*10}"></div><small>${months[i]}</small></div>`).join("")}</div><div class="chartLegend"><span><i></i> Attività gestionale</span><b>${todayCount} oggi</b></div>`;
  }
  const mix=document.getElementById("dashboardCategoryMix");
  if(mix){
    const bg=Object.entries(MODEL_COLORS).flatMap(([m,cs])=>cs.map(c=>Number(stock[m+"||"+c]||0))).reduce((a,b)=>a+b,0);
    const hs=Object.entries(MODEL_COLORS).flatMap(([m,cs])=>cs.map(c=>Number(stock["Housing||"+m+"||"+c]||0))).reduce((a,b)=>a+b,0);
    const sum=Math.max(1,bg+hs), bp=Math.round(bg/sum*100),hp=100-bp;
    mix.innerHTML=`<div class="mixDonut"><div><strong>${bg+hs}</strong><small>pezzi</small></div></div><div class="mixLegend"><span><i class="bgDot"></i>BackGlass <b>${bp}%</b></span><span><i class="hsDot"></i>Housing <b>${hp}%</b></span><span><i class="reqDot"></i>Da ordinare <b>${openReq.length}</b></span></div>`;
  }
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
      else if(currentCategory==="Fatturazione") { try{ bindInvoiceAutomation(); }catch(_){} }
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
      const reg = await navigator.serviceWorker.register("./sw.js?v=92", { updateViaCache: "none" });
      await reg.update();
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!sessionStorage.getItem("bt-cache-reloaded-v92")) {
          sessionStorage.setItem("bt-cache-reloaded-v92", "1");
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
let adminRepairNewPhotos=[];
let adminRepairExistingPhotos=[];
let adminRepairSignatureData=null;

function btSafeFileName(name){return String(name||"foto").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-90);}
function renderAdminRepairPhotoPreview(){
 const box=document.getElementById("adminRepairPhotoPreview"); if(!box)return; box.innerHTML="";
 adminRepairExistingPhotos.forEach((path,i)=>{const d=document.createElement("div");d.className="repairPhotoThumb";d.dataset.path=path;d.innerHTML=`<div style="display:grid;place-items:center;height:100%;font-size:12px;padding:8px;text-align:center">Foto salvata ${i+1}</div><button type="button" title="Rimuovi">×</button>`;d.querySelector("button").onclick=()=>{adminRepairExistingPhotos=adminRepairExistingPhotos.filter(x=>x!==path);renderAdminRepairPhotoPreview();};box.appendChild(d);});
 adminRepairNewPhotos.forEach((file,i)=>{const d=document.createElement("div");d.className="repairPhotoThumb";const img=document.createElement("img");img.src=URL.createObjectURL(file);img.onload=()=>URL.revokeObjectURL(img.src);const b=document.createElement("button");b.type="button";b.textContent="×";b.title="Rimuovi";b.onclick=()=>{adminRepairNewPhotos.splice(i,1);renderAdminRepairPhotoPreview();};d.append(img,b);box.appendChild(d);});
}
async function uploadAdminRepairPhotos(ctx,practiceCode){
 const out=[...adminRepairExistingPhotos];
 for(let i=0;i<adminRepairNewPhotos.length;i++){const f=adminRepairNewPhotos[i];if(f.size>8*1024*1024)throw new Error(`La foto ${f.name} supera 8 MB.`);const ext=(f.name.split('.').pop()||'jpg').toLowerCase();const path=`${ctx.owner}/${practiceCode}/${Date.now()}-${i}-${btSafeFileName(f.name||('foto.'+ext))}`;const {error}=await sb.storage.from('repair-intake').upload(path,f,{cacheControl:'3600',upsert:false,contentType:f.type||'image/jpeg'});if(error)throw error;out.push(path);}
 return out.slice(0,6);
}
function initAdminRepairSignature(){
 const c=document.getElementById('adminRepairSignatureCanvas');if(!c||c.dataset.bound==='1')return;c.dataset.bound='1';const x=c.getContext('2d');x.lineWidth=3;x.lineCap='round';x.strokeStyle='#111827';let down=false;const pt=e=>{const r=c.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return {x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}};const start=e=>{down=true;const p=pt(e);x.beginPath();x.moveTo(p.x,p.y);e.preventDefault()};const move=e=>{if(!down)return;const p=pt(e);x.lineTo(p.x,p.y);x.stroke();adminRepairSignatureData=c.toDataURL('image/png');const st=document.getElementById('adminRepairSignatureState');if(st)st.textContent='Firma acquisita';e.preventDefault()};const end=()=>{down=false};c.addEventListener('pointerdown',start);c.addEventListener('pointermove',move);window.addEventListener('pointerup',end);document.getElementById('clearAdminRepairSignature')?.addEventListener('click',()=>{x.clearRect(0,0,c.width,c.height);adminRepairSignatureData=null;const st=document.getElementById('adminRepairSignatureState');if(st)st.textContent='Nessuna firma';});
}
function drawAdminRepairSignature(data){const c=document.getElementById('adminRepairSignatureCanvas');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);if(data){const im=new Image();im.onload=()=>x.drawImage(im,0,0,c.width,c.height);im.src=data;}const st=document.getElementById('adminRepairSignatureState');if(st)st.textContent=data?'Firma acquisita':'Nessuna firma';}
async function showAdminRepairPhotos(id){
 const r=adminRepairRows.find(x=>Number(x.id)===Number(id));const paths=Array.isArray(r?.photo_paths)?r.photo_paths:[];if(!paths.length){alert('Nessuna foto salvata per questa pratica.');return;}try{const urls=[];for(const path of paths){const {data,error}=await sb.storage.from('repair-intake').createSignedUrl(path,900);if(error)throw error;urls.push(data.signedUrl);}const w=window.open('','_blank');if(!w)throw new Error('Consenti l’apertura della finestra per vedere le foto.');w.document.write(`<title>Foto ${escapeHtml(r.practice_code||'pratica')}</title><style>body{font-family:Arial;background:#101827;color:white;margin:0;padding:20px}h2{margin-top:0}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.g img{width:100%;border-radius:14px;background:white}</style><h2>Foto accettazione · ${escapeHtml(r.practice_code||'')}</h2><div class="g">${urls.map(u=>`<img src="${u}">`).join('')}</div>`);w.document.close();}catch(e){alert(e.message||'Impossibile aprire le foto.');}
}

async function generateAdminRepairReceipt(id){
 const r=adminRepairRows.find(x=>Number(x.id)===Number(id));if(!r)return;try{if(!window.jspdf?.jsPDF)throw new Error('Modulo PDF non disponibile.');const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const code=r.practice_code||('RIP-'+r.id);const qrText=`${location.origin}${location.pathname}?practice=${encodeURIComponent(code)}`;let qr=null;try{qr=await btMakeQrDataUrl(qrText,260);}catch(_){qr=null;}doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('BeparyTech Manager',18,20);doc.setFontSize(13);doc.text('Ricevuta presa in carico / riparazione',18,29);if(qr)doc.addImage(qr,'PNG',164,14,28,28);doc.setFontSize(10);doc.setFont('helvetica','normal');let y=43;const line=(a,b)=>{doc.setFont('helvetica','bold');doc.text(a,18,y);doc.setFont('helvetica','normal');const vals=doc.splitTextToSize(String(b||'-'),125);doc.text(vals,62,y);y+=Math.max(7,vals.length*5);};line('Pratica',code);line('Data',r.repaired_at?new Date(r.repaired_at+'T12:00:00').toLocaleDateString('it-IT'):'-');line('Cliente',r.client_name);line('Telefono',r.customer_phone);line('Email',r.customer_email);line('Dispositivo',r.device);line('IMEI / Seriale',r.imei_serial);line('Difetto dichiarato',r.reported_issue);line('Stato estetico',r.device_condition);line('Accessori',r.accessories);line('Intervento',r.repair_type);line('Stato pratica',r.repair_status);line('Preventivo',`${r.quote_status||'-'}${r.quote_amount!=null?' · '+euroFmt.format(Number(r.quote_amount)):''}`);line('Foto accettazione',`${Array.isArray(r.photo_paths)?r.photo_paths.length:0} foto archiviate`);if(r.warranty_until)line('Garanzia fino al',new Date(r.warranty_until+'T12:00:00').toLocaleDateString('it-IT'));y+=3;doc.setDrawColor(200);doc.line(18,y,192,y);y+=8;doc.setFontSize(9);doc.text(doc.splitTextToSize('Il cliente conferma i dati di presa in carico, lo stato estetico e gli accessori sopra indicati. Eventuali lavorazioni restano soggette al preventivo e alle condizioni concordate.',174),18,y);y+=18;if(r.signature_data){try{doc.addImage(r.signature_data,'PNG',18,y,70,20);doc.setFontSize(8);doc.text('Firma cliente',18,y+25);if(r.signed_at)doc.text('Firmato: '+new Date(r.signed_at).toLocaleString('it-IT'),18,y+30);}catch(e){}}doc.setFontSize(8);doc.text(`QR pratica: ${qrText}`,18,286);doc.save(`Ricevuta_${code}.pdf`);
 }catch(e){alert(e.message||'Impossibile generare la ricevuta PDF.');}
}

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
  ["adminRepairStore","adminRepairClient","adminRepairCustomClient","adminRepairDevice","adminRepairType","adminRepairPrice","adminRepairNote","adminRepairEShareRef","adminRepairImei","adminRepairPartCost","adminRepairPracticeCode","adminRepairCustomerPhone","adminRepairCustomerEmail","adminRepairReportedIssue","adminRepairDeviceCondition","adminRepairAccessories","adminRepairQuoteAmount"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  const st=document.getElementById("adminRepairStatus");if(st)st.value="Da riparare";const qs=document.getElementById("adminRepairQuoteStatus");if(qs)qs.value="Da diagnosticare";const wm=document.getElementById("adminRepairWarrantyMonths");if(wm)wm.value="3";const inv=document.getElementById("adminRepairInvoiced");if(inv)inv.value="false";const cc=document.getElementById("adminRepairCustomClient");if(cc)cc.disabled=true;
  const vat=document.getElementById("adminRepairVatRate"); if(vat)vat.value="22";
  adminRepairNewPhotos=[];adminRepairExistingPhotos=[];adminRepairSignatureData=null;renderAdminRepairPhotoPreview();drawAdminRepairSignature(null);const pc=document.getElementById("adminRepairPhotos");if(pc)pc.value="";const consent=document.getElementById("adminRepairSignatureConsent");if(consent)consent.checked=false;
  updateAdminRepairVatPreview();
}

function startAdminRepairEdit(id){
  const r=adminRepairRows.find(x=>Number(x.id)===Number(id)); if(!r)return;
  adminRepairEditingId=Number(r.id);
  const form=document.getElementById("adminRepairForm"); if(form)form.dataset.editing="1";
  document.getElementById("adminRepairDate").value=r.repaired_at||"";
  document.getElementById("adminRepairStore").value=r.store||"";
  const knownClient=["RIPARALO S.R.L.","VR Trasporti"].includes(r.client_name);document.getElementById("adminRepairClient").value=knownClient?r.client_name:"ALTRO";document.getElementById("adminRepairCustomClient").disabled=knownClient;document.getElementById("adminRepairCustomClient").value=knownClient?"":(r.client_name||"");
  document.getElementById("adminRepairDevice").value=r.device||"";
  document.getElementById("adminRepairType").value=r.repair_type||"";
  document.getElementById("adminRepairPrice").value=Number(r.price_ex_vat||0);
  document.getElementById("adminRepairVatRate").value=Number(r.vat_rate??22);
  document.getElementById("adminRepairImei").value=r.imei_serial||"";document.getElementById("adminRepairPartCost").value=r.part_cost==null?"":Number(r.part_cost);document.getElementById("adminRepairStatus").value=r.repair_status||"Riparato";document.getElementById("adminRepairInvoiced").value=r.invoiced?"true":"false";document.getElementById("adminRepairPracticeCode").value=r.practice_code||"";document.getElementById("adminRepairCustomerPhone").value=r.customer_phone||"";document.getElementById("adminRepairCustomerEmail").value=r.customer_email||"";document.getElementById("adminRepairReportedIssue").value=r.reported_issue||"";document.getElementById("adminRepairDeviceCondition").value=r.device_condition||"";document.getElementById("adminRepairAccessories").value=r.accessories||"";document.getElementById("adminRepairQuoteStatus").value=r.quote_status||"Da diagnosticare";document.getElementById("adminRepairQuoteAmount").value=r.quote_amount==null?"":Number(r.quote_amount);document.getElementById("adminRepairWarrantyMonths").value=String(r.warranty_months??3);
  const repairNote=r.note||""; const em=repairNote.match(/^Rif\. e-Share:\s*([^·]+?)(?:\s*·\s*(.*))?$/);
  document.getElementById("adminRepairEShareRef").value=em?em[1].trim():"";
  document.getElementById("adminRepairNote").value=em?(em[2]||"").trim():repairNote;
  adminRepairExistingPhotos=Array.isArray(r.photo_paths)?[...r.photo_paths]:[];adminRepairNewPhotos=[];renderAdminRepairPhotoPreview();adminRepairSignatureData=r.signature_data||null;drawAdminRepairSignature(adminRepairSignatureData);const consent=document.getElementById("adminRepairSignatureConsent");if(consent)consent.checked=!!r.signature_data;
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
    list.innerHTML=rows.length?rows.map(r=>`<article class="deviceAdminSaleRow businessRepairRow"><div class="deviceAdminSaleTop"><div>${r.practice_code?`<span class="practiceCodeBadge">${escapeHtml(r.practice_code)}</span>`:""}<strong>${escapeHtml(r.device)}</strong><span>${escapeHtml(r.repair_type)} · ${escapeHtml(r.client_name||r.store||"Cliente")} · ${new Date(r.repaired_at+"T12:00:00").toLocaleDateString("it-IT")}</span><div class="repairBadges"><span class="repairStatusBadge">${escapeHtml(r.repair_status||"Riparato")}</span><span class="repairInvoiceBadge ${r.invoiced?"done":"pending"}">${r.invoiced?"Fatturato":"Da fatturare"}</span></div>${r.imei_serial?`<small>IMEI/Seriale: ${escapeHtml(r.imei_serial)}</small>`:""}${r.reported_issue?`<small>Difetto: ${escapeHtml(r.reported_issue)}</small>`:""}<div class="repairBadges">${r.quote_status?`<span class="quoteBadge">${escapeHtml(r.quote_status)}</span>`:""}${r.warranty_until?`<span class="warrantyBadge">Garanzia fino al ${new Date(r.warranty_until+"T12:00:00").toLocaleDateString("it-IT")}</span>`:""}</div>${r.note?`<small>${escapeHtml(r.note)}</small>`:""}</div><div class="deviceAdminSalePrice"><strong>${euroFmt.format(Number(r.total_inc_vat||0))}</strong><span>IVA ${Number(r.vat_rate||0).toLocaleString("it-IT")}% · ${euroFmt.format(Number(r.vat_amount||0))}</span></div></div><div class="deviceAdminSaleMeta"><span>Imponibile ${euroFmt.format(Number(r.price_ex_vat||0))}</span>${r.part_cost!=null?`<span class="adminCostMeta">Costo ricambio ${euroFmt.format(Number(r.part_cost||0))}</span>`:""}${r.store?`<span>Sede: ${escapeHtml(r.store)}</span>`:""}${Array.isArray(r.photo_paths)&&r.photo_paths.length?`<span class="photoCountBadge">📷 ${r.photo_paths.length} foto</span>`:""}${r.signature_data?`<span class="photoCountBadge">✍️ Firmata</span>`:""}</div><div class="deviceAdminSaleActions repairRowActions">${Array.isArray(r.photo_paths)&&r.photo_paths.length?`<button class="rowAction viewAdminRepairPhotos" data-id="${r.id}" type="button">Foto (${r.photo_paths.length})</button>`:""}${r.repair_status==="Da completare"?`<button class="rowAction completeAdminRepair" data-id="${r.id}" type="button">Completa pratica</button>`:""}<button class="rowAction printRepairDymo" data-id="${r.id}" type="button">Stampa DYMO</button><button class="rowAction receiptBtn receiptAdminRepair" data-id="${r.id}" type="button">Ricevuta PDF + QR</button><button class="rowAction editAdminRepair" data-id="${r.id}" type="button">Modifica</button><button class="rowAction delete deleteAdminRepair" data-id="${r.id}" type="button">Elimina</button></div></article>`).join(""):'<div class="emptyState">Nessuna riparazione registrata</div>';
    list.querySelectorAll(".viewAdminRepairPhotos").forEach(b=>b.onclick=()=>showAdminRepairPhotos(Number(b.dataset.id)));
    list.querySelectorAll(".completeAdminRepair").forEach(b=>b.onclick=()=>completeAdminRepairV92(Number(b.dataset.id)));
    list.querySelectorAll(".printRepairDymo").forEach(b=>b.onclick=()=>printRepairDymoV92(Number(b.dataset.id)));
    list.querySelectorAll(".receiptAdminRepair").forEach(b=>b.onclick=()=>generateAdminRepairReceipt(Number(b.dataset.id)));
    list.querySelectorAll(".editAdminRepair").forEach(b=>b.onclick=()=>startAdminRepairEdit(Number(b.dataset.id)));
    list.querySelectorAll(".deleteAdminRepair").forEach(b=>b.onclick=()=>deleteAdminRepair(Number(b.dataset.id)));
  }catch(e){list.innerHTML=`<div class="emptyState">${escapeHtml(e.message||"Errore caricamento")}</div>`;}
}
function bindAdminRepairs(){
 const form=document.getElementById("adminRepairForm"); if(!form||form.dataset.bound==="1")return; form.dataset.bound="1";
 initAdminRepairSignature();const photoInput=document.getElementById("adminRepairPhotos");if(photoInput&&photoInput.dataset.bound!=="1"){photoInput.dataset.bound="1";photoInput.addEventListener("change",()=>{const picked=[...photoInput.files].filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type));adminRepairNewPhotos=[...adminRepairNewPhotos,...picked].slice(0,Math.max(0,6-adminRepairExistingPhotos.length));renderAdminRepairPhotoPreview();photoInput.value="";});}
 const d=document.getElementById("adminRepairDate"); if(d&&!d.value)d.value=new Date().toISOString().slice(0,10);const pp=document.getElementById("adminRepairPracticePreview");const refreshPractice=()=>{if(pp)pp.textContent=`RIP-${(d?.value||new Date().toISOString().slice(0,10)).replaceAll("-","")}-AUTO`;};d?.addEventListener("change",refreshPractice);refreshPractice();
 document.getElementById("adminRepairPrice")?.addEventListener("input",updateAdminRepairVatPreview);
 document.getElementById("adminRepairVatRate")?.addEventListener("input",updateAdminRepairVatPreview);
 document.getElementById("refreshAdminRepairsBtn")?.addEventListener("click",loadAdminRepairs);
 const clientSel=document.getElementById("adminRepairClient"),customClient=document.getElementById("adminRepairCustomClient");clientSel?.addEventListener("change",()=>{if(customClient){customClient.disabled=clientSel.value!=="ALTRO";if(clientSel.value==="VR Trasporti"){document.getElementById("adminRepairStore").value="VR Trasporti";}else if(clientSel.value!=="ALTRO"&&customClient)customClient.value="";}});
 document.getElementById("adminRepairCancelEdit")?.addEventListener("click",()=>{resetAdminRepairEditor();const msg=document.getElementById("adminRepairMsg");if(msg)msg.textContent="Modifica annullata.";});
 form.addEventListener("submit",async ev=>{
   ev.preventDefault(); const msg=document.getElementById("adminRepairMsg"); if(msg){msg.className="createUserMsg";msg.textContent=adminRepairEditingId?"Salvataggio modifiche…":"Salvataggio…";}
   try{
    const ctx=await btGetWorkspaceOwnerId();
    const clientChoice=document.getElementById("adminRepairClient").value;const clientName=clientChoice==="ALTRO"?document.getElementById("adminRepairCustomClient").value.trim():clientChoice;if(!clientName)throw new Error("Seleziona o inserisci il cliente.");const repairDate=document.getElementById("adminRepairDate").value;const warrantyMonths=Number(document.getElementById("adminRepairWarrantyMonths").value||0);let warrantyUntil=null;if(warrantyMonths&&repairDate){const wd=new Date(repairDate+"T12:00:00");wd.setMonth(wd.getMonth()+warrantyMonths);warrantyUntil=wd.toISOString().slice(0,10);}const autoCode=`RIP-${repairDate.replaceAll("-","")}-${String(Date.now()).slice(-5)}`;const practiceCode=document.getElementById("adminRepairPracticeCode").value.trim()||autoCode;if(adminRepairSignatureData&&!document.getElementById("adminRepairSignatureConsent").checked)throw new Error("Spunta la conferma del cliente prima di salvare la firma.");const photoPaths=await uploadAdminRepairPhotos(ctx,practiceCode);const payload={repaired_at:repairDate,practice_code:practiceCode,photo_paths:photoPaths,signature_data:adminRepairSignatureData||null,signed_at:adminRepairSignatureData?new Date().toISOString():null,receipt_token:practiceCode,client_name:clientName,customer_phone:document.getElementById("adminRepairCustomerPhone").value.trim()||null,customer_email:document.getElementById("adminRepairCustomerEmail").value.trim()||null,store:document.getElementById("adminRepairStore").value||clientName,device:document.getElementById("adminRepairDevice").value.trim(),reported_issue:document.getElementById("adminRepairReportedIssue").value.trim(),device_condition:document.getElementById("adminRepairDeviceCondition").value.trim()||null,accessories:document.getElementById("adminRepairAccessories").value.trim()||null,repair_type:document.getElementById("adminRepairType").value.trim(),imei_serial:document.getElementById("adminRepairImei").value.trim()||null,part_cost:document.getElementById("adminRepairPartCost").value===""?null:Number(document.getElementById("adminRepairPartCost").value),repair_status:document.getElementById("adminRepairStatus").value,quote_status:document.getElementById("adminRepairQuoteStatus").value,quote_amount:document.getElementById("adminRepairQuoteAmount").value===""?null:Number(document.getElementById("adminRepairQuoteAmount").value),warranty_months:warrantyMonths,warranty_until:warrantyUntil,invoiced:document.getElementById("adminRepairInvoiced").value==="true",price_ex_vat:Number(document.getElementById("adminRepairPrice").value||0),vat_rate:Number(document.getElementById("adminRepairVatRate").value||22),note:(()=>{const r=document.getElementById("adminRepairEShareRef").value.trim();const n=document.getElementById("adminRepairNote").value.trim();return `${r?`Rif. e-Share: ${r}${n?` · `:""}`:""}${n}`||null;})()};
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
 const rs=document.getElementById("adminRepairSearch"); if(rs&&rs.dataset.bound!=="1"){rs.dataset.bound="1";rs.addEventListener("input",()=>{const q=rs.value.trim().toLowerCase();document.querySelectorAll("#adminRepairsList .businessRepairRow").forEach(row=>{row.hidden=q&&!row.textContent.toLowerCase().includes(q);});});}
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
  const invoices=document.getElementById("adminInvoicesPanel");
  let current=null;

  function show(panel){
    // Se tocchi il pulsante già aperto, richiude tutto.
    current=current===panel?null:panel;
    if(sales) sales.hidden=current!=="sales";
    if(repairs) repairs.hidden=current!=="repairs";
    if(invoices) invoices.hidden=current!=="invoices";
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
    }else if(current==="invoices"){
      try{ bindInvoiceAutomation(); }catch(_){}
    }
  }
  buttons.forEach(btn=>btn.addEventListener("click",()=>show(btn.dataset.workTab)));
  // All'apertura della pagina nessuna finestra è già aperta.
  if(sales) sales.hidden=true;
  if(repairs) repairs.hidden=true;
  if(invoices) invoices.hidden=true;
  buttons.forEach(btn=>{btn.classList.remove("active");btn.setAttribute("aria-selected","false");btn.setAttribute("aria-expanded","false");});
}
document.addEventListener("DOMContentLoaded",bindAdminWorkTabs);
setInterval(bindAdminWorkTabs,1500);



// ===== v85: Fatturazione clienti aziendali Riparalo / VR Trasporti -> XML Aruba =====
const RIPARALO_INVOICE_CLIENT={
  name:"RIPARALO S.R.L.", vat:"01787740339", taxCode:"01787740339",
  address:"VIA ANTONIO EMMANUELI, 7", zip:"29121", city:"PIACENZA", province:"PC", country:"IT", recipientCode:"KRRH6B9"
};
const RIPARALO_STORES=["RPL Piacenza","RPL Manerbio","MELA Piacenza","MELA Lime Store","MELA Repubblica","MELA Emilia Est"];
let invoiceAutomationLines=[];
function invoiceIsTargetStore(v){return RIPARALO_STORES.includes(String(v||"").trim());}
function xmlEsc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function csvEsc(v){const x=String(v??"");return /[;"\n\r]/.test(x)?`"${x.replace(/"/g,'""')}"`:x;}
function localDateISO(d=new Date()){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10);}
function invoiceClientMode(){return document.getElementById("invoiceClientSelect")?.value||"riparalo";}
function defaultInvoicePeriod(){
  const now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),1),last=new Date(now.getFullYear(),now.getMonth()+1,0);
  const from=document.getElementById("invoiceFrom"),to=document.getElementById("invoiceTo"),date=document.getElementById("invoiceDate");
  if(from&&!from.value)from.value=localDateISO(first);if(to&&!to.value)to.value=localDateISO(last);if(date&&!date.value)date.value=localDateISO(now);
}
function loadIssuerSettings(){
  try{const x=JSON.parse(localStorage.getItem("beparytech-invoice-issuer")||"{}");const map={issuerName:x.name,issuerVat:x.vat,issuerTaxCode:x.taxCode,issuerAddress:x.address,issuerZip:x.zip,issuerCity:x.city,issuerProvince:x.province,issuerRegime:x.regime};Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el&&v)el.value=v;});}catch(_){}
}
function readIssuer(){const get=id=>String(document.getElementById(id)?.value||"").trim();return {name:get("issuerName"),vat:get("issuerVat").replace(/^IT/i,"").replace(/\D/g,""),taxCode:get("issuerTaxCode").toUpperCase(),address:get("issuerAddress"),zip:get("issuerZip"),city:get("issuerCity"),province:get("issuerProvince").toUpperCase(),regime:get("issuerRegime")||"RF01"};}
function validateIssuer(x){if(!x.name||!x.vat||!x.address||!x.zip||!x.city||!x.province)return "Completa tutti i dati emittente obbligatori.";if(!/^\d{11}$/.test(x.vat))return "La Partita IVA dell’emittente deve avere 11 cifre.";if(!/^\d{5}$/.test(x.zip))return "Il CAP dell’emittente deve avere 5 cifre.";if(!/^[A-Z]{2}$/.test(x.province))return "Inserisci la provincia con 2 lettere, ad esempio PC.";return "";}
function saveIssuerSettings(){const msg=document.getElementById("issuerMsg"),x=readIssuer(),err=validateIssuer(x);if(msg){msg.className=`createUserMsg ${err?"error":"ok"}`;msg.textContent=err||"Dati emittente salvati su questo dispositivo.";}if(err)return false;try{localStorage.setItem("beparytech-invoice-issuer",JSON.stringify(x));}catch(_){}return true;}
function readVrClient(){const get=id=>String(document.getElementById(id)?.value||"").trim();return {name:get("vrClientName")||"VR Trasporti",vat:get("vrClientVat").replace(/^IT/i,"").replace(/\D/g,""),taxCode:get("vrClientTaxCode").toUpperCase(),recipientCode:get("vrClientRecipient").toUpperCase(),address:get("vrClientAddress"),zip:get("vrClientZip"),city:get("vrClientCity"),province:get("vrClientProvince").toUpperCase(),country:"IT"};}
function validateVrClient(x){if(!x.name||!x.vat||!x.recipientCode||!x.address||!x.zip||!x.city||!x.province)return "Completa i dati fiscali di VR Trasporti.";if(!/^\d{11}$/.test(x.vat))return "La Partita IVA di VR Trasporti deve avere 11 cifre.";if(!/^[A-Z0-9]{7}$/.test(x.recipientCode))return "Il codice destinatario deve avere 7 caratteri.";if(!/^\d{5}$/.test(x.zip))return "Il CAP deve avere 5 cifre.";if(!/^[A-Z]{2}$/.test(x.province))return "La provincia deve avere 2 lettere.";return "";}
function saveVrClientSettings(){const x=readVrClient(),err=validateVrClient(x),msg=document.getElementById("vrClientMsg");if(msg){msg.className=`createUserMsg ${err?"error":"ok"}`;msg.textContent=err||"Dati VR Trasporti salvati su questo dispositivo.";}if(err)return false;try{localStorage.setItem("beparytech-invoice-vr-client",JSON.stringify(x));}catch(_){}updateInvoiceClientUi();return true;}
function loadVrClientSettings(){try{const x=JSON.parse(localStorage.getItem("beparytech-invoice-vr-client")||"{}");const map={vrClientName:x.name,vrClientVat:x.vat,vrClientTaxCode:x.taxCode,vrClientRecipient:x.recipientCode,vrClientAddress:x.address,vrClientZip:x.zip,vrClientCity:x.city,vrClientProvince:x.province};Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el&&v)el.value=v;});}catch(_){} }
function currentInvoiceClient(){return invoiceClientMode()==="vr"?readVrClient():RIPARALO_INVOICE_CLIENT;}
function updateInvoiceClientUi(){
  const vr=invoiceClientMode()==="vr",card=document.getElementById("vrInvoiceDataCard"),title=document.getElementById("invoiceClientTitle"),sub=document.getElementById("invoiceClientSubtitle"),prev=document.getElementById("invoicePreviewSubtitle"),hours=document.querySelector(".invoiceServiceBox");
  if(card)card.hidden=!vr;if(title)title.textContent=vr?(readVrClient().name||"VR Trasporti"):RIPARALO_INVOICE_CLIENT.name;if(sub)sub.textContent=vr?"Riparazioni telefoni · fatturazione cumulativa":"Via Antonio Emmanueli, 7 · 29121 Piacenza (PC) · IT";if(prev)prev.textContent=vr?"Mostra le riparazioni VR Trasporti non ancora fatturate nel periodo selezionato.":"RPL e tutti i punti MELA vengono fatturati a Riparalo S.r.l.";if(hours)hours.hidden=vr;
  ["invoiceIncludeStock","invoiceIncludeParts","invoiceIncludeHours"].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=vr;if(vr)el.checked=false;else if(id!=="invoiceIncludeHours"||el.checked===false)el.checked=true;}});const rep=document.getElementById("invoiceIncludeRepairs");if(rep){rep.disabled=false;rep.checked=true;}
  invoiceAutomationLines=[];renderInvoicePreview();
}
function invoiceLineDate(v){return String(v||"").slice(0,10);}
async function buildBusinessInvoicePreview(){
  if(!isAdmin())return;const msg=document.getElementById("invoiceLoadMsg"),from=document.getElementById("invoiceFrom")?.value,to=document.getElementById("invoiceTo")?.value,mode=invoiceClientMode();
  if(!from||!to||from>to){if(msg){msg.className="createUserMsg error";msg.textContent="Controlla il periodo: la data iniziale deve essere precedente a quella finale.";}return;}
  if(msg){msg.className="createUserMsg";msg.textContent="Caricamento voci da fatturare…";}
  try{
    const lines=[];
    if(mode==="vr"){
      const {data,error}=await sb.from("beparytech_admin_repairs").select("id,repaired_at,client_name,store,device,repair_type,imei_serial,price_ex_vat,vat_rate,note,invoiced,repair_status").gte("repaired_at",from).lte("repaired_at",to).eq("client_name","VR Trasporti").eq("invoiced",false).order("repaired_at",{ascending:true}).limit(1000);if(error)throw error;
      (data||[]).forEach(r=>lines.push({selected:true,date:invoiceLineDate(r.repaired_at),store:"VR Trasporti",source:"Riparazione",description:`${r.repair_type||"Riparazione"} · ${r.device||"dispositivo"}${r.imei_serial?` · IMEI/Seriale ${r.imei_serial}`:""}`,qty:1,unitNet:Number(r.price_ex_vat||0),vatRate:Number(r.vat_rate??22),ref:`RIP-${r.id}`,repairId:Number(r.id)}));
    }else{
      const includeStock=document.getElementById("invoiceIncludeStock")?.checked,includeParts=document.getElementById("invoiceIncludeParts")?.checked,includeRepairs=document.getElementById("invoiceIncludeRepairs")?.checked,includeHours=document.getElementById("invoiceIncludeHours")?.checked;
      const jobs=[];jobs.push(includeStock?sb.from("beparytech_sales").select("id,customer,category,item_key,model,color,quantity,sold_at,is_archived,restored_to_inventory,delivered_at,delete_reason").gte("sold_at",from).lte("sold_at",to).limit(2000):Promise.resolve({data:[],error:null}));jobs.push(includeParts?sb.from("beparytech_admin_device_sales").select("id,sold_at,store,device_name,sale_price,net_amount,vat_rate,vat_amount,note").gte("sold_at",from).lte("sold_at",to).limit(1000):Promise.resolve({data:[],error:null}));jobs.push(includeRepairs?sb.from("beparytech_admin_repairs").select("id,repaired_at,client_name,store,device,repair_type,price_ex_vat,vat_rate,note,invoiced").gte("repaired_at",from).lte("repaired_at",to).limit(1000):Promise.resolve({data:[],error:null}));jobs.push(includeHours?sb.from("beparytech_work_hours").select("id,work_date,morning_in,morning_out,afternoon_in,afternoon_out,company,total_minutes_override,note").gte("work_date",from).lte("work_date",to).limit(1000):Promise.resolve({data:[],error:null}));jobs.push(includeHours?sb.from("beparytech_work_extras").select("id,work_date,description,minutes,amount,company,note").gte("work_date",from).lte("work_date",to).limit(1000):Promise.resolve({data:[],error:null}));
      const [stockRes,partsRes,repairsRes,hoursRes,extrasRes]=await Promise.all(jobs),firstErr=stockRes.error||partsRes.error||repairsRes.error||hoursRes.error||extrasRes.error;if(firstErr)throw firstErr;
      (stockRes.data||[]).filter(r=>invoiceIsTargetStore(r.customer)&&saleCountsAsSold(r)).forEach(r=>{const unit=saleUnitPrice(r);if(unit==null)return;lines.push({selected:true,date:invoiceLineDate(r.sold_at),store:r.customer,source:"Magazzino",description:`${r.category||"Ricambio"} ${noLogoName(r.model,r.category)}${r.color?` · ${r.color}`:""}`.trim(),qty:Math.max(1,Number(r.quantity||1)),unitNet:Number(unit),vatRate:22,ref:`MAG-${r.id}`});});
      (partsRes.data||[]).filter(r=>invoiceIsTargetStore(r.store)).forEach(r=>lines.push({selected:true,date:invoiceLineDate(r.sold_at),store:r.store,source:"Vendita ricambio",description:r.device_name||"Ricambio elettronico",qty:1,unitNet:Number(r.net_amount??r.sale_price??0),vatRate:Number(r.vat_rate??22),ref:`RIC-${r.id}`}));
      (repairsRes.data||[]).filter(r=>invoiceIsTargetStore(r.store)||r.client_name==="RIPARALO S.R.L.").forEach(r=>{const note=String(r.note||""),m=note.match(/Rif\. e-Share:\s*([^·]+)/i);lines.push({selected:true,date:invoiceLineDate(r.repaired_at),store:r.store||"RIPARALO S.R.L.",source:"Riparazione",description:`Riparazione ${r.device||"dispositivo"} · ${r.repair_type||"lavorazione"}${m?` · Rif. e-Share ${m[1].trim()}`:""}`,qty:1,unitNet:Number(r.price_ex_vat||0),vatRate:Number(r.vat_rate??22),ref:`RIP-${r.id}`,repairId:Number(r.id)});});
      if(includeHours){const ripHours=(hoursRes.data||[]).filter(r=>companyBucket(r.company)==="riparalo"),ripExtras=(extrasRes.data||[]).filter(r=>companyBucket(r.company)==="riparalo"),normalMinutes=ripHours.reduce((a,r)=>a+workedMinutes(r),0),extraMinutes=ripExtras.reduce((a,r)=>a+Number(r.minutes||0),0),rate=Math.max(0,Number(document.getElementById("invoiceHourlyRate")?.value)||20),merge=document.getElementById("invoiceMergeHours")?.checked!==false,periodLabel=`${new Date(from+"T12:00:00").toLocaleDateString("it-IT")} - ${new Date(to+"T12:00:00").toLocaleDateString("it-IT")}`,pushHours=(mins,desc,src,ref)=>{if(mins>0)lines.push({selected:true,date:to,store:"RIPARALO S.R.L.",source:src,description:`${desc} · ${periodLabel}`,qty:Number((mins/60).toFixed(2)),unitNet:rate,vatRate:22,ref});};if(merge)pushHours(normalMinutes+extraMinutes,"Servizio di assistenza tecnica","Assistenza","ORE-RIPARALO");else{pushHours(normalMinutes,"Servizio di assistenza tecnica","Ore normali","ORE-NORMALI");pushHours(extraMinutes,"Servizio di assistenza tecnica · ore extra","Ore extra","ORE-EXTRA");}const info=document.getElementById("invoiceHoursInfo");if(info)info.textContent=`Riparalo: ${fmtMinutes(normalMinutes)} normali + ${fmtMinutes(extraMinutes)} extra = ${fmtMinutes(normalMinutes+extraMinutes)} · ${euroFmt.format(rate)}/ora + IVA`;}
    }
    lines.sort((a,b)=>a.date.localeCompare(b.date)||a.store.localeCompare(b.store,"it"));invoiceAutomationLines=lines;renderInvoicePreview();if(msg){msg.className="createUserMsg ok";msg.textContent=lines.length?`${lines.length} voci trovate per ${mode==="vr"?"VR Trasporti":"Riparalo / MELA"}.`:"Nessuna voce da fatturare nel periodo selezionato.";}
  }catch(e){invoiceAutomationLines=[];renderInvoicePreview();if(msg){msg.className="createUserMsg error";msg.textContent=e.message||"Impossibile creare l’anteprima.";}}
}
function selectedInvoiceLines(){return invoiceAutomationLines.filter(r=>r.selected!==false);}
function renderInvoicePreview(){
  const lines=selectedInvoiceLines(),box=document.getElementById("invoiceLines"),sum=document.getElementById("invoiceSummary"),net=lines.reduce((a,r)=>a+r.unitNet*r.qty,0),vat=lines.reduce((a,r)=>a+(r.unitNet*r.qty*r.vatRate/100),0),gross=net+vat;if(sum)sum.innerHTML=`<div><span>Righe</span><strong>${lines.length}</strong></div><div><span>Imponibile</span><strong>${euroFmt.format(net)}</strong></div><div><span>IVA</span><strong>${euroFmt.format(vat)}</strong></div><div><span>Totale</span><strong>${euroFmt.format(gross)}</strong></div>`;
  if(box)box.innerHTML=invoiceAutomationLines.length?invoiceAutomationLines.map((r,i)=>`<article class="invoiceLine ${r.selected===false?"invoiceLineExcluded":""}"><label class="invoiceLinePick"><input type="checkbox" class="invoiceLineCheck" data-index="${i}" ${r.selected===false?"":"checked"}><span></span></label><div class="invoiceLineNo">${i+1}</div><div class="invoiceLineMain"><strong>${escapeHtml(r.description)}</strong><span>${escapeHtml(r.store)} · ${new Date(r.date+"T12:00:00").toLocaleDateString("it-IT")} · ${escapeHtml(r.source)}</span></div><div class="invoiceLineMoney"><strong>${euroFmt.format(r.unitNet*r.qty)}</strong><span>${r.qty>1?`${r.qty} × ${euroFmt.format(r.unitNet)} · `:""}IVA ${r.vatRate}%</span></div></article>`).join(""):'<div class="emptyState">Nessuna voce da fatturare.</div>';
  box?.querySelectorAll(".invoiceLineCheck").forEach(c=>c.addEventListener("change",()=>{const row=invoiceAutomationLines[Number(c.dataset.index)];if(row)row.selected=c.checked;renderInvoicePreview();}));const csv=document.getElementById("invoiceCsvBtn"),xml=document.getElementById("invoiceXmlBtn"),mark=document.getElementById("invoiceMarkPaidBtn");if(csv)csv.disabled=!lines.length;if(xml)xml.disabled=!lines.length;if(mark)mark.disabled=!lines.some(r=>r.repairId);
}
function invoiceDocumentBasics(){return {number:String(document.getElementById("invoiceNumber")?.value||"").trim(),date:document.getElementById("invoiceDate")?.value||""};}
function downloadBlobText(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportInvoiceCsv(){const lines=selectedInvoiceLines();if(!lines.length)return;const doc=invoiceDocumentBasics(),head=["Data","Cliente/Sede","Tipo","Descrizione","Quantita","Prezzo unitario netto","IVA %","Imponibile riga","Riferimento"],rows=lines.map(r=>[r.date,r.store,r.source,r.description,r.qty,r.unitNet.toFixed(2),r.vatRate,(r.unitNet*r.qty).toFixed(2),r.ref]),text='\ufeff'+[head,...rows].map(row=>row.map(csvEsc).join(";")).join("\r\n"),name=invoiceClientMode()==="vr"?"VR_Trasporti":"Riparalo";downloadBlobText(`${name}_${doc.number||"bozza"}_${doc.date||localDateISO()}.csv`,text,"text/csv;charset=utf-8");}
function buildFatturaPaXml(){
  const issuer=readIssuer(),issuerErr=validateIssuer(issuer);if(issuerErr)throw new Error(issuerErr);const client=currentInvoiceClient(),clientErr=invoiceClientMode()==="vr"?validateVrClient(client):"",doc=invoiceDocumentBasics(),lines=selectedInvoiceLines();if(clientErr)throw new Error(clientErr);if(!doc.number||!doc.date)throw new Error("Inserisci numero e data della fattura.");if(!lines.length)throw new Error("Non ci sono righe selezionate da fatturare.");
  const totals=new Map();lines.forEach(r=>{const key=Number(r.vatRate||0).toFixed(2),net=r.unitNet*r.qty,vat=net*Number(r.vatRate||0)/100,x=totals.get(key)||{net:0,vat:0,rate:Number(r.vatRate||0)};x.net+=net;x.vat+=vat;totals.set(key,x);});const gross=[...totals.values()].reduce((a,x)=>a+x.net+x.vat,0),progressive=(Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)).toUpperCase().slice(0,10),details=lines.map((r,i)=>`<DettaglioLinee><NumeroLinea>${i+1}</NumeroLinea><Descrizione>${xmlEsc(`${r.description} [${r.store}]`)}</Descrizione><Quantita>${Number(r.qty).toFixed(2)}</Quantita><PrezzoUnitario>${Number(r.unitNet).toFixed(2)}</PrezzoUnitario><PrezzoTotale>${(r.unitNet*r.qty).toFixed(2)}</PrezzoTotale><AliquotaIVA>${Number(r.vatRate).toFixed(2)}</AliquotaIVA></DettaglioLinee>`).join(""),recap=[...totals.values()].map(x=>`<DatiRiepilogo><AliquotaIVA>${x.rate.toFixed(2)}</AliquotaIVA><ImponibileImporto>${x.net.toFixed(2)}</ImponibileImporto><Imposta>${x.vat.toFixed(2)}</Imposta><EsigibilitaIVA>I</EsigibilitaIVA></DatiRiepilogo>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><FatturaElettronicaHeader><DatiTrasmissione><IdTrasmittente><IdPaese>IT</IdPaese><IdCodice>${xmlEsc(issuer.vat)}</IdCodice></IdTrasmittente><ProgressivoInvio>${progressive}</ProgressivoInvio><FormatoTrasmissione>FPR12</FormatoTrasmissione><CodiceDestinatario>${xmlEsc(client.recipientCode)}</CodiceDestinatario></DatiTrasmissione><CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${xmlEsc(issuer.vat)}</IdCodice></IdFiscaleIVA>${issuer.taxCode?`<CodiceFiscale>${xmlEsc(issuer.taxCode)}</CodiceFiscale>`:""}<Anagrafica><Denominazione>${xmlEsc(issuer.name)}</Denominazione></Anagrafica><RegimeFiscale>${xmlEsc(issuer.regime)}</RegimeFiscale></DatiAnagrafici><Sede><Indirizzo>${xmlEsc(issuer.address)}</Indirizzo><CAP>${xmlEsc(issuer.zip)}</CAP><Comune>${xmlEsc(issuer.city)}</Comune><Provincia>${xmlEsc(issuer.province)}</Provincia><Nazione>IT</Nazione></Sede></CedentePrestatore><CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${xmlEsc(client.vat)}</IdCodice></IdFiscaleIVA>${client.taxCode?`<CodiceFiscale>${xmlEsc(client.taxCode)}</CodiceFiscale>`:""}<Anagrafica><Denominazione>${xmlEsc(client.name)}</Denominazione></Anagrafica></DatiAnagrafici><Sede><Indirizzo>${xmlEsc(client.address)}</Indirizzo><CAP>${xmlEsc(client.zip)}</CAP><Comune>${xmlEsc(client.city)}</Comune><Provincia>${xmlEsc(client.province)}</Provincia><Nazione>IT</Nazione></Sede></CessionarioCommittente></FatturaElettronicaHeader><FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa><Data>${xmlEsc(doc.date)}</Data><Numero>${xmlEsc(doc.number)}</Numero><ImportoTotaleDocumento>${gross.toFixed(2)}</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali><DatiBeniServizi>${details}${recap}</DatiBeniServizi></FatturaElettronicaBody></p:FatturaElettronica>`;
}
function exportInvoiceXml(){try{if(!saveIssuerSettings())return;if(invoiceClientMode()==="vr"&&!saveVrClientSettings())return;const doc=invoiceDocumentBasics(),xml=buildFatturaPaXml(),safeNum=(doc.number||"fattura").replace(/[^A-Za-z0-9_-]+/g,"_");downloadBlobText(`IT${readIssuer().vat}_${safeNum}.xml`,xml,"application/xml;charset=utf-8");const msg=document.getElementById("invoiceLoadMsg");if(msg){msg.className="createUserMsg ok";msg.textContent="XML generato. Dopo averlo controllato/caricato su Aruba, puoi segnare le riparazioni selezionate come fatturate.";}}catch(e){const msg=document.getElementById("invoiceLoadMsg");if(msg){msg.className="createUserMsg error";msg.textContent=e.message||"Errore generazione XML.";}}}
async function markSelectedRepairsInvoiced(){const ids=selectedInvoiceLines().filter(r=>r.repairId).map(r=>r.repairId),doc=invoiceDocumentBasics(),msg=document.getElementById("invoiceLoadMsg");if(!ids.length)return;if(!doc.number){if(msg){msg.className="createUserMsg error";msg.textContent="Inserisci il numero fattura prima di segnare le riparazioni come fatturate.";}return;}if(!confirm(`Segnare ${ids.length} riparazioni come fatturate con riferimento ${doc.number}?`))return;try{const ctx=await btGetWorkspaceOwnerId();const {error}=await sb.from("beparytech_admin_repairs").update({invoiced:true,invoice_ref:doc.number}).in("id",ids).eq("workspace_owner_id",ctx.owner);if(error)throw error;if(msg){msg.className="createUserMsg ok";msg.textContent="Riparazioni segnate come fatturate.";}await buildBusinessInvoicePreview();await loadAdminRepairs();}catch(e){if(msg){msg.className="createUserMsg error";msg.textContent=e.message||"Impossibile aggiornare le riparazioni.";}}}
function bindInvoiceAutomation(){const panel=document.getElementById("adminInvoicesPanel");if(!panel||panel.dataset.bound==="1")return;panel.dataset.bound="1";defaultInvoicePeriod();loadIssuerSettings();loadVrClientSettings();updateInvoiceClientUi();document.getElementById("invoiceClientSelect")?.addEventListener("change",updateInvoiceClientUi);document.getElementById("saveVrClientBtn")?.addEventListener("click",saveVrClientSettings);document.getElementById("saveIssuerBtn")?.addEventListener("click",saveIssuerSettings);document.getElementById("invoiceRefreshBtn")?.addEventListener("click",buildBusinessInvoicePreview);document.getElementById("invoiceCsvBtn")?.addEventListener("click",exportInvoiceCsv);document.getElementById("invoiceXmlBtn")?.addEventListener("click",exportInvoiceXml);document.getElementById("invoiceMarkPaidBtn")?.addEventListener("click",markSelectedRepairsInvoiced);}
document.addEventListener("DOMContentLoaded",bindInvoiceAutomation);

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
 else if(currentCategory==='VenditeAdmin'){pl='Vendita';pi='−1';hl='Cronologia';hi='◷'}else if(currentCategory==='RiparazioniAdmin'){pl='Nuova';pi='＋';hl='Pratiche';hi='⌁'}
 else if(currentCategory==='Fatturazione'){pl='Fattura';pi='🧾';hl='Vendite';hi='€'}
 else if(currentCategory==='Vendite'){pl='Vendite';pi='✓';hl='Cronologia';hi='≋'}
 else if(currentCategory==='Utenti'){pl='Nuovo utente';pi='＋';hl='Gestisci';hi='♙'}
 else if(String(currentCategory).startsWith('custom:')){pl='Cerca';pi='⌕';hl='Cronologia';hi='≋'}
 p.querySelector('b').textContent=pi;p.querySelector('span').textContent=pl;h.querySelector('b').textContent=hi;h.querySelector('span').textContent=hl;
}
document.addEventListener('DOMContentLoaded',()=>{
 bindHourAccordions(); const nav=document.getElementById('mobileBottomNav'), back=document.getElementById('smartBackBtn');
 back?.addEventListener('click',smartBack);
 nav?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.smartAction;if(a==='home')setCategory('Dashboard');else if(a==='scanner')openScanner();else if(a==='menu')openMainMenu();else if(currentCategory==='Orari'&&a==='primary')document.querySelector('#hoursForm .hourCardToggle')?.click();else if(currentCategory==='Orari'&&a==='history')document.querySelector('#extraForm .hourCardToggle')?.click();else if(currentCategory==='VenditeAdmin'&&a==='primary')document.querySelector('[data-work-tab="sales"]')?.click();else if(currentCategory==='VenditeAdmin'&&a==='history')setCategory('Cronologia');else if(currentCategory==='RiparazioniAdmin'&&a==='primary'){const f=document.getElementById('adminRepairForm');if(f){f.hidden=false;f.scrollIntoView({behavior:'smooth',block:'start'});}}else if(currentCategory==='RiparazioniAdmin'&&a==='history')document.getElementById('adminRepairsList')?.scrollIntoView({behavior:'smooth',block:'start'});else if(currentCategory==='Fatturazione'&&a==='primary')document.querySelector('[data-work-tab="invoices"]')?.click();else if(currentCategory==='Fatturazione'&&a==='history')setCategory('VenditeAdmin');else if(a==='history')setCategory('Cronologia');else document.getElementById('globalSearch')?.focus();});
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


// ===== v87 dashboard navigation =====
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-rail-category]").forEach(btn=>btn.addEventListener("click",()=>{
    const cat=btn.dataset.railCategory; if(!cat)return;
    setCategory(cat);
    if(btn.dataset.workTarget==="repairs") setTimeout(()=>document.querySelector('[data-work-tab="repairs"]')?.click(),80);
  }));
  document.querySelector(".dashSearchVisual")?.addEventListener("click",()=>document.getElementById("globalSearch")?.focus());
});


// v89 · deep link QR pratica
(function(){let done=false;async function openPracticeFromUrl(){if(done||!isAdmin?.())return;const code=new URLSearchParams(location.search).get('practice');if(!code)return;done=true;try{setCategory('RiparazioniAdmin');setTimeout(async()=>{await loadAdminRepairs();const q=document.getElementById('adminRepairSearch');if(q){q.value=code;q.dispatchEvent(new Event('input',{bubbles:true}));}setTimeout(()=>document.querySelector('#adminRepairsList .businessRepairRow:not([hidden])')?.scrollIntoView({behavior:'smooth',block:'center'}),250);},250);}catch(e){done=false;}}setInterval(openPracticeFromUrl,1200);})();


// ===== v92: Accettazione separata, rapida, QR affidabile e DYMO configurabile =====
async function btMakeQrDataUrl(text,size=256){
  if(typeof QRCode!=="function") throw new Error("Modulo QR non disponibile");
  const host=document.createElement("div");host.style.cssText="position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden";document.body.appendChild(host);
  try{
    new QRCode(host,{text:String(text||""),width:size,height:size,correctLevel:QRCode.CorrectLevel?.M});
    await new Promise(r=>setTimeout(r,40));
    const canvas=host.querySelector("canvas"); if(canvas) return canvas.toDataURL("image/png");
    const img=host.querySelector("img"); if(img?.src) return img.src;
    throw new Error("QR non generato");
  }finally{host.remove();}
}

function v92ShowRepairArea(){
  const root=document.getElementById("deviceSalesView");if(!root)return;
  document.getElementById("adminWorkTabs")?.setAttribute("hidden","");
  const sales=document.getElementById("adminSalesPanel"),repairs=document.getElementById("adminRepairsPanel"),invoices=document.getElementById("adminInvoicesPanel");
  if(sales)sales.hidden=true;if(repairs)repairs.hidden=false;if(invoices)invoices.hidden=true;
  const h=document.getElementById("adminWorkHeroTitle"),p=document.getElementById("adminWorkHeroText");if(h)h.textContent="Accettazione & Riparazioni";if(p)p.textContent="Accettazione rapida o completa, lavorazione, preventivo, etichette e consegna.";
  try{bindAdminRepairs();loadAdminRepairs();bindQuickRepairV92();bindRepairLabelSettingsV92();}catch(_){ }
}
function v92ShowSalesArea(){
  document.getElementById("adminWorkTabs")?.setAttribute("hidden","");
  const sales=document.getElementById("adminSalesPanel"),repairs=document.getElementById("adminRepairsPanel"),invoices=document.getElementById("adminInvoicesPanel");
  if(sales)sales.hidden=false;if(repairs)repairs.hidden=true;if(invoices)invoices.hidden=true;
  const h=document.getElementById("adminWorkHeroTitle"),p=document.getElementById("adminWorkHeroText");if(h)h.textContent="Vendita ricambi";if(p)p.textContent="Vendite di ricambi e articoli elettronici, separate dalle pratiche di riparazione.";
  try{loadDeviceSales();}catch(_){ }
}
const v92PreviousSetCategory=setCategory;
setCategory=function(category,fromBack=false){
  if(category==="RiparazioniAdmin"){
    v92PreviousSetCategory("VenditeAdmin",fromBack);currentCategory="RiparazioniAdmin";
    document.getElementById("categoryName").textContent="Accettazione & Riparazioni";
    document.getElementById("categoryDescription").textContent="Area privata Admin · accettazione rapida, completa e gestione pratiche";
    document.querySelectorAll(".menuItem[data-category]").forEach(b=>b.classList.toggle("active",b.dataset.category==="RiparazioniAdmin"));
    setTimeout(v92ShowRepairArea,0);return;
  }
  v92PreviousSetCategory(category,fromBack);
  if(category==="VenditeAdmin")setTimeout(v92ShowSalesArea,0);
};

function bindQuickRepairV92(){
  const form=document.getElementById("quickRepairForm");if(!form||form.dataset.bound==="1")return;form.dataset.bound="1";
  document.getElementById("openFullRepairBtn")?.addEventListener("click",()=>{const full=document.getElementById("adminRepairForm");if(full){full.hidden=false;full.scrollIntoView({behavior:"smooth",block:"start"});}});
  form.addEventListener("submit",async e=>{
    e.preventDefault();const msg=document.getElementById("quickRepairMsg");if(msg){msg.className="createUserMsg";msg.textContent="Salvataggio…";}
    try{
      const ctx=await btGetWorkspaceOwnerId();const client=document.getElementById("quickRepairClient").value.trim(),device=document.getElementById("quickRepairDevice").value.trim(),work=document.getElementById("quickRepairType").value.trim(),note=document.getElementById("quickRepairNote").value.trim();
      if(!client||!device||!work)throw new Error("Inserisci cliente, dispositivo e lavoro da fare.");
      const day=new Date().toISOString().slice(0,10),code=`RIP-${day.replaceAll("-","")}-${String(Date.now()).slice(-5)}`;
      const payload={workspace_owner_id:ctx.owner,created_by:ctx.user,repaired_at:day,accepted_at:new Date().toISOString(),practice_code:code,receipt_token:code,store:client,client_name:client,device,repair_type:work,reported_issue:null,price_ex_vat:0,vat_rate:22,repair_status:"Da completare",quote_status:"Da diagnosticare",warranty_months:0,invoiced:false,note:note||null,photo_paths:[]};
      const {error}=await sb.from("beparytech_admin_repairs").insert(payload);if(error)throw error;
      form.reset();if(msg){msg.className="createUserMsg ok";msg.textContent=`Pratica ${code} salvata. Puoi completarla anche più tardi.`;}await loadAdminRepairs();
    }catch(err){if(msg){msg.className="createUserMsg error";msg.textContent=err.message||"Errore salvataggio";}}
  });
}
function completeAdminRepairV92(id){
  const full=document.getElementById("adminRepairForm");if(full)full.hidden=false;startAdminRepairEdit(id);setTimeout(()=>full?.scrollIntoView({behavior:"smooth",block:"start"}),60);
  const msg=document.getElementById("adminRepairMsg");if(msg){msg.className="createUserMsg";msg.textContent="Completa i dati mancanti e salva: resterà la stessa pratica.";}
}

const REPAIR_LABEL_KEY="bt-repair-label-v92";
const REPAIR_LABEL_PRESETS={"32x57":[32,57],"25x54":[25,54],"36x89":[36,89],"19x51":[19,51],"54x101":[54,101],"57x32":[57,32]};
function getRepairLabelSettingsV92(){try{return {...{preset:"32x57",w:32,h:57,qr:true},...JSON.parse(localStorage.getItem(REPAIR_LABEL_KEY)||"{}")};}catch(_){return {preset:"32x57",w:32,h:57,qr:true};}}
function saveRepairLabelSettingsV92(){const p=document.getElementById("repairLabelPreset")?.value||"32x57",w=Math.max(10,Math.min(120,Number(document.getElementById("repairLabelWidth")?.value)||32)),h=Math.max(10,Math.min(200,Number(document.getElementById("repairLabelHeight")?.value)||57)),qr=!!document.getElementById("repairLabelIncludeQr")?.checked;localStorage.setItem(REPAIR_LABEL_KEY,JSON.stringify({preset:p,w,h,qr}));const b=document.getElementById("dymoRepairSizeBadge");if(b)b.textContent=`${w} × ${h} mm`;return {preset:p,w,h,qr};}
function bindRepairLabelSettingsV92(){
  const preset=document.getElementById("repairLabelPreset");if(!preset||preset.dataset.bound==="1")return;preset.dataset.bound="1";const st=getRepairLabelSettingsV92(),w=document.getElementById("repairLabelWidth"),h=document.getElementById("repairLabelHeight"),qr=document.getElementById("repairLabelIncludeQr");preset.value=st.preset||"32x57";w.value=st.w;h.value=st.h;qr.checked=st.qr!==false;
  const sync=()=>{if(preset.value!=="custom"&&REPAIR_LABEL_PRESETS[preset.value]){[w.value,h.value]=REPAIR_LABEL_PRESETS[preset.value];}saveRepairLabelSettingsV92();};preset.addEventListener("change",sync);w.addEventListener("input",()=>{preset.value="custom";saveRepairLabelSettingsV92();});h.addEventListener("input",()=>{preset.value="custom";saveRepairLabelSettingsV92();});qr.addEventListener("change",saveRepairLabelSettingsV92);saveRepairLabelSettingsV92();
}
async function printRepairDymoV92(id){
  const r=adminRepairRows.find(x=>Number(x.id)===Number(id));if(!r)return;const st=getRepairLabelSettingsV92(),label=document.getElementById("repairDymoPrintLabel");if(!label)return;
  label.style.setProperty("--repair-label-w",`${st.w}mm`);label.style.setProperty("--repair-label-h",`${st.h}mm`);document.getElementById("repairDymoCode").textContent=r.practice_code||`RIP-${r.id}`;document.getElementById("repairDymoClient").textContent=r.client_name||r.store||"Cliente";document.getElementById("repairDymoDevice").textContent=r.device||"Dispositivo";document.getElementById("repairDymoWork").textContent=r.repair_type||"Riparazione";
  const q=document.getElementById("repairDymoQr");q.innerHTML="";if(st.qr){try{new QRCode(q,{text:`${location.origin}${location.pathname}?practice=${encodeURIComponent(r.practice_code||r.id)}`,width:120,height:120,correctLevel:QRCode.CorrectLevel?.M});}catch(_){q.hidden=true;}}q.hidden=!st.qr;
  let ps=document.getElementById("repairDymoPageStyle");if(!ps){ps=document.createElement("style");ps.id="repairDymoPageStyle";document.head.appendChild(ps);}ps.textContent=`@page{size:${st.w}mm ${st.h}mm;margin:0}`;document.body.classList.add("printingRepairDymo");const cleanup=()=>document.body.classList.remove("printingRepairDymo");window.addEventListener("afterprint",cleanup,{once:true});setTimeout(()=>{window.print();setTimeout(cleanup,1200);},80);
}

document.addEventListener("DOMContentLoaded",()=>{bindQuickRepairV92();bindRepairLabelSettingsV92();});
setInterval(()=>{if(currentCategory==="RiparazioniAdmin"){bindQuickRepairV92();bindRepairLabelSettingsV92();}},1500);
