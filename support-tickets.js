/* BeparyTech support: tenant-scoped ticket submission and own-ticket history. */
(()=>{
let mounted=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function context(){
 const {data:{user}}=await sb.auth.getUser();if(!user)throw Error("Accedi per aprire un ticket.");
 const {data:p,error}=await sb.from("beparytech_profiles").select("workspace_owner_id,active").eq("user_id",user.id).single();
 if(error||!p?.active)throw Error("Profilo non attivo.");
 return {user,owner:p.workspace_owner_id};
}
async function load(host){
 const {owner}=await context();
 const {data,error}=await sb.from("bt_support_tickets").select("id,created_at,category,priority,subject,status").eq("workspace_owner_id",owner).order("created_at",{ascending:false}).limit(50);
 if(error)throw error;
 host.innerHTML='<h3>I miei ticket</h3>'+((data||[]).length?(data||[]).map(t=>'<div class="btSupportItem"><strong>#'+t.id+' · '+esc(t.subject)+'</strong><small>'+esc(t.category)+' · '+esc(t.priority)+' · '+esc(t.status)+' · '+new Date(t.created_at).toLocaleDateString("it-IT")+'</small></div>').join(""):'<p>Nessun ticket aperto.</p>');
}
function mount(){
 if(mounted||!document.getElementById("mainMenu")||typeof sb==="undefined")return;
 const menu=document.getElementById("mainMenu");
 const button=document.createElement("button");button.type="button";button.id="btOpenSupport";button.textContent="🎧 Centro assistenza IT";
 menu.append(button);
 const layer=document.createElement("div");layer.id="btSupportOverlay";layer.hidden=true;
 layer.innerHTML='<div class="btSupportCard"><div class="btSupportTop"><h2>Centro assistenza IT</h2><button type="button" id="btSupportClose">← Torna al gestionale</button></div><p>Segnala un problema o richiedi una modifica al tuo gestionale.</p><form id="btSupportForm"><label>Tipo di richiesta<select name="category"><option>Problema tecnico</option><option>Richiesta modifica</option><option>Nuova funzionalità</option></select></label><label>Priorità<select name="priority"><option>Normale</option><option>Bassa</option><option>Urgente</option></select></label><label>Oggetto<input name="subject" minlength="3" maxlength="160" required></label><label>Descrizione<textarea name="description" minlength="10" maxlength="5000" rows="4" required></textarea></label><button type="submit">Apri ticket</button><p id="btSupportMessage" aria-live="polite"></p></form><div id="btSupportHistory"></div></div>';
 document.body.append(layer);
 const close=()=>{layer.hidden=true;document.body.classList.remove("bt-support-open");};
 layer.querySelector("#btSupportClose").addEventListener("click",close);
 button.addEventListener("click",async()=>{layer.hidden=false;document.body.classList.add("bt-support-open");try{await load(layer.querySelector("#btSupportHistory"));}catch(e){layer.querySelector("#btSupportMessage").textContent=e.message;}});
 layer.querySelector("#btSupportForm").addEventListener("submit",async e=>{
  e.preventDefault();const form=e.currentTarget,msg=layer.querySelector("#btSupportMessage"),btn=form.querySelector("button[type=submit]");btn.disabled=true;msg.textContent="Salvataggio…";
  try{const {owner,user}=await context();const val=name=>String(form.elements.namedItem(name)?.value||"").trim();
   const {data,error}=await sb.from("bt_support_tickets").insert({workspace_owner_id:owner,created_by:user.id,category:val("category"),priority:val("priority"),subject:val("subject"),description:val("description")}).select("id").single();
   if(error)throw error;msg.textContent="Ticket #"+data.id+" salvato. Gli avvisi email e push non sono ancora attivi.";form.reset();await load(layer.querySelector("#btSupportHistory"));
  }catch(err){msg.textContent="Errore: "+err.message;}finally{btn.disabled=false;}
 });
 mounted=true;
}
window.addEventListener("load",mount);let n=0;const timer=setInterval(()=>{mount();if(mounted||++n>=12)clearInterval(timer);},1500);
})();