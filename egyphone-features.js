/* Tenant-only EGYPHONE: repairs lookup and independent billing details.
   Does not change app.js, existing invoice XML, Supabase data or other tenants. */
(()=>{
  let configured=false,searchTimer=0,requestSeq=0;
  const active=()=>document.documentElement.dataset.btBrand==="egyphone";
  const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fields=[
    ["issuerName","Ragione sociale emittente"],["issuerVat","Partita IVA emittente"],["issuerFiscal","Codice fiscale emittente"],
    ["issuerAddress","Indirizzo emittente"],["issuerZip","CAP emittente"],["issuerCity","Comune emittente"],
    ["issuerProvince","Provincia emittente"],["issuerRegime","Regime fiscale emittente"],
    ["customerName","Cliente da fatturare"],["customerVat","Partita IVA cliente"],["customerFiscal","Codice fiscale cliente"],
    ["customerAddress","Indirizzo cliente"],["customerZip","CAP cliente"],["customerCity","Comune cliente"],
    ["customerProvince","Provincia cliente"],["customerSdi","Codice destinatario cliente"],["customerPec","PEC cliente"]
  ];
  async function repairSearch(value){
    const token=++requestSeq,q=String(value||"").trim(),results=document.getElementById("globalSearchResults");
    if(!active()||q.length<3||!results)return;
    try{
      const {data:{user}}=await sb.auth.getUser();if(!user)return;
      const {data:profile,error:pe}=await sb.from("beparytech_profiles").select("workspace_owner_id,active").eq("user_id",user.id).single();
      if(pe||!profile?.active)return;
      const {data,error}=await sb.from("beparytech_admin_repairs").select("id,practice_code,device,client_name,repair_status").eq("workspace_owner_id",profile.workspace_owner_id).ilike("practice_code","%"+q.replace(/[%_]/g,"")+"%").limit(12);
      if(error)throw error;
      if(token!==requestSeq||!active()||String(document.getElementById("globalSearch")?.value||"").trim()!==q)return;
      const old=results.querySelector(".egyRepairSearchItems");if(old)old.remove();
      if(!(data||[]).length)return;
      const box=document.createElement("div");box.className="egyRepairSearchItems";
      box.innerHTML=(data||[]).map(r=>'<button type="button" class="globalResult egyRepairOpen" data-code="'+esc(r.practice_code)+'"><span><strong>Riparazione '+esc(r.practice_code)+'</strong><small>'+esc(r.device)+' · '+esc(r.client_name)+' · '+esc(r.repair_status)+'</small></span></button>').join("");
      results.append(box);results.hidden=false;
      box.querySelectorAll("button").forEach(button=>button.onclick=()=>{
        const code=button.dataset.code;results.hidden=true;
        if(typeof setCategory==="function")setCategory("RiparazioniAdmin");
        const input=document.getElementById("adminRepairSearch");
        if(input){input.value=code;input.dispatchEvent(new Event("input",{bubbles:true}));}
        if(typeof loadAdminRepairsV95==="function")loadAdminRepairsV95().catch(console.warn);
      });
    }catch(err){console.warn("Ricerca riparazioni EGYPHONE",err);}
  }
  function installSearch(){
    const input=document.getElementById("globalSearch");if(!input||input.dataset.egyRepairSearch)return;
    input.dataset.egyRepairSearch="1";
    input.placeholder="Cerca prodotti, riparazioni o ultime 5 cifre della pratica...";
    input.addEventListener("input",()=>{clearTimeout(searchTimer);requestSeq++;searchTimer=setTimeout(()=>repairSearch(input.value),240);});
  }
  function billingKey(){return "egyphone-invoice-fields-v1";}
  function billingPanel(){
    const container=document.getElementById("adminInvoicesPanel");
    if(!container||container.querySelector("#egyInvoiceForm"))return;
    [...container.children].forEach(el=>{el.dataset.egyLegacyHidden="1";el.style.display="none";});
    const wrapper=document.createElement("section");wrapper.id="egyInvoiceForm";wrapper.style.cssText="background:#12283d;border:1px solid #38536a;border-radius:16px;padding:20px;color:#f4f0e6;margin:12px 0;";
    wrapper.innerHTML='<h2 style="margin:0 0 8px;color:#f4d48e">Fatturazione EGYPHONE</h2><p style="color:#bfccd8">Inserisci i dati fiscali del negozio e del cliente. Tutti i campi partono vuoti e puoi salvarli su questo dispositivo.</p>'+
      '<form id="egyInvoiceDetails"><div class="egyInvoiceFields">'+fields.map(([key,label])=>'<label style="display:grid;gap:6px;font-size:13px;color:#e3edf5">'+esc(label)+'<input autocomplete="off" name="'+esc(key)+'" placeholder="'+esc(label)+'" style="width:100%;min-width:0;padding:12px;background:#0c1e30;border:1px solid #4a637a;border-radius:9px;color:#f7f4eb"></label>').join("")+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button type="submit" class="primaryAction">Salva dati fatturazione</button><button type="button" id="egyInvoiceClear" class="secondaryAction">Svuota campi</button></div><p id="egyInvoiceStatus" aria-live="polite" style="color:#eac579"></p></form>'+
      '<p style="color:#bbcbdb;font-size:12px;margin-top:14px">Questa scheda salva i dati sul dispositivo; la generazione della fattura XML EGYPHONE non è ancora attivata. Non usare la vecchia fatturazione RIPARALO/VR Trasporti.</p>';
    container.prepend(wrapper);
    const form=wrapper.querySelector("form"),status=wrapper.querySelector("#egyInvoiceStatus");
    try{const saved=JSON.parse(localStorage.getItem(billingKey())||"{}");fields.forEach(([k])=>{if(typeof saved[k]==="string")form.elements.namedItem(k).value=saved[k];});}catch(_){}
    form.addEventListener("submit",e=>{e.preventDefault();const values={};fields.forEach(([key])=>values[key]=String(form.elements.namedItem(key)?.value||"").trim());try{localStorage.setItem(billingKey(),JSON.stringify(values));status.textContent="Dati fatturazione salvati su questo dispositivo.";}catch(err){status.textContent="Impossibile salvare i dati: "+err.message;}});
    wrapper.querySelector("#egyInvoiceClear").addEventListener("click",()=>{form.reset();localStorage.removeItem(billingKey());status.textContent="Campi svuotati.";});
  }
  function install(){
    if(!active())return;
    installSearch();billingPanel();configured=true;
  }
  document.addEventListener("egyphone:active",install);
  window.addEventListener("load",()=>{if(active())install();});
  let n=0;const boot=setInterval(()=>{if(active())install();if(++n>15)clearInterval(boot);},1500);
})();