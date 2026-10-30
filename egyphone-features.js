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
  async function lookupInvoiceVat(form,kind,seq){
    const isIssuer=kind==="issuer", prefix=isIssuer?"issuer":"customer", vatInput=form.elements.namedItem(prefix+"Vat");
    const status=document.getElementById("egyInvoiceStatus");
    const vat=String(vatInput?.value||"").replace(/^IT/i,"").replace(/\D/g,"");
    if(!/^\d{11}$/.test(vat))return;
    const refs=isIssuer?{name:"issuerName",address:"issuerAddress",zip:"issuerZip",city:"issuerCity",province:"issuerProvince",taxCode:"issuerFiscal"}:
       {name:"customerName",address:"customerAddress",zip:"customerZip",city:"customerCity",province:"customerProvince",taxCode:"customerFiscal",recipient:"customerSdi",pec:"customerPec"};
    const before=Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,form.elements.namedItem(v)?.value||""]));
    status.textContent="Ricerca dati per partita IVA…";
    try{
      const response=await sb.functions.invoke("beparytech-vat-lookup",{body:{vat}});
      if(response.error)throw new Error("Servizio di ricerca non disponibile.");
      if(seq!==lookupInvoiceVat.seq[kind] || String(vatInput.value).replace(/^IT/i,"").replace(/\D/g,"")!==vat)return;
      const data=response.data;if(!data?.found){status.textContent=data?.message||"Nessun risultato: inserisci i dati manualmente.";return;}
      let count=0;
      Object.entries(refs).forEach(([source,key])=>{
        const input=form.elements.namedItem(key),value=data[source];
        if(input && value && input.value===before[source] && !input.value.trim()){input.value=String(value);count++;}
      });
      status.textContent=count?count+" campi precompilati. Verifica sempre i dati prima di salvare.":"Nessun campo vuoto da completare.";
    }catch(err){if(seq===lookupInvoiceVat.seq[kind])status.textContent=err.message+" Compila manualmente.";}
  }
  lookupInvoiceVat.seq={issuer:0,customer:0};
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
    const payment=form.elements.namedItem("receiptPayment");
    if(payment){
      const select=document.createElement("select");select.name="receiptPayment";
      for(const [value,label] of [["Contanti","Contanti"],["Carta / POS","Carta / POS"],["Bancomat","Bancomat"],["Bonifico bancario","Bonifico bancario"],["Satispay","Satispay"],["Pagamento misto","Pagamento misto"],["Altro","Altro"]]){
        select.add(new Option(label,value));
      }
      payment.replaceWith(select);
    }
    const fiscal=form.elements.namedItem("issuerRegime");
    if(fiscal){const sel=document.createElement("select");sel.name="issuerRegime";sel.innerHTML='<option value="">Seleziona regime fiscale…</option><option value="RF01">RF01 · Ordinario</option><option value="RF19">RF19 · Forfettario</option><option value="RF18">RF18 · Altro</option>';fiscal.replaceWith(sel);}
    const vatTimers={};
    ["issuer","customer"].forEach(kind=>{
      const input=form.elements.namedItem(kind+"Vat");if(!input)return;
      const btn=document.createElement("button");btn.type="button";btn.className="secondaryAction";btn.textContent="Cerca partita IVA";btn.style.marginTop="7px";
      input.closest("label").append(btn);
      const call=()=>lookupInvoiceVat(form,kind,++lookupInvoiceVat.seq[kind]);
      btn.addEventListener("click",call);
      input.addEventListener("input",()=>{clearTimeout(vatTimers[kind]);if(/^\d{11}$/.test(input.value.replace(/^IT/i,"").replace(/\D/g,"")))vatTimers[kind]=setTimeout(call,650);});
    });
    const defaults={issuerName:"EGYPTER PHONE DI ABDELRAHMAN TAMER MOHAMED ABDELWAHA",issuerVat:"01753890332",issuerFiscal:"BDLTRM82A01Z336O",issuerAddress:"VIALE DANTE ALIGHIERI 98",issuerCity:"PIACENZA",issuerProvince:"PC"};
    const allFields=[...fields,...receiptFields];
    let saved={};try{saved=JSON.parse(localStorage.getItem(billingKey())||"{}")||{};}catch(_){};allFields.forEach(([k])=>{const v=saved[k]!==undefined?saved[k]:defaults[k];if(typeof v==="string")form.elements.namedItem(k).value=v;});if(!saved.receiptPayment)form.elements.namedItem("receiptPayment").value="Contanti";
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
    function makeReceiptPdf(row){
      if(!window.jspdf?.jsPDF)throw new Error("Modulo PDF non disponibile");
      const doc=new window.jspdf.jsPDF({unit:"mm",format:"a5"});
      doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("EGYPHONE",15,20);
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text(doc.splitTextToSize("EGYPTER PHONE DI ABDELRAHMAN TAMER MOHAMED ABDELWAHA",115),15,26);
      doc.text("Viale Dante Alighieri 98 - Piacenza (PC)",15,35);
      doc.text("P.IVA 01753890332 | C.F. BDLTRM82A01Z336O",15,40);
      doc.text("Tel. 3801246605",15,45);
      doc.setFontSize(10);doc.text("RIEPILOGO DI CORTESIA - NON FISCALE",15,54);
      doc.setFont("helvetica","normal");doc.setFontSize(10);
      let y=64;const line=(label,value)=>{const lines=doc.splitTextToSize(label+": "+(value||"-"),115);doc.text(lines,15,y);y+=lines.length*5+3;};
      line("Numero interno",row.code);
      line("Data",new Date(row.created_at).toLocaleString("it-IT"));
      line("Cliente",row.customer_name||"Cliente generico");line("Telefono",row.customer_phone);
      line("Descrizione",row.description);line("Pagamento",row.payment_method);line("Note",row.notes);
      line("Stato",row.status==="void"?"ANNULLATO":"Emesso");
      y+=3;doc.setFont("helvetica","bold");doc.setFontSize(14);
      doc.text("Totale: "+Number(row.amount).toFixed(2).replace(".",",")+" EUR",15,Math.min(y,175));
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text("Documento non fiscale. Non sostituisce il documento commerciale.",15,193);
      doc.save(row.code+".pdf");
    }
    async function refreshArchive(){
      const panel=wrapper.querySelector("#egyDocArchive");if(!panel)return;
      const {data,error}=await sb.from("beparytech_courtesy_documents")
        .select("code,created_at,customer_name,description,amount,payment_method,status,notes,customer_phone,void_reason,voided_at")
        .order("created_at",{ascending:false}).limit(200);
      if(error){panel.textContent="Archivio non disponibile: "+error.message;return;}
      const rows=data||[];
      panel.innerHTML='<h3>Archivio documenti di cortesia</h3><p>'+rows.length+' documenti recenti · numerazione interna</p>'+
        '<div class="egyArchiveRows">'+rows.map((row,i)=>
          '<div class="egyArchiveItem"><div><strong>'+esc(row.code)+'</strong><small>'+esc(new Date(row.created_at).toLocaleDateString("it-IT"))+
          ' · '+esc(row.customer_name||"Cliente generico")+' · '+esc(row.description)+(row.status==="void"?' · ANNULLATO: '+esc(row.void_reason||""):'')+'</small></div><div><b>'+Number(row.amount).toFixed(2).replace(".",",")+' €</b> <button type="button" data-archive-index="'+i+'">PDF</button>'+(row.status==="issued"?' <button type="button" class="egyVoidBtn" data-void-index="'+i+'">Annulla</button>':'')+'</div></div>'
        ).join("")+'</div>';
      panel.querySelectorAll("[data-archive-index]").forEach(b=>b.addEventListener("click",()=>makeReceiptPdf(rows[Number(b.dataset.archiveIndex)])));
      panel.querySelectorAll("[data-void-index]").forEach(b=>b.addEventListener("click",async()=>{
        const row=rows[Number(b.dataset.voidIndex)];if(!row||row.status!=="issued")return;
        const reason=window.prompt("Motivo annullamento di "+row.code+" (almeno 5 caratteri):");
        if(reason===null)return;
        const clean=reason.trim();if(clean.length<5||clean.length>500){window.alert("Inserisci una motivazione da 5 a 500 caratteri.");return;}
        if(!window.confirm("Confermi annullamento di "+row.code+"? Il numero rimarrà in archivio e non sarà riutilizzato."))return;
        b.disabled=true;
        const {error}=await sb.rpc("bt_void_courtesy_document",{p_code:row.code,p_reason:clean});
        if(error){window.alert("Annullamento non riuscito: "+error.message);b.disabled=false;return;}
        await refreshArchive();
      }));

    }
    const archive=document.createElement("section");archive.id="egyDocArchive";archive.className="egyDocArchive";
    wrapper.append(archive);
    wrapper.querySelector("#egyReceiptPrint").addEventListener("click",async()=>{
      const btn=wrapper.querySelector("#egyReceiptPrint");const read=k=>String(form.elements.namedItem(k)?.value||"").trim();
      const amount=Number(read("receiptAmount").replace(",","."));
      if(!read("receiptDescription")||!Number.isFinite(amount)||amount<=0){status.textContent="Inserisci descrizione e importo valido.";return;}
      btn.disabled=true;status.textContent="Salvataggio documento e assegnazione numero…";
      try{
        const {data,error}=await sb.rpc("bt_issue_courtesy_document",{p_customer_name:read("receiptCustomer"),p_customer_phone:read("receiptPhone"),p_description:read("receiptDescription"),p_amount:amount,p_payment_method:read("receiptPayment")||"Contanti",p_notes:read("receiptNotes")});
        if(error)throw error;
        status.textContent="Documento "+data.code+" salvato. Documento non fiscale.";
        try{makeReceiptPdf(data);}catch(pdfErr){status.textContent="Documento "+data.code+" salvato, ma il PDF non è stato generato: "+pdfErr.message;}
        await refreshArchive();
      }catch(e){status.textContent="Non salvato: "+(e.message||"Errore");}
      finally{btn.disabled=false;}
    });
    refreshArchive().catch(console.warn);
    switchMode("invoice");
  }
  function installQuickClient(){
    const form=document.getElementById("quickRepairForm"),select=document.getElementById("quickRepairClient"),
      wrap=document.getElementById("quickRepairCustomClientWrap"),input=document.getElementById("quickRepairCustomClient");
    if(!form||!select||!wrap||!input)return;
    if(form.dataset.egyQuickClient==="1")return;
    form.dataset.egyQuickClient="1";
    const list=document.createElement("datalist");list.id="egyQuickClientSuggestions";form.append(list);
    input.setAttribute("list",list.id);
    input.setAttribute("autocomplete","off");
    input.placeholder="Scrivi il nome del cliente o scegline uno esistente…";
    select.value="ALTRO";select.dispatchEvent(new Event("change",{bubbles:true}));
    select.closest("label").hidden=true;
    wrap.hidden=false;input.required=true;
    async function loadSuggestions(){
      if(!active())return;
      try{
        const {data:{user}}=await sb.auth.getUser();if(!user)return;
        const {data:profile,error:pe}=await sb.from("beparytech_profiles").select("workspace_owner_id,active").eq("user_id",user.id).maybeSingle();
        if(pe||!profile?.active)return;
        const {data,error}=await sb.from("beparytech_clients").select("display_name").eq("workspace_owner_id",profile.workspace_owner_id).eq("active",true).order("display_name").limit(500);
        if(error)throw error;
        list.replaceChildren(...(data||[]).filter(c=>c.display_name).map(c=>new Option(c.display_name,c.display_name)));
      }catch(err){console.warn("Rubrica EGYPHONE non disponibile",err);}
    }
    input.addEventListener("focus",loadSuggestions);
    form.addEventListener("reset",()=>setTimeout(()=>{if(!active())return;select.value="ALTRO";select.dispatchEvent(new Event("change",{bubbles:true}));wrap.hidden=false;input.required=true;},0));
    loadSuggestions();
  }
  function install(){
    if(!active())return;
    installSearch();billingPanel();installQuickClient();configured=true;
  }
  document.addEventListener("egyphone:active",install);
  window.addEventListener("load",()=>{if(active())install();});
  let n=0;const boot=setInterval(()=>{if(active())install();if(++n>15)clearInterval(boot);},1500);
})();