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

  const receiptFields=[["receiptCustomer","Cliente (facoltativo)"],["receiptPhone","Telefono (facoltativo)"],["receiptDescription","Descrizione *"],["receiptAmount","Totale IVA inclusa (€) *"],["receiptPayment","Metodo pagamento"],["receiptNotes","Note (facoltative)"]];
  function makeFields(list){return list.map(([key,label])=>'<label class="egyField"><span>'+esc(label)+'</span><input autocomplete="off" name="'+esc(key)+'" placeholder="'+esc(label)+'" '+(key==="receiptAmount"?'type="number" step="0.01" min="0"':'')+'></label>').join("");}
  function billingPanel(){
    const container=document.getElementById("adminInvoicesPanel");
    if(!container||container.querySelector("#egyInvoiceForm"))return;
    [...container.children].forEach(el=>{el.dataset.egyLegacyHidden="1";el.style.display="none";});
    const wrapper=document.createElement("section");wrapper.id="egyInvoiceForm";
    wrapper.innerHTML='<div class="egyDocHead"><h2>Documenti EGYPHONE</h2><p>Scegli il documento da preparare.</p><div class="egyDocTabs"><button type="button" class="active" data-egy-doc="invoice">Fattura</button><button type="button" data-egy-doc="receipt">Scontrino di cortesia</button></div></div>'+
    '<form id="egyInvoiceDetails"><div id="egyInvoiceColumns" class="egyInvoiceColumns">'+
      '<section class="egyInvoiceColumn"><h3>Dati emittente</h3><p>Informazioni fiscali del negozio</p><div class="egyColumnFields">'+makeFields(fields.slice(0,8))+'</div></section>'+
      '<section class="egyInvoiceColumn"><h3>Dati cliente</h3><p>Destinatario del documento</p><div class="egyColumnFields">'+makeFields(fields.slice(8))+'</div></section></div>'+
      '<section id="egyReceiptSection" class="egyInvoiceColumn" hidden><h3>Scontrino di cortesia</h3><p>Documento non fiscale, utile come riepilogo della vendita.</p><div class="egyColumnFields">'+makeFields(receiptFields)+'</div></section>'+
      '<div class="egyInvoiceActions"><button type="submit" class="primaryAction">Salva dati</button><button type="button" id="egyInvoiceClear" class="secondaryAction">Svuota campi</button><button type="button" id="egyReceiptPrint" class="primaryAction" hidden>Genera PDF non fiscale</button></div><p id="egyInvoiceStatus" aria-live="polite"></p></form>'+
      '<p class="egyInvoiceDisclaimer">La fattura elettronica XML EGYPHONE non è ancora abilitata. Il PDF di cortesia non è uno scontrino fiscale né un documento commerciale valido ai fini fiscali.</p>';
    container.prepend(wrapper);
    const form=wrapper.querySelector("form"),status=wrapper.querySelector("#egyInvoiceStatus");
    const allFields=[...fields,...receiptFields];
    try{const saved=JSON.parse(localStorage.getItem(billingKey())||"{}");allFields.forEach(([k])=>{if(typeof saved[k]==="string")form.elements.namedItem(k).value=saved[k];});}catch(_){}
    const switchMode=mode=>{
      const receipt=mode==="receipt";
      wrapper.querySelector("#egyInvoiceColumns").hidden=receipt;
      wrapper.querySelector("#egyReceiptSection").hidden=!receipt;
      wrapper.querySelector("#egyReceiptPrint").hidden=!receipt;
      wrapper.querySelectorAll("[data-egy-doc]").forEach(b=>b.classList.toggle("active",b.dataset.egyDoc===mode));
      status.textContent="";
    };
    wrapper.querySelectorAll("[data-egy-doc]").forEach(b=>b.addEventListener("click",()=>switchMode(b.dataset.egyDoc)));
    form.addEventListener("submit",e=>{
      e.preventDefault();const values={};
      allFields.forEach(([key])=>values[key]=String(form.elements.namedItem(key)?.value||"").trim());
      try{localStorage.setItem(billingKey(),JSON.stringify(values));status.textContent="Dati salvati soltanto su questo dispositivo.";}
      catch(err){status.textContent="Salvataggio non riuscito: "+err.message;}
    });
    wrapper.querySelector("#egyInvoiceClear").addEventListener("click",()=>{form.reset();localStorage.removeItem(billingKey());status.textContent="Campi svuotati.";});
    wrapper.querySelector("#egyReceiptPrint").addEventListener("click",()=>{
      const read=k=>String(form.elements.namedItem(k)?.value||"").trim();
      const amount=Number(read("receiptAmount").replace(",","."));
      if(!read("receiptDescription")||!Number.isFinite(amount)||amount<=0){status.textContent="Inserisci descrizione e importo valido.";return;}
      if(!window.jspdf?.jsPDF){status.textContent="Modulo PDF non disponibile.";return;}
      const doc=new window.jspdf.jsPDF({unit:"mm",format:"a5"});
      doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("EGYPHONE",15,20);
      doc.setFontSize(10);doc.text("RIEPILOGO DI CORTESIA - NON FISCALE",15,30);
      doc.setFont("helvetica","normal");doc.setFontSize(11);
      let y=43;const line=(label,value)=>{const pieces=doc.splitTextToSize(label+": "+(value||"-"),115);doc.text(pieces,15,y);y+=pieces.length*6+3;};
      line("Data",new Date().toLocaleString("it-IT"));line("Cliente",read("receiptCustomer")||"Cliente generico");line("Telefono",read("receiptPhone"));line("Descrizione",read("receiptDescription"));
      line("Metodo pagamento",read("receiptPayment"));line("Note",read("receiptNotes"));
      y+=5;doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text("Totale: "+amount.toFixed(2).replace(".",",")+" EUR",15,Math.min(y,166));
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("Documento non fiscale. Non sostituisce il documento commerciale.",15,192);
      doc.save("EGYPHONE_Riepilogo_non_fiscale.pdf");
      status.textContent="PDF di cortesia generato. Non valido come scontrino fiscale.";
    });
    switchMode("invoice");
  }
  function install(){
    if(!active())return;
    installSearch();billingPanel();configured=true;
  }
  document.addEventListener("egyphone:active",install);
  window.addEventListener("load",()=>{if(active())install();});
  let n=0;const boot=setInterval(()=>{if(active())install();if(++n>15)clearInterval(boot);},1500);
})();