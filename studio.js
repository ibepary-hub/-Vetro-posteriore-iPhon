/* BeparyTech Studio: presentation only. Existing authorization/data functions remain authoritative. */
const BT_STUDIO_LABELS={Dashboard:['Il mio spazio','Il laboratorio, sotto controllo.'],RicambiHub:['Magazzino ricambi','Catalogo, giacenze e ricambi per marca e modello.'],DaOrdinareAuto:['Acquisti e scorte','Ricambi sotto soglia e proposte di riordino.'],RiparazioniAdmin:['Riparazioni','Pratiche, lavorazioni, ritiri e consegne.'],AccettazioneRapida:['Nuova accettazione','Cliente, dispositivo e intervento.'],AccettazioneCompleta:['Accettazione con firma','Preventivo, condizioni e firma del cliente.'],VenditeAdmin:['Vendite ricambi','Prezzi, IVA e documenti di vendita.'],Vendite:['Uscite e rientri','Scarichi di magazzino, consegne e resi.'],Clienti:['Clienti','Privati e aziende: anagrafica, contatti e dati fiscali.'],Fatturazione:['Fatture clienti','Periodo, riparazioni e XML per cliente.'],ContoLavorazione:['DDT conto lavorazione','Ingresso, lavorazione e restituzione dispositivi.'],Orari:['Orari e presenze','Ore lavorate, extra e riepiloghi.'],Impostazioni:['Impostazioni e DYMO','Negozi, listini, etichette e preferenze.'],NoteDymo:['Etichette libere','Scrivi e stampa direttamente sulla DYMO.'],Cronologia:['Movimenti magazzino','Carichi, scarichi, rettifiche e storico.'],RitiroUsato:['Ritiro usato','Valutazione, IMEI e documenti di acquisto.']};
function btStudioRepairRows(rows,errorText=''){
  const box=document.getElementById('studioRepairList');if(!box)return;
  if(errorText){box.innerHTML='<div class="emptyState">Impossibile caricare le pratiche. Premi Aggiorna per riprovare.</div>';return;}
  const active=rows.filter(r=>!/consegn|chius|annull/i.test(String(r.repair_status||''))).slice(0,6);
  box.innerHTML=active.length?active.map(r=>`<button type="button" class="studioRepair" data-studio-repair="${escapeHtml(String(r.id||''))}"><span class="studioDeviceIcon" aria-hidden="true">▯</span><span><strong>${escapeHtml(r.device||'Dispositivo')}</strong><small>${escapeHtml(r.repair_type||'Pratica in lavorazione')}</small><small>${escapeHtml(r.practice_code||'Pratica')} · ${escapeHtml(r.client_name||'Cliente')}</small></span><span class="studioRepairStatus">${escapeHtml(r.repair_status||'Da completare')}</span></button>`).join(''):'<div class="emptyState">Nessuna pratica aperta. Puoi iniziare da Nuova accettazione.</div>';
}
function btStudioSync(){
  const home=currentCategory==='Dashboard'||btPreviewMode;
  if(document.body.classList.contains('studio-home')!==home)document.body.classList.toggle('studio-home',home);
  const pair=BT_STUDIO_LABELS[btPreviewMode?'Dashboard':currentCategory];
  if(pair){const name=document.getElementById('categoryName'),description=document.getElementById('categoryDescription'),area=document.getElementById('studioCurrentArea');if(name)name.textContent=pair[0];if(description)description.textContent=pair[1];if(area)area.textContent=pair[0];}
  // The permanent sidebar is exposed to assistive technology only while signed in.
  const menu=document.getElementById('mainMenu');
  if(menu&&window.matchMedia('(min-width:1060px)').matches&&document.body.classList.contains('logged-in'))menu.setAttribute('aria-hidden','false');
  else if(menu&&!menu.classList.contains('open'))menu.setAttribute('aria-hidden','true');
  const admin=isAdmin();
  const choices={home:['Dashboard','⌂','Home'],primary:[admin?'RiparazioniAdmin':'Vendite','⌁',admin?'Pratiche':'Vendite'],scanner:['RicambiHub','▦','Ricambi'],history:[admin?'Clienti':'Cronologia','♧',admin?'Clienti':'Movimenti'],menu:['menu','☰','Altro']};
  document.querySelectorAll('#mobileBottomNav [data-smart-action]').forEach(b=>{const choice=choices[b.dataset.smartAction];if(!choice)return;b.dataset.studioCategory=choice[0];b.querySelector('b').textContent=choice[1];b.querySelector('span').textContent=choice[2];b.classList.toggle('studio-active',currentCategory===choice[0]);});
}
(function(){
  const prior=setCategory;setCategory=function(...args){const result=prior.apply(this,args);btStudioSync();return result;};
  const previousNavigation=updateSmartNavigation;updateSmartNavigation=function(...args){const result=previousNavigation.apply(this,args);btStudioSync();return result;};
  document.addEventListener('DOMContentLoaded',()=>{
    const nav=document.getElementById('mobileBottomNav');
    nav?.addEventListener('click',e=>{const b=e.target.closest('[data-studio-category]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.studioCategory==='menu')openMainMenu();else setCategory(b.dataset.studioCategory);},true);
    document.getElementById('studioRepairsPanel')?.addEventListener('click',async e=>{
      const row=e.target.closest('[data-studio-repair]');if(!row||!isAdmin()||btPreviewMode)return;
      setCategory('RiparazioniAdmin');
      try{await loadAdminRepairs();const record=adminRepairRows.find(r=>String(r.id)===row.dataset.studioRepair);if(record){startAdminRepairEdit(record.id);document.getElementById('adminRepairForm')?.scrollIntoView({behavior:'smooth',block:'start'});}}catch{alert('Apri la pratica dall’elenco Riparazioni.');}
    });
    const bodyObserver=new MutationObserver(btStudioSync);bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    window.matchMedia('(min-width:1060px)').addEventListener('change',btStudioSync);
    btStudioSync();
  });
})();
