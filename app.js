
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
let selectedUserForOperatorPassword = null;
let customSections = [];
let customProducts = [];
let currentCustomSectionId = null;

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
  usersTab.hidden=!admin;
  if(catalogMenu) catalogMenu.hidden=!admin;
  if(usersMenu) usersMenu.hidden=!admin;
  if(!admin){
    usersView.hidden=true;
    if(catalogView) catalogView.hidden=true;
    usersTab.classList.remove("active");
    if(currentCategory==="Utenti"||currentCategory==="GestioneMagazzino") setCategory("BackGlass");
  }
  const menuUser=document.getElementById("menuUserName"), menuRole=document.getElementById("menuUserRole");
  if(menuUser) menuUser.textContent=currentProfile?.username||currentUser?.email||"Utente";
  if(menuRole) menuRole.textContent=admin?"Amministratore":"Operatore standard";
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
    await loadCustomCatalog();
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

document.getElementById("forgotPasswordBtn").onclick=async()=>{
  const email=document.getElementById("email").value.trim();
  authMsg.textContent="";
  if(!email){authMsg.textContent="Inserisci prima la tua email.";return;}
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});
  authMsg.textContent=error?error.message:"Email di recupero inviata. Controlla la posta.";
};
document.getElementById("logoutBtn").onclick=async()=>{await sb.auth.signOut(); stock={}; showAuth(null);};


function setCategory(category){
  const isSales=category==="Vendite", isUsers=category==="Utenti", isCatalog=category==="GestioneMagazzino";
  const isCustom=String(category).startsWith("custom:");
  if((isUsers||isCatalog)&&!isAdmin()) return;
  currentCategory=category;
  currentCustomSectionId=isCustom?Number(String(category).split(":")[1]):null;
  document.getElementById("backglassTab").classList.toggle("active",category==="BackGlass");
  document.getElementById("housingTab").classList.toggle("active",category==="Housing");
  document.getElementById("salesTab").classList.toggle("active",isSales);
  document.getElementById("usersTab").classList.toggle("active",isUsers);
  const sec=isCustom?customSections.find(s=>Number(s.id)===currentCustomSectionId):null;
  document.getElementById("categoryName").textContent=isUsers?"Utenti":isCatalog?"Gestione magazzino":isSales?"Cronologia":sec?.name||category;
  document.getElementById("categoryDescription").textContent=isUsers?"Gestione accessi":isCatalog?"Crea sezioni e aggiungi prodotti":isSales?"Storico completo di tutti gli operatori":sec?.description||(category==="BackGlass"?"Vetro posteriore":"Scocca completa");
  document.querySelector(".tools").hidden=isSales||isUsers||isCatalog;
  inventory.hidden=isSales||isUsers||isCatalog;
  document.getElementById("salesView").hidden=!isSales;
  document.getElementById("usersView").hidden=!isUsers;
  document.getElementById("catalogView").hidden=!isCatalog;
  document.querySelectorAll(".menuItem[data-category]").forEach(b=>b.classList.toggle("active",b.dataset.category===category));
  search.value=""; filter.value="all";
  closeMainMenu();
  if(isSales) loadSales(); else if(isUsers) loadUsers(); else if(isCatalog) renderCatalogAdmin(); else if(isCustom) renderCustomSection(); else render();
  document.getElementById("categoryName").scrollIntoView({behavior:"smooth",block:"start"});
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
    return `<article class="userRow"><div class="userAvatar">${escapeHtml(initial)}</div><div class="userInfo"><strong>${escapeHtml(u.username||"Utente")}</strong><span>${escapeHtml(u.email||"")}</span><small class="operatorPasswordState ${u.operator_password_set?"set":""}">${u.operator_password_set?"Password operatore impostata":"Password operatore da impostare"}</small></div><div class="userRowActions"><span class="roleBadge ${u.role==="admin"?"admin":""}">${u.role==="admin"?"Admin":"Standard"}</span><button class="rowAction setOperatorPassword" type="button" data-user-id="${escapeHtml(u.user_id)}" data-username="${escapeHtml(u.username||"Utente")}">Password operatore</button></div></article>`;
  }).join("");
  list.querySelectorAll(".setOperatorPassword").forEach(btn=>btn.addEventListener("click",()=>openOperatorPassword(btn.dataset.userId,btn.dataset.username)));
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
  document.getElementById("saleOperatorName").value=currentProfile?.username||"";
  document.getElementById("saleOperatorPassword").value="";
  document.getElementById("saleNote").value="";
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
function updateSaleConfirmState(){
  selectedCustomer=document.getElementById("saleCustomerSelect").value||null;
  const operator=document.getElementById("saleOperatorName").value.trim();
  const pass=document.getElementById("saleOperatorPassword").value;
  document.getElementById("confirmSaleBtn").disabled=!(selectedCustomer&&operator&&pass.length>=4);
}
document.getElementById("saleCustomerSelect").addEventListener("change",updateSaleConfirmState);
document.getElementById("saleOperatorName").addEventListener("input",updateSaleConfirmState);
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
    p_operator_name:document.getElementById("saleOperatorName").value.trim(),
    p_operator_password:document.getElementById("saleOperatorPassword").value,
    p_note:document.getElementById("saleNote").value.trim()||null
  };
  const result=p.kind==="custom"
    ? await sb.rpc("record_beparytech_custom_sale",{p_product_id:p.productId,...commonOperator})
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
  document.getElementById("cloudStatus").textContent="☁︎ Vendita salvata";
};

async function loadSales(){
  if(!currentUser) return;
  const list=document.getElementById("salesList");
  list.innerHTML='<div class="emptyState">Caricamento vendite…</div>';
  const {data,error}=await sb.from("beparytech_sales").select("id,customer,category,item_key,model,color,quantity,sold_at,is_archived,deleted_at,delete_reason,restored_to_inventory,actor_user_id,operator_name,operator_note,restore_reason").order("sold_at",{ascending:false}).limit(1000);
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
      return `<article class="saleRow archiveRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}</span><b class="archiveBadge">ARCHIVIATA</b></div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · Vendita ${sold}</span><span>Eliminata ${deleted}</span>${s.restored_to_inventory?`<span class="restoredBadge">↩ Rimesso in magazzino +${s.quantity}</span>`:""}</div><div class="archiveReason"><strong>Motivo:</strong> ${escapeHtml(s.delete_reason||"Nessun motivo registrato")}</div></article>`;
    }
    const ownSale=String(s.actor_user_id||"")===String(currentUser?.id||"");
    const actions=isAdmin()
      ? `<div class="saleActionsRow"><button class="rowAction editStore" type="button" data-id="${s.id}">Modifica negozio</button><button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button><button class="rowAction delete archiveSale" type="button" data-id="${s.id}">Elimina</button></div>`
      : ownSale ? `<div class="saleActionsRow"><button class="rowAction restoreSale" type="button" data-id="${s.id}">Rimetti in magazzino</button></div>` : `<div class="saleActionsRow readOnlyHistory"><span>Solo visualizzazione</span></div>`;
    return `<article class="saleRow"><div class="saleMain"><strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)}</span>${s.operator_name?`<span class="operatorTag">Operatore: ${escapeHtml(s.operator_name)}</span>`:""}</div><div class="saleMeta"><strong>${escapeHtml(s.customer)}</strong><span>−${s.quantity} · ${sold}</span>${s.operator_note?`<span class="saleNoteText">Nota: ${escapeHtml(s.operator_note)}</span>`:""}</div>${actions}</article>`;
  }).join("");
  if(!archived){
    list.querySelectorAll(".restoreSale").forEach(btn=>btn.addEventListener("click",()=>openRestoreSale(Number(btn.dataset.id))));
    if(isAdmin()){
      list.querySelectorAll(".editStore").forEach(btn=>btn.addEventListener("click",()=>openEditStore(Number(btn.dataset.id))));
      list.querySelectorAll(".archiveSale").forEach(btn=>btn.addEventListener("click",()=>openDeleteSale(Number(btn.dataset.id))));
    }
  }
}
function saleById(id){ return sales.find(s=>Number(s.id)===Number(id)); }
function saleLabelHtml(s){ return `<strong>${escapeHtml(s.model)}</strong><span>${escapeHtml(s.color)} · ${escapeHtml(s.category)} · ${escapeHtml(s.customer)}</span>`; }

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
    if(String(k).startsWith("CUSTOM||")){
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
  if(String(k).startsWith("CUSTOM||")){
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
  if(pass.length<4){document.getElementById("operatorPasswordError").textContent="Inserisci almeno 4 caratteri.";return;}
  const btn=document.getElementById("operatorPasswordSave");btn.disabled=true;btn.textContent="Salvo…";
  const {data,error}=await sb.functions.invoke("beparytech-users",{method:"POST",body:{action:"set_operator_password",user_id:selectedUserForOperatorPassword.userId,operator_password:pass}});
  btn.disabled=false;btn.textContent="Salva password";
  if(error||data?.error){document.getElementById("operatorPasswordError").textContent=data?.error||error?.message||"Errore salvataggio.";return;}
  closeOperatorPassword();await loadUsers();
};

document.getElementById("activeSalesTab").onclick=()=>{salesMode="active";renderSales();};
document.getElementById("archiveSalesTab").onclick=()=>{salesMode="archive";renderSales();};

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

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
  const [{data:sections,error:sErr},{data:products,error:pErr}]=await Promise.all([
    sb.from("beparytech_sections").select("id,name,description,position,active,created_at").eq("active",true).order("position").order("created_at"),
    sb.from("beparytech_products").select("id,section_id,name,variant,quantity,low_stock_threshold,active,created_at,updated_at").eq("active",true).order("created_at")
  ]);
  if(sErr||pErr){console.error(sErr||pErr);return;}
  customSections=sections||[]; customProducts=products||[];
  renderCustomMenu();
  renderCatalogAdmin();
}
function renderCustomMenu(){
  const box=document.getElementById("customMenuSections"); if(!box)return;
  box.innerHTML=customSections.map(s=>`<button class="menuItem customMenuItem" type="button" data-category="custom:${s.id}"><span class="menuIcon">▤</span><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.description||"Sezione magazzino")}</small></span></button>`).join("");
  box.querySelectorAll(".menuItem").forEach(btn=>btn.addEventListener("click",()=>setCategory(btn.dataset.category)));
}
function customStatus(q,threshold){if(q===0)return["ESAURITO","empty"];if(q<=threshold)return["SCORTA BASSA","low"];return["DISPONIBILE","ok"]}
function renderCustomSection(){
  if(!currentUser||!currentCustomSectionId)return;
  const section=customSections.find(s=>Number(s.id)===currentCustomSectionId);
  if(section && String(section.name||"").trim().toLowerCase()==="da ordinare"){ renderOrderRequests(section); return; }
  const query=search.value.trim().toLowerCase();
  const items=customProducts.filter(p=>Number(p.section_id)===currentCustomSectionId).filter(p=>`${p.name} ${p.variant}`.toLowerCase().includes(query)).filter(p=>passesFilter(Number(p.quantity||0)));
  inventory.innerHTML="";
  if(!items.length){inventory.innerHTML='<div class="emptyState">Nessun prodotto in questa sezione.</div>';updateCustomStats([]);return;}
  const grid=document.createElement("div");grid.className="customProductGrid";
  items.forEach(p=>{
    const q=Number(p.quantity||0),[status,cls]=customStatus(q,Number(p.low_stock_threshold||2));
    const card=document.createElement("article");card.className="customProductCard";
    card.innerHTML=`<div class="customProductTop"><div class="productVisual">${escapeHtml(p.name).charAt(0).toUpperCase()}</div><div class="customProductInfo"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.variant||section?.name||"")}</span><b class="status ${cls}">${status}</b></div></div><div class="customProductBottom"><div class="customQty"><small>Giacenza</small><strong>${q}</strong></div><div class="customActions"><button class="minus customMinus animatedBtn" type="button" ${q<=0?"disabled":""}>−1</button>${isAdmin()?'<button class="plus customPlus animatedBtn" type="button">+1</button>':""}</div></div>`;
    card.querySelector(".customMinus").onclick=()=>openCustomSaleModal(p,section);
    const plus=card.querySelector(".customPlus"); if(plus)plus.onclick=()=>updateCustomProductQty(p,q+1);
    grid.appendChild(card);
  });
  inventory.appendChild(grid);updateCustomStats(items);
}
async function renderOrderRequests(section){
  inventory.innerHTML='<div class="orderRequestWrap"><form id="orderRequestForm" class="orderRequestCard"><div class="catalogCardTitle"><span class="catalogIcon">🛒</span><div><strong>Richiedi qualcosa</strong><small>Puoi chiedere qualsiasi materiale da ordinare</small></div></div><label><span>Cosa serve *</span><input id="requestItem" type="text" maxlength="160" placeholder="es. Display iPhone 15 Pro nero" required></label><div class="catalogTwoCols"><label><span>Quantità *</span><input id="requestQty" type="number" min="1" value="1" required></label><label><span>Nota</span><input id="requestNote" type="text" maxlength="240" placeholder="Facoltativa"></label></div><button class="primaryAction animatedBtn" type="submit">Invia richiesta</button><div id="requestMsg" class="createUserMsg"></div></form><div class="orderRequestCard"><div class="catalogListHead"><div><strong>Da ordinare</strong><small>Richieste di tutti gli utenti</small></div><button id="refreshRequestsBtn" class="miniBtn animatedBtn" type="button">Aggiorna</button></div><div id="requestsList"><div class="emptyState">Caricamento richieste…</div></div></div></div>';
  document.getElementById("orderRequestForm").addEventListener("submit",submitOrderRequest);
  document.getElementById("refreshRequestsBtn").onclick=loadOrderRequests;
  await loadOrderRequests();
}
async function submitOrderRequest(e){
  e.preventDefault();
  const msg=document.getElementById("requestMsg"),item=document.getElementById("requestItem").value.trim(),quantity=Math.max(1,Number(document.getElementById("requestQty").value)||1),note=document.getElementById("requestNote").value.trim();
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.from("beparytech_requests").insert({workspace_owner_id:workspaceOwnerId,created_by:currentUser.id,requester_name:currentProfile?.username||currentUser.email||"Utente",item,quantity,note:note||null});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();document.getElementById("requestQty").value=1;msg.textContent="Richiesta inviata.";msg.className="createUserMsg ok";await loadOrderRequests();
}
async function loadOrderRequests(){
  const list=document.getElementById("requestsList"); if(!list)return;
  const {data,error}=await sb.from("beparytech_requests").select("id,requester_name,item,quantity,note,status,created_at").order("created_at",{ascending:false});
  if(error){list.innerHTML='<div class="emptyState">Impossibile caricare le richieste.</div>';return;}
  const rows=data||[];
  if(!rows.length){list.innerHTML='<div class="emptyState">Nessuna richiesta da ordinare.</div>';return;}
  list.innerHTML=rows.map(r=>`<div class="requestRow"><div class="requestMain"><strong>${escapeHtml(r.item)}</strong><span>${escapeHtml(r.requester_name)} · Qtà ${Number(r.quantity||1)} · ${new Date(r.created_at).toLocaleString("it-IT")}</span>${r.note?`<small>${escapeHtml(r.note)}</small>`:""}</div><div class="requestSide"><b class="requestStatus ${r.status}">${r.status}</b>${isAdmin()?`<select class="requestStatusSelect" data-id="${r.id}"><option value="richiesto" ${r.status==="richiesto"?"selected":""}>Richiesto</option><option value="ordinato" ${r.status==="ordinato"?"selected":""}>Ordinato</option><option value="arrivato" ${r.status==="arrivato"?"selected":""}>Arrivato</option></select>`:""}</div></div>`).join("");
  list.querySelectorAll(".requestStatusSelect").forEach(sel=>sel.addEventListener("change",async()=>{const {error}=await sb.from("beparytech_requests").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",Number(sel.dataset.id));if(error)alert(error.message);else loadOrderRequests();}));
  document.getElementById("totalPieces").textContent=rows.filter(r=>r.status!=="arrivato").reduce((a,r)=>a+Number(r.quantity||1),0);
  document.getElementById("availableTypes").textContent=rows.filter(r=>r.status!=="arrivato").length;
  document.getElementById("lowStock").textContent=rows.filter(r=>r.status==="richiesto").length;
}
function updateCustomStats(items){
  const vals=items.length?items:customProducts.filter(p=>Number(p.section_id)===currentCustomSectionId);
  document.getElementById("totalPieces").textContent=vals.reduce((s,p)=>s+Number(p.quantity||0),0);
  document.getElementById("availableTypes").textContent=vals.filter(p=>Number(p.quantity)>0).length;
  document.getElementById("lowStock").textContent=vals.filter(p=>Number(p.quantity)>0&&Number(p.quantity)<=Number(p.low_stock_threshold||2)).length;
}
function openCustomSaleModal(product,section){
  if(Number(product.quantity)<=0)return;
  pendingSale={kind:"custom",productId:product.id,model:product.name,color:product.variant||"—",category:section?.name||"Prodotti",itemKey:`CUSTOM||${product.id}`};
  selectedCustomer=null;
  document.getElementById("saleOperatorName").value=currentProfile?.username||"";
  document.getElementById("saleOperatorPassword").value="";document.getElementById("saleNote").value="";
  document.getElementById("saleItemLabel").innerHTML=`<strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.variant||section?.name||"")}</span>`;
  document.getElementById("saleCustomerSelect").value="";document.getElementById("confirmSaleBtn").disabled=true;document.getElementById("saleError").textContent="";document.getElementById("saleModal").hidden=false;
}
async function updateCustomProductQty(product,value){
  if(!isAdmin())return;
  const next=Math.max(0,Number(value)||0);
  const {data,error}=await sb.from("beparytech_products").update({quantity:next,updated_at:new Date().toISOString()}).eq("id",product.id).select("quantity").single();
  if(error){document.getElementById("cloudStatus").textContent="Errore cloud";return;}
  product.quantity=Number(data.quantity);renderCustomSection();document.getElementById("cloudStatus").textContent="☁︎ Salvato";
}
function fillProductSectionSelect(){
  const sel=document.getElementById("productSection");if(!sel)return;
  const previous=sel.value;sel.innerHTML='<option value="">Seleziona sezione…</option>'+customSections.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
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
    return `<div class="catalogSectionRow"><div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.description||"Nessuna descrizione")}</span></div><div class="catalogSectionStats"><b>${products.length}</b><small>prodotti</small><b>${pieces}</b><small>pezzi</small></div></div>`;
  }).join("");
}
document.getElementById("createSectionForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin())return;
  const msg=document.getElementById("sectionFormMsg"),name=document.getElementById("sectionName").value.trim(),description=document.getElementById("sectionDescription").value.trim();
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.from("beparytech_sections").insert({workspace_owner_id:workspaceOwnerId,name,description,created_by:currentUser.id});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();msg.textContent="Sezione creata.";msg.className="createUserMsg ok";await loadCustomCatalog();
});
document.getElementById("createProductForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin())return;
  const msg=document.getElementById("productFormMsg"),sectionId=Number(document.getElementById("productSection").value),name=document.getElementById("productName").value.trim(),variant=document.getElementById("productVariant").value.trim(),quantity=Math.max(0,Number(document.getElementById("productQuantity").value)||0),low=Math.max(0,Number(document.getElementById("productLowStock").value)||2);
  msg.textContent="";msg.className="createUserMsg";
  const {error}=await sb.from("beparytech_products").insert({workspace_owner_id:workspaceOwnerId,section_id:sectionId,name,variant,quantity,low_stock_threshold:low,created_by:currentUser.id});
  if(error){msg.textContent=error.message;msg.className="createUserMsg error";return;}
  e.target.reset();document.getElementById("productQuantity").value=0;document.getElementById("productLowStock").value=2;msg.textContent="Prodotto aggiunto.";msg.className="createUserMsg ok";await loadCustomCatalog();
});
document.getElementById("refreshCatalogBtn").onclick=loadCustomCatalog;
// Ricerca/filtro anche nelle sezioni personalizzate
search.addEventListener("input",()=>{if(String(currentCategory).startsWith("custom:"))renderCustomSection();});
filter.addEventListener("change",()=>{if(String(currentCategory).startsWith("custom:"))renderCustomSection();});

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


sb.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY"){
    document.getElementById("passwordRecoveryModal").hidden=false;
    return;
  }
  if(session?.user && session.user.id!==currentUser?.id) showAuth(session.user);
  if(!session?.user && currentUser) showAuth(null);
});

document.getElementById("saveRecoveryPassword").onclick=async()=>{
  const p1=document.getElementById("recoveryPassword").value;
  const p2=document.getElementById("recoveryPassword2").value;
  const msg=document.getElementById("recoveryPasswordMsg");
  msg.textContent="";
  if(p1.length<6){msg.textContent="La password deve avere almeno 6 caratteri.";return;}
  if(p1!==p2){msg.textContent="Le password non coincidono.";return;}
  const {error}=await sb.auth.updateUser({password:p1});
  if(error){msg.textContent=error.message;return;}
  document.getElementById("passwordRecoveryModal").hidden=true;
  document.getElementById("recoveryPassword").value="";
  document.getElementById("recoveryPassword2").value="";
  alert("Password aggiornata correttamente.");
};
