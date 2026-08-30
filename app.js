
const MODEL_COLORS = {"iPhone 7": ["Nero", "Nero Jet", "Argento", "Oro", "Oro rosa", "Rosso"], "iPhone 7 Plus": ["Nero", "Nero Jet", "Argento", "Oro", "Oro rosa", "Rosso"], "iPhone 8": ["Grigio siderale", "Argento", "Oro", "Rosso"], "iPhone 8 Plus": ["Grigio siderale", "Argento", "Oro", "Rosso"], "iPhone X": ["Grigio siderale", "Argento"], "iPhone XR": ["Nero", "Bianco", "Blu", "Giallo", "Corallo", "Rosso"], "iPhone XS": ["Grigio siderale", "Argento", "Oro"], "iPhone XS Max": ["Grigio siderale", "Argento", "Oro"], "iPhone 11": ["Nero", "Bianco", "Verde", "Giallo", "Viola", "Rosso"], "iPhone 11 Pro": ["Grigio siderale", "Argento", "Oro", "Verde notte"], "iPhone 11 Pro Max": ["Grigio siderale", "Argento", "Oro", "Verde notte"], "iPhone SE (2ª gen)": ["Nero", "Bianco", "Rosso"], "iPhone 12 mini": ["Nero", "Bianco", "Blu", "Verde", "Viola", "Rosso"], "iPhone 12": ["Nero", "Bianco", "Blu", "Verde", "Viola", "Rosso"], "iPhone 12 Pro": ["Grafite", "Argento", "Oro", "Blu Pacifico"], "iPhone 12 Pro Max": ["Grafite", "Argento", "Oro", "Blu Pacifico"], "iPhone 13 mini": ["Mezzanotte", "Galassia", "Blu", "Rosa", "Verde", "Rosso"], "iPhone 13": ["Mezzanotte", "Galassia", "Blu", "Rosa", "Verde", "Rosso"], "iPhone 13 Pro": ["Grafite", "Argento", "Oro", "Blu Sierra", "Verde alpino"], "iPhone 13 Pro Max": ["Grafite", "Argento", "Oro", "Blu Sierra", "Verde alpino"], "iPhone SE (3ª gen)": ["Mezzanotte", "Galassia", "Rosso"], "iPhone 14": ["Mezzanotte", "Galassia", "Blu", "Viola", "Giallo", "Rosso"], "iPhone 14 Plus": ["Mezzanotte", "Galassia", "Blu", "Viola", "Giallo", "Rosso"], "iPhone 14 Pro": ["Nero siderale", "Argento", "Oro", "Viola scuro"], "iPhone 14 Pro Max": ["Nero siderale", "Argento", "Oro", "Viola scuro"], "iPhone 15": ["Nero", "Blu", "Verde", "Giallo", "Rosa"], "iPhone 15 Plus": ["Nero", "Blu", "Verde", "Giallo", "Rosa"], "iPhone 15 Pro": ["Titanio nero", "Titanio bianco", "Titanio blu", "Titanio naturale"], "iPhone 15 Pro Max": ["Titanio nero", "Titanio bianco", "Titanio blu", "Titanio naturale"], "iPhone 16e": ["Nero", "Bianco"], "iPhone 16": ["Nero", "Bianco", "Rosa", "Verde acqua", "Blu oltremare"], "iPhone 16 Plus": ["Nero", "Bianco", "Rosa", "Verde acqua", "Blu oltremare"], "iPhone 16 Pro": ["Titanio nero", "Titanio bianco", "Titanio naturale", "Titanio sabbia"], "iPhone 16 Pro Max": ["Titanio nero", "Titanio bianco", "Titanio naturale", "Titanio sabbia"], "iPhone 17": ["Nero", "Bianco", "Blu", "Verde", "Lavanda"], "iPhone 17e": ["Nero", "Bianco", "Rosa chiaro"], "iPhone Air": ["Nero", "Bianco", "Oro chiaro", "Azzurro"], "iPhone 17 Pro": ["Argento", "Blu profondo", "Arancione cosmico"], "iPhone 17 Pro Max": ["Argento", "Blu profondo", "Arancione cosmico"]};
const SUPABASE_URL = "https://kqdcbrpykaboabjglwxu.supabase.co";
const SUPABASE_KEY = "sb_publishable_h_JHhQI97d8RTKBz8oiLeQ_uCg26kxX";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let stock = {};
let currentUser = null;
let currentProfile = null;
let workspaceOwnerId = null;
let currentCategory = "BackGlass";
let pendingSale = null;
let selectedCustomer = null;
let sales = [];
let salesMode = "active";
let selectedSale = null;

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
  value=Math.max(0, parseInt(value||0,10)||0);
  stock[keyFor(model,color)]=value;
  render();
  document.getElementById("cloudStatus").textContent="☁︎ Salvataggio…";
  const { error } = await sb.from("backglass_inventory").upsert({
    user_id: workspaceOwnerId || currentUser.id, item_key:keyFor(model,color), model, color, quantity:value, updated_at:new Date().toISOString()
  }, { onConflict:"user_id,item_key" });
  document.getElementById("cloudStatus").textContent=error ? "Errore cloud" : "☁︎ Salvato";
}


function imageForModel(model){
  const slug=model.toLowerCase().replaceAll("ª","a").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return slug+".png";
}

function render(){
  if(!currentUser) return;
  inventory.innerHTML="";
  const q=search.value.trim().toLowerCase(); let visibleModels=0;
  Object.entries(MODEL_COLORS).forEach(([model,colors])=>{
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
      row.querySelector(".minus").onclick=()=>openSaleModal(model,color,qty);
      row.querySelector(".plus").onclick=()=>setQty(model,color,qty+1);
      qtyInput.onchange=()=>setQty(model,color,qtyInput.value);
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
  const admin = isAdmin();
  const usersTab = document.getElementById("usersTab");
  const usersView = document.getElementById("usersView");
  usersTab.hidden = !admin;
  if(!admin){
    usersView.hidden = true;
    usersTab.classList.remove("active");
    // Se si passa da un account Admin a uno Standard mentre è aperta
    // l'amministrazione, riporta sempre a una sezione consentita.
    if(currentCategory === "Utenti") setCategory("BackGlass");
  }
}
async function loadMyProfile(){
  currentProfile=null; workspaceOwnerId=currentUser?.id || null;
  applyRoleVisibility();
  if(!currentUser) return;
  const {data,error}=await sb.from("beparytech_profiles").select("username,role,active,workspace_owner_id").eq("user_id",currentUser.id).maybeSingle();
  if(!error && data){
    currentProfile=data; workspaceOwnerId=data.workspace_owner_id || currentUser.id;
  }
  applyRoleVisibility();
}
async function showAuth(user){
  currentUser=user||null; currentProfile=null; workspaceOwnerId=user?.id||null; document.body.classList.toggle("logged-in",!!user);
  document.getElementById("signedOut").hidden=!!user; document.getElementById("signedIn").hidden=!user;
  if(user){
    document.getElementById("userEmail").textContent=user.email;
    await loadMyProfile();
    await loadCloud();
  }else{
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
document.getElementById("logoutBtn").onclick=async()=>{await sb.auth.signOut(); stock={}; showAuth(null);};


function setCategory(category){
  const isSales=category==="Vendite", isUsers=category==="Utenti";
  if(isUsers && !isAdmin()) return;
  currentCategory=category;
  document.getElementById("backglassTab").classList.toggle("active", category==="BackGlass");
  document.getElementById("housingTab").classList.toggle("active", category==="Housing");
  document.getElementById("salesTab").classList.toggle("active", isSales);
  document.getElementById("usersTab").classList.toggle("active", isUsers);
  document.getElementById("categoryName").textContent=isUsers ? "Utenti" : (isSales ? "Vendite" : category);
  document.getElementById("categoryDescription").textContent=isUsers ? "Gestione accessi" : (isSales ? "Storico uscite" : (category==="BackGlass" ? "Vetro posteriore" : "Scocca completa"));
  document.querySelector(".tools").hidden=isSales||isUsers;
  inventory.hidden=isSales||isUsers;
  document.getElementById("salesView").hidden=!isSales;
  document.getElementById("usersView").hidden=!isUsers;
  search.value=""; filter.value="all";
  if(isSales) loadSales(); else if(isUsers) loadUsers(); else render();
  document.getElementById("categoryName").scrollIntoView({behavior:"smooth", block:"start"});
}


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
  if(!users.length){list.innerHTML='<div class="emptyState">Nessun utente.</div>';return;}
  list.innerHTML=users.map(u=>{
    const initial=(u.username||u.email||"U").trim().charAt(0).toUpperCase();
    return `<article class="userRow"><div class="userAvatar">${escapeHtml(initial)}</div><div class="userInfo"><strong>${escapeHtml(u.username||"Utente")}</strong><span>${escapeHtml(u.email||"")}</span></div><span class="roleBadge ${u.role==="admin"?"admin":""}">${u.role==="admin"?"Admin":"Standard"}</span></article>`;
  }).join("");
}

document.getElementById("createUserForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!isAdmin()) return;
  const btn=document.getElementById("createUserBtn"), msg=document.getElementById("createUserMsg");
  const payload={
    username:document.getElementById("newUsername").value.trim(),
    email:document.getElementById("newUserEmail").value.trim(),
    password:document.getElementById("newUserPassword").value,
    role:document.getElementById("newUserRole").value
  };
  msg.className="createUserMsg"; msg.textContent=""; btn.disabled=true; btn.textContent="Creazione…";
  const {data,error}=await sb.functions.invoke("beparytech-users",{body:payload,method:"POST"});
  btn.disabled=false; btn.textContent="Crea utente";
  if(error || data?.error){msg.className="createUserMsg error";msg.textContent=data?.error||error?.message||"Impossibile creare l'utente.";return;}
  msg.className="createUserMsg ok";msg.textContent="Utente creato correttamente.";
  e.target.reset(); document.getElementById("newUserRole").value="standard";
  await loadUsers();
});

document.getElementById("refreshUsersBtn").onclick=loadUsers;
function openSaleModal(model,color,qty){
  if(qty<=0) return;
  pendingSale={model,color,category:currentCategory,itemKey:keyFor(model,color)};
  selectedCustomer=null;
  document.getElementById("saleItemLabel").innerHTML=`<strong>${model}</strong><span>${color} · ${currentCategory === "BackGlass" ? "Vetro posteriore" : "Scocca completa"}</span>`;
  const customerSelect=document.getElementById("saleCustomerSelect");
  customerSelect.value="";
  document.getElementById("confirmSaleBtn").disabled=true;
  document.getElementById("saleError").textContent="";
  document.getElementById("saleModal").hidden=false;
}
function closeSaleModal(){
  document.getElementById("saleModal").hidden=true; pendingSale=null; selectedCustomer=null;
}
document.getElementById("saleCustomerSelect").addEventListener("change",e=>{
  selectedCustomer=e.target.value || null;
  document.getElementById("confirmSaleBtn").disabled=!selectedCustomer;
});
document.getElementById("cancelSaleBtn").onclick=closeSaleModal;
document.getElementById("cancelSaleX").onclick=closeSaleModal;
document.getElementById("saleModal").addEventListener("click",e=>{if(e.target.id==="saleModal") closeSaleModal();});

document.getElementById("confirmSaleBtn").onclick=async()=>{
  if(!pendingSale || !selectedCustomer || !currentUser) return;
  const btn=document.getElementById("confirmSaleBtn");
  btn.disabled=true; btn.textContent="Salvo…"; document.getElementById("saleError").textContent="";
  const p=pendingSale;
  const {data,error}=await sb.rpc("record_beparytech_sale",{
    p_customer:selectedCustomer,p_category:p.category,p_item_key:p.itemKey,p_model:p.model,p_color:p.color
  });
  btn.textContent="Conferma −1";
  if(error){
    document.getElementById("saleError").textContent=error.message || "Impossibile registrare la vendita.";
    btn.disabled=false; return;
  }
  stock[p.itemKey]=Number(data);
  closeSaleModal(); render();
  document.getElementById("cloudStatus").textContent="☁︎ Vendita salvata";
};

async function loadSales(){
  if(!currentUser) return;
  const list=document.getElementById("salesList");
  list.innerHTML='<div class="emptyState">Caricamento vendite…</div>';
  const {data,error}=await sb.from("beparytech_sales").select("id,customer,category,item_key,model,color,quantity,sold_at,is_archived,deleted_at,delete_reason,restored_to_inventory").order("sold_at",{ascending:false}).limit(1000);
  if(error){list.innerHTML='<div class="emptyState">Errore nel caricamento delle vendite.</div>'; return;}
  sales=data||[]; renderSales();
}
function renderSales(){
  const list=document.getElementById("salesList");
  const archived=salesMode==="archive";
  const visible=sales.filter(s=>Boolean(s.is_archived)===archived);
  document.getElementById("activeSalesTab").classList.toggle("active",!archived);
  document.getElementById("archiveSalesTab").classList.toggle("active",archived);
  if(!visible.length){list.innerHTML=`<div class="emptyState">${archived?"Nessuna riga archiviata.":"Nessuna vendita registrata."}</div>`; return;}
  const fmt=new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
  list.innerHTML=visible.map(s=>{
    const sold=fmt.format(new Date(s.sold_at));
    if(archived){
      const deleted=s.deleted_at?fmt.format(new Date(s.deleted_at)):"—";
      return `<article class="saleRow archiveRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${s.category==="BackGlass"?"BackGlass":"Housing"}</span><b class="archiveBadge">ARCHIVIATA</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Eliminata ${deleted}</span>${s.restored_to_inventory?`<span class="restoredBadge">↩ Rimesso in magazzino +${s.quantity}</span>`:""}</div><div class="archiveReason"><strong>Motivo:</strong> ${escapeHtml(s.delete_reason||"Nessun motivo registrato")}</div></article>`;
    }
    const adminActions=isAdmin() ? `<div class="saleActionsRow"><button class="rowAction editStore" type="button" data-id="${s.id}">Modifica negozio</button><button class="rowAction delete archiveSale" type="button" data-id="${s.id}">Elimina</button></div>` : "";
    return `<article class="saleRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${s.category==="BackGlass"?"BackGlass":"Housing"}</span></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · ${sold}</span></div>${adminActions}</article>`;
  }).join("");
  if(!archived && isAdmin()){
    list.querySelectorAll(".editStore").forEach(btn=>btn.addEventListener("click",()=>openEditStore(Number(btn.dataset.id))));
    list.querySelectorAll(".archiveSale").forEach(btn=>btn.addEventListener("click",()=>openDeleteSale(Number(btn.dataset.id))));
  }
}
function saleById(id){ return sales.find(s=>Number(s.id)===Number(id)); }
function saleLabelHtml(s){ return `<strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${s.category==="BackGlass"?"Vetro posteriore":"Scocca completa"} · ${escapeHtml(s.customer)}</span>`; }

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
    stock[k]=Number(stock[k]||0)+Number(saleSnapshot.quantity||1);
    render();
    document.getElementById("cloudStatus").textContent="☁︎ Pezzo rimesso in magazzino";
  }
  await loadSales();
};

document.getElementById("activeSalesTab").onclick=()=>{salesMode="active";renderSales();};
document.getElementById("archiveSalesTab").onclick=()=>{salesMode="archive";renderSales();};

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

document.getElementById("backglassTab").onclick=()=>setCategory("BackGlass");
document.getElementById("housingTab").onclick=()=>setCategory("Housing");
document.getElementById("salesTab").onclick=()=>setCategory("Vendite");
document.getElementById("usersTab").onclick=()=>setCategory("Utenti");
document.getElementById("refreshSalesBtn").onclick=loadSales;

search.oninput=render; filter.onchange=render;
sb.auth.getUser().then(({data})=>showAuth(data.user));

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


sb.auth.onAuthStateChange((_event,session)=>{ if(session?.user && session.user.id!==currentUser?.id) showAuth(session.user); });
