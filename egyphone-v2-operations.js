/* EGYPHONE V2: repair parts and cash. Development branch only. */
(()=>{
const active=()=>document.documentElement.dataset.btBrand==="egyphone";
let mounted=false;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
async function owner(){
 const {data:{user}}=await sb.auth.getUser();if(!user)throw Error("Accesso richiesto");
 const {data,error}=await sb.from("beparytech_profiles").select("workspace_owner_id,active,role").eq("user_id",user.id).single();
 if(error||!data?.active||data.role!=="admin")throw Error("Accesso riservato agli amministratori");
 return data.workspace_owner_id;
}
function mount(){
 if(!active()||mounted||!document.getElementById("mainMenu"))return;
 const button=document.createElement("button");button.className="egyV2CashNav";button.textContent="🧾 Operazioni laboratorio V2";
 document.getElementById("mainMenu").append(button);
 const layer=document.createElement("div");layer.className="egyV2Ops";layer.hidden=true;
 layer.innerHTML='<div class="egyV2OpsCard"><div class="egyV2OpsHead"><h2>Operazioni EGYPHONE V2</h2><button type="button" id="egyV2OpsBack">Torna al gestionale</button></div><p>Registra un movimento di cassa oppure utilizza un ricambio per una riparazione.</p><form id="egyV2Cash"><h3>Movimento di cassa</h3><label>Riparazione (facoltativa)<select name="repair"><option value="">Nessuna pratica</option></select></label><label>Tipo<select name="kind"><option>Incasso</option><option>Acconto</option><option>Rimborso</option><option>Spesa</option></select></label><label>Pagamento<select name="method"><option>Contanti</option><option>Carta / POS</option><option>Bonifico</option><option>Satispay</option><option>Altro</option></select></label><label>Importo (€)<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Note<input name="notes" maxlength="500"></label><button>Registra movimento</button></form><form id="egyV2UsePart"><h3>Ricambio utilizzato</h3><label>Riparazione<select name="repair" required><option value="">Seleziona pratica</option></select></label><label>Ricambio<select name="part" required><option value="">Seleziona ricambio</option></select></label><label>Quantità<input name="qty" type="number" min="1" max="1000" value="1" required></label><button>Scarica e associa</button></form><form id="egyV2CustomerLink"><h3>Link stato riparazione</h3><label>Riparazione<select name="repair" required><option value="">Seleziona pratica</option></select></label><button>Genera link cliente</button></form><p id="egyV2CustomerUrl"></p><p id="egyV2OpsStatus" role="status"></p><h3>Ultimi movimenti</h3><div id="egyV2OpsHistory"></div></div>';
 document.body.append(layer);
 const status=layer.querySelector("#egyV2OpsStatus");
 layer.querySelector("#egyV2OpsBack").onclick=()=>layer.hidden=true;
 button.onclick=async()=>{layer.hidden=false;status.textContent="Caricamento…";try{
 const w=await owner();
 const [a,b,c]=await Promise.all([
 sb.from("beparytech_admin_repairs").select("id,practice_code,device").eq("workspace_owner_id",w).order("created_at",{ascending:false}).limit(100),
 sb.from("beparytech_parts").select("id,name,quantity").eq("workspace_owner_id",w).gt("quantity",0).order("name").limit(500),
 sb.from("bt_v2_cash_entries").select("id,kind,method,amount,created_at").eq("workspace_owner_id",w).order("created_at",{ascending:false}).limit(30)
 ]);
 for(const x of [a,b,c])if(x.error)throw x.error;
 layer.querySelectorAll('select[name="repair"]').forEach(select=>{const start=select.options[0].cloneNode(true);select.replaceChildren(start,...(a.data||[]).map(r=>new Option((r.practice_code||r.id)+" · "+(r.device||""),String(r.id))))});
    layer.querySelector("#egyV2CustomerLink select[name=repair]").replaceChildren(new Option("Seleziona pratica",""),...(a.data||[]).map(r=>new Option((r.practice_code||r.id)+" · "+(r.device||""),String(r.id))));
 const parts=layer.querySelector('select[name="part"]');parts.replaceChildren(new Option("Seleziona ricambio",""),...(b.data||[]).map(p=>new Option(p.name+" · disponibili "+p.quantity,String(p.id))));
 layer.querySelector("#egyV2OpsHistory").innerHTML=(c.data||[]).map(t=>'<p>'+esc(new Date(t.created_at).toLocaleDateString("it-IT"))+' · '+esc(t.kind)+' · '+esc(t.method)+' · '+Number(t.amount).toFixed(2)+' €</p>').join("")||"Nessun movimento.";
 status.textContent="";
 }catch(e){status.textContent=e.message;}};
 layer.querySelector("#egyV2CustomerLink").addEventListener("submit",async e=>{
 e.preventDefault();const val=e.currentTarget.elements.repair.value,button=e.currentTarget.querySelector("button");if(!val)return;
 button.disabled=true;status.textContent="Creazione link…";
 try{const {data,error}=await sb.rpc("bt_v2_get_customer_link",{p_repair_id:Number(val)});if(error)throw error;
  const url=location.origin+location.pathname+"?egyStatus="+data;
  const panel=layer.querySelector("#egyV2CustomerUrl");panel.replaceChildren(document.createTextNode(url+" "));
  const copy=document.createElement("button");copy.type="button";copy.textContent="Copia link";copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);status.textContent="Link copiato."}catch{status.textContent="Seleziona e copia il link visualizzato."}};panel.append(copy);
  status.textContent="Link generato. Condividilo soltanto con il cliente interessato.";
 }catch(err){status.textContent=err.message;}finally{button.disabled=false;}
 });
 for(const [id,run] of [["#egyV2Cash",async f=>sb.rpc("bt_v2_record_cash",{p_repair_id:f.elements.repair.value?Number(f.elements.repair.value):null,p_kind:f.elements.kind.value,p_method:f.elements.method.value,p_amount:Number(f.elements.amount.value),p_notes:f.elements.notes.value})],["#egyV2UsePart",async f=>sb.rpc("bt_v2_use_part",{p_repair_id:Number(f.elements.repair.value),p_part_id:Number(f.elements.part.value),p_qty:Number(f.elements.qty.value)})]]){
 layer.querySelector(id).addEventListener("submit",async e=>{e.preventDefault();const btn=e.currentTarget.querySelector("button");btn.disabled=true;status.textContent="Registrazione…";try{const {error}=await run(e.currentTarget);if(error)throw error;status.textContent="Operazione registrata.";button.click();}catch(err){status.textContent=err.message;}finally{btn.disabled=false;}});
 }
 mounted=true;
}
document.addEventListener("egyphone:active",mount);window.addEventListener("load",mount);let n=0;const boot=setInterval(()=>{mount();if(mounted||++n>15)clearInterval(boot)},1000);
})();