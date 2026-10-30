/* EGYPHONE V2: intake pre-check, stored within existing repair note for compatibility.
   Scoped only to authenticated EGYPHONE. No schema changes. */
(()=>{
 const active=()=>document.documentElement.dataset.btBrand==="egyphone";
 const checks=["Display","Touch","Fotocamera anteriore","Fotocamera posteriore","Audio","Microfono","Ricarica","Wi-Fi","Rete mobile","Face ID / impronta"];
 let installed=false;
 const esc=v=>String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 function mount(){
  if(!active()||installed)return;
  const form=document.getElementById("quickRepairForm"),note=document.getElementById("quickRepairNote");
  if(!form||!note)return;
  const div=document.createElement("fieldset");div.className="egyV2Checklist";
  div.innerHTML='<legend>Controllo iniziale del dispositivo</legend><p>Facoltativo: registra lo stato prima della riparazione. I controlli non eseguiti restano “Non verificato”.</p><div class="egyV2CheckGrid">'+checks.map((c,i)=>'<label><span>'+esc(c)+'</span><select data-egyv2-check="'+i+'"><option value="Non verificato">Non verificato</option><option value="Funzionante">Funzionante</option><option value="Difettoso">Difettoso</option><option value="Non applicabile">Non applicabile</option></select></label>').join("")+'</div>';
  note.closest("label").after(div);
  const techLabel=document.createElement("label");techLabel.className="egyV2Tech";
  techLabel.innerHTML='<span>Tecnico assegnato (facoltativo)</span><select id="egyV2Technician"><option value="">Da assegnare</option></select>';
  div.before(techLabel);
  async function loadTechnicians(){
   try{
    const {data:{user}}=await sb.auth.getUser();if(!user)return;
    const {data:me,error:pe}=await sb.from("beparytech_profiles").select("workspace_owner_id,active").eq("user_id",user.id).single();
    if(pe||!me?.active)return;
    const {data:rows,error}=await sb.from("beparytech_profiles").select("username,role").eq("workspace_owner_id",me.workspace_owner_id).eq("active",true).limit(100);
    if(error)throw error;
    const select=techLabel.querySelector("select");
    for(const person of rows||[]){
      if(!person.username||[...select.options].some(o=>o.value===person.username))continue;
      select.add(new Option(person.username,person.username));
    }
   }catch(err){console.warn("EGYPHONE: tecnici non disponibili",err);}
  }
  loadTechnicians();
  // Capture submit before the existing handler, preserving original content.
  form.addEventListener("submit",e=>{
   if(!active())return;
   const selected=[...div.querySelectorAll("select")].map(s=>({title:checks[Number(s.dataset.egyv2Check)],value:s.value})).filter(x=>x.value!=="Non verificato");
   const base=note.value.split("\n[CHECK V2]")[0].trim();
   if(!selected.length){note.value=base;return;}
   const serialized="\n[CHECK V2] "+selected.map(x=>x.title+": "+x.value).join("; ");
   if((base+serialized).length>500){e.preventDefault();e.stopImmediatePropagation();const msg=document.getElementById("quickRepairMsg");if(msg)msg.textContent="Checklist troppo lunga: riduci la nota per rientrare nei 500 caratteri.";return;}
   note.value=base+serialized;
  },true);
  form.addEventListener("reset",()=>setTimeout(()=>div.querySelectorAll("select").forEach(s=>s.value="Non verificato"),0));
  installed=true;
 }
 document.addEventListener("egyphone:active",mount);window.addEventListener("load",mount);
 let n=0;const timer=setInterval(()=>{mount();if(installed||++n>20)clearInterval(timer);},1000);
})();