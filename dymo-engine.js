/* BeparyTech DYMO engine. Direct transport only; no browser print fallback. */
(function(global){
'use strict';
let discovery=null, tail=Promise.resolve(), lastLabel=null;
const ENGINE_VERSION="2.2 RC4";
const pending=new Map(), acceptedRecently=new Map(), journal=[];
function log(stage,message){journal.push({time:new Date().toISOString(),stage,message:String(message).slice(0,350)});if(journal.length>60)journal.shift();const el=document.getElementById('dymoDiagnosticLog');if(el)el.textContent=journal.map(x=>`${x.time} · ${x.stage} · ${x.message}`).join('\n');}
function error(message,kind='blocked'){return Object.assign(new Error(message),{kind});}
function localBase(value){
  if(!value)return '';
  const u=new URL(value);
  if(!['localhost','127.0.0.1'].includes(u.hostname)||u.username||u.password||u.search||u.hash||!u.port||Number(u.port)<1||Number(u.port)>65535)throw error('Indirizzo servizio non valido: usa localhost o 127.0.0.1 con una porta da 1 a 65535.');
  if(u.protocol!=='https:'&&!(location.protocol==='http:'&&u.protocol==='http:'))throw error('Il sito HTTPS richiede un servizio DYMO HTTPS.');
  if(!['/','/DYMO/DLS/Printing','/DYMO/DLS/Printing/'].includes(u.pathname))throw error('Percorso DYMO non valido.');
  return u.origin+'/DYMO/DLS/Printing';
}
function candidates(cfg){
  const list=[];
  for(const v of [cfg.customEndpoint,cfg.endpoint])if(v){try{list.push(localBase(v));}catch(e){if(v===cfg.customEndpoint)throw e;}}
  const schemes=location.protocol==='http:'?['https','http']:['https'];
  for(const scheme of schemes)for(const host of ['localhost','127.0.0.1'])for(const port of [41951,41952,41953,41954,41955,41956,41957,41958,41959,41960,62170])list.push(`${scheme}://${host}:${port}/DYMO/DLS/Printing`);
  return [...new Set(list)];
}
async function probe(base){
  try{
    const r=await btFetchTimeout(base+'/StatusConnected',{},1400),text=(await r.text()).trim();
    if(!r.ok||!['true','"true"','1'].includes(text.toLowerCase()))return null;
    const info=await btGetDymoPrintersFromBase(base);
    return {base,...info};
  }catch{return null;}
}
async function discover(force=false){
  if(discovery)return discovery;
  discovery=(async()=>{
    btSetDymoStatus('Ricerca servizio e stampanti DYMO…','Wait');
    const cfg=btGetDymoConfig(),list=candidates(cfg);let fallback=null;
    // Read-only probes in small batches. A service without printers must not hide another one.
    for(let i=0;i<list.length;i+=4){
      const results=await Promise.all(list.slice(i,i+4).map(probe));
      for(const item of results){if(!item)continue;fallback ||= item;
        if(item.devices.some(x=>x.connected&&(cfg.printer?x.name===cfg.printer:true))){btDymoEndpoint=item.base;log('servizio',item.base);return item;}
        if(!cfg.printer&&item.printers.length)fallback=item;
      }
    }
    if(fallback){btDymoEndpoint=fallback.base;return fallback;}
    throw error('Servizio DYMO non raggiungibile. Avvia DYMO Connect/Web Service su questo PC; verifica il certificato locale e il permesso del browser per l’accesso alla rete locale. Usa Diagnostica per riprovare.');
  })();
  try{return await discovery;}finally{discovery=null;}
}
function showPrinters(info){
  const sel=document.getElementById('dymoPrinterSelect');if(!sel)return;
  sel.innerHTML='<option value="">Automatico (una sola stampante collegata)</option>'+info.devices.map(x=>`<option value="${escapeHtml(x.name)}">${escapeHtml(x.name)}${x.connected?'':' — offline'}</option>`).join('');
  const saved=btGetDymoConfig().printer;sel.value=info.printers.includes(saved)?saved:'';
}
function choose(info,cfg){
  const connected=info.devices.filter(x=>x.connected);
  if(cfg.printer){const selected=info.devices.find(x=>x.name===cfg.printer);if(!selected)throw error('La stampante salvata non è presente. Seleziona quella corretta nelle Impostazioni DYMO.');if(!selected.connected)throw error('La stampante selezionata risulta offline. Controlla alimentazione, USB/rete, rotolo e coda di stampa.');return selected;}
  if(connected.length===1)return connected[0];
  if(connected.length>1)throw error('Sono collegate più stampanti DYMO: scegli quella da usare nelle Impostazioni.');
  throw error('Servizio DYMO attivo, ma nessuna stampante risulta collegata. Controlla alimentazione e collegamento al PC.');
}
async function detect(force=true){
  try{const info=await discover(force);showPrinters(info);const printer=choose(info,btGetDymoConfig());btSaveDymoConfig({endpoint:info.base});btSetDymoStatus(`Pronta · ${printer.name}`,'Ok');log('stampante',printer.name);return info.printers;}
  catch(e){btSetDymoStatus(e.message,'Err');log('errore',e.message);throw e;}
}
function printParams(cfg){
  if(!cfg.parameters||cfg.parameters==='auto'||cfg.parameters==='driver')return '';
  const roll=['Auto','Left','Right'].includes(cfg.roll)?cfg.roll:'Auto';
  const quality=['Auto','Text','BarcodeAndGraphics'].includes(cfg.quality)?cfg.quality:'Auto';
  return `<LabelWriterPrintParams><Copies>1</Copies><JobTitle>BeparyTech</JobTitle><PrintQuality>${quality}</PrintQuality><TwinTurboRoll>${roll}</TwinTurboRoll></LabelWriterPrintParams>`;
}
function templateXml(template,data){
  if(template.length>250000||/<!DOCTYPE|<!ENTITY|<script\b/i.test(template))throw error('Modello non consentito o troppo grande.');
  const parsed=new DOMParser().parseFromString(template,'application/xml');
  if(parsed.querySelector('parsererror')||!['DesktopLabel','DieCutLabel','ContinuousLabel'].includes(parsed.documentElement.localName))throw error('Seleziona un file .dymo/.label XML valido salvato da DYMO.');
  const values={TITLE:data.title||'BEPARYTECH',META:data.meta||'',NOTE:data.note||'',QR:data.qrText||''};
  return template.replace(/\{\{(TITLE|META|NOTE|QR)\}\}/g,(_,key)=>btXmlEscape(values[key]));
}
// DYMO's Windows parser needs a whitespace node inside Color, even though
// an empty XML element is valid. See dymosoftware/dymo-connect-framework #10.
function normalizeLabelXml(xml){
  return String(xml).replace(/<Color\b([^<>]*?)\s*\/>/g,'<Color$1> </Color>')
    .replace(/(<Color\b[^>]*>)\s*<\/Color>/g,'$1 </Color>');
}
function responseText(raw){
  try{const value=JSON.parse(raw);if(typeof value==='string')return value;
    if(value&&typeof value==='object')return [value.exceptionMessage,value.message].filter(Boolean).join(' · ')||String(raw);
  }catch{}
  return String(raw||'');
}
function detail(raw){return responseText(raw).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,600);}
function labelModes(cfg){
  const native=global.BeparyNativeDymo;
  if(!cfg.template&&cfg.format!=='legacy'&&native&&native.supports(getRepairLabelSettingsV92()))return ['native'];
  const remembered=cfg.labelMode==='legacy'?'legacy':'modern';
  return cfg.template?['template']:(!cfg.format||cfg.format==='auto')?[remembered,remembered==='modern'?'legacy':'modern']:[cfg.format];
}
async function buildLabel(mode,cfg,data){
  const raw=mode==='native'?global.BeparyNativeDymo.build(data,getRepairLabelSettingsV92(),data.qrText?await btDymoLabelXml(data):''):mode==='template'?templateXml(cfg.template,data):mode==='legacy'?btDymoLegacyLabelXml(data):await btDymoLabelXml(data);
  const xml=normalizeLabelXml(raw);
  lastLabel={xml,extension:/<DesktopLabel\b/.test(xml)?'dymo':'label'};
  return xml;
}
async function renderCheck(base,printer,labelXml,cfg){
  // RenderLabel produces an image only: it never enqueues a print job.
  const body=new URLSearchParams({labelXml,renderParamsXml:'',printerName:printer.name}).toString();
  let r,raw;
  try{r=await btFetchTimeout(base+'/RenderLabel',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body},Math.max(5000,Math.min(30000,Number(cfg.timeout)||15000)));raw=await r.text();}
  catch{throw error('Verifica etichetta non completata: il servizio DYMO non ha risposto. Nessun comando di stampa inviato.','preflight');}
  if([404,405].includes(r.status)){log('verifica','Anteprima non supportata da questo servizio; verifica disponibile solo durante la stampa.');return {supported:false};}
  const value=responseText(raw).trim().replace(/^data:image\/png;base64,/, '').replace(/\s+/g,'');
  if(r.status>=200&&r.status<300&&/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value))return {supported:true,png:value};
  const message=detail(raw)||'risposta vuota o anteprima non valida';
  log('verifica rifiutata',`${r.status} · ${message}`);
  return {supported:true,failed:true,message:`${r.status} · ${message}`};
}
function classifyResponse(status,txt,action){
  const raw=String(txt||'').trim();let value=raw;
  try{value=JSON.parse(raw);}catch{}
  const message=typeof value==='string'?value:raw;
  if([404,405].includes(status))return 'action';
  // Only retry when the service explicitly rejected a schema/parameter before printing.
  if((status===400||status===422||status===200)&&/not declared|invalid (?:label|xml|print param)|schema|unsupported (?:label|format)|cannot deserialize|unexpected element/i.test(message))return 'format';
  if(/object reference not set|NullReferenceException/i.test(message)){log('errore stampa',`${status} · ${detail(txt)}`);throw error('Il servizio DYMO ha generato un errore interno durante la stampa (Object reference not set). La coda vuota non risolve questo errore. Prova la stessa etichetta da DYMO Connect e scarica la diagnostica del gestionale. Nessun reinvio automatico.','uncertain');}
  if(status<200||status>=300){log('risposta',`${status} · ${message}`);throw error(`Servizio DYMO: risposta ${status}${message?' · '+message.replace(/<[^>]*>/g,' ').slice(0,240):''}. Apri Impostazioni e DYMO → Diagnostica per i dettagli. Controlla la coda prima di riprovare; nessun reinvio automatico.`,'uncertain');}
  if(value===false||/^(false|null)$/i.test(raw)||/error|exception|failed|invalid/i.test(message))throw error('La DYMO ha rifiutato il lavoro. Controlla stampante e diagnostica; nessuna pagina di stampa è stata aperta.');
  if(action==='PrintLabel2'&&!/^(?:"?\d+"?)$/.test(raw))throw error('Risposta DYMO non riconosciuta. Controlla la coda prima di riprovare.','uncertain');
  if(action==='PrintLabel'&&raw!==''&&value!==true&&value!==''&&!/^\d+$/.test(String(value)))throw error('Risposta DYMO non riconosciuta. Controlla la coda prima di riprovare.','uncertain');
  return 'accepted';
}
async function perform(data){
  const cfg=btGetDymoConfig();if(cfg.enabled===false)throw error('Attiva “Stampa diretta” nelle Impostazioni DYMO.');
  const info=await discover(false);showPrinters(info);const printer=choose(info,cfg);
  if(/Tape|LabelManager/i.test(printer.type)&&!cfg.template)throw error('Per una stampante a nastro importa un modello nativo creato in DYMO con la larghezza del nastro installato.');
  const modes=labelModes(cfg);
  const failures=[];
  const first=cfg.printAction==='PrintLabel2'?'PrintLabel2':'PrintLabel',actions=[first,first==='PrintLabel'?'PrintLabel2':'PrintLabel'];
  for(const mode of modes){
    const labelXml=await buildLabel(mode,cfg,data);
    btSetDymoStatus('Verifica etichetta prima della stampa…','Wait');
    log('verifica',`${ENGINE_VERSION} · ${printer.name} · ${mode}`);
    const check=await renderCheck(info.base,printer,labelXml,cfg);
    if(check.failed){failures.push(`${mode}: ${check.message}`);continue;}
    const paramOptions=cfg.parameters==='auto'||!cfg.parameters?[printParams(cfg),'']:[printParams(cfg)];
    for(const params of [...new Set(paramOptions)]){
      for(const action of actions){
        const body=new URLSearchParams({printerName:printer.name,printParamsXml:params,labelXml,labelSetXml:''}).toString();
        log('invio',`${printer.name} · ${mode} · ${action}`);
        let response,text;
        try{response=await btFetchTimeout(info.base+'/'+action,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body},Math.max(5000,Math.min(30000,Number(cfg.timeout)||15000)));text=await response.text();}
        catch{throw error('Risposta al comando di stampa non ricevuta. Il lavoro potrebbe essere già in coda: controlla la stampante prima di riprovare. Nessun reinvio automatico.','uncertain');}
        const outcome=classifyResponse(response.status,text,action);
        if(outcome==='action')continue;
        if(outcome==='format'){log('compatibilità','Formato/parametri rifiutati prima della stampa');break;}
        btSaveDymoConfig({endpoint:info.base,labelMode:mode==='template'?cfg.labelMode:mode,printAction:action});
        btSetDymoStatus(`Lavoro accettato dal servizio · ${printer.name}`,'Ok');log('accettato',`${printer.name} · ${mode}`);return true;
      }
    }
  }
  if(failures.length===modes.length)throw error('DYMO non riesce a elaborare l’etichetta. Nessun comando di stampa inviato. '+failures.join(' | ')+'. Importa un modello salvato da DYMO Connect su questo PC oppure scarica la diagnostica.','preflight');
  throw error('Nessun formato accettato dal servizio. Prova a importare un modello .dymo/.label creato con il software DYMO installato su questo PC.');
}
function print(data){
  const key=JSON.stringify(data);if(pending.has(key))return pending.get(key);
  const now=Date.now();for(const [k,t] of acceptedRecently)if(now-t>1200)acceptedRecently.delete(k);
  if(acceptedRecently.has(key)){btSetDymoStatus('Questo lavoro è appena stato inviato: doppio clic ignorato.','Ok');return Promise.resolve(true);}
  const job=tail.then(()=>perform(data)).then(result=>{acceptedRecently.set(key,Date.now());return result;}).catch(e=>{btSetDymoStatus(e.message,'Err');log(e.kind||'errore',e.message);throw e;});
  pending.set(key,job);tail=job.catch(()=>{});job.finally(()=>pending.delete(key)).catch(()=>{});return job;
}
async function diagnostics(){
  log('versione',ENGINE_VERSION);
  if(global.BeparyNativeDymo)log('modello nativo','gestionale.dymo · DYMOLabel v3 · 1933084 Drbl 2-1/4 x 1-1/4 in');
  log('ambiente',`${navigator.userAgent} · ${location.protocol}`);
  const preview=document.getElementById('dymoDiagnosticPreview');if(preview){preview.hidden=true;preview.removeAttribute('src');}
  try{
    const cfg=btGetDymoConfig(),info=await discover(true);showPrinters(info);const printer=choose(info,cfg);
    log('stampante',`${printer.name} · ${printer.type}`);
    log('impostazioni',JSON.stringify({format:cfg.format||'auto',parameters:cfg.parameters||'auto',template:!!cfg.template,geometry:typeof getRepairLabelSettingsV92==='function'?getRepairLabelSettingsV92():{}}));
    if(global.BeparyNativeDymo&&global.BeparyNativeDymo.supports(getRepairLabelSettingsV92())){
      log('modello originale','Verifica del file allegato, con testo TEST e senza stampa');
      const original=await renderCheck(info.base,printer,normalizeLabelXml(global.BeparyNativeDymo.source()),cfg);
      log('modello originale',original.png?'Elaborazione riuscita':original.failed?'Elaborazione fallita: '+original.message:'Anteprima non supportata');
    }
    let passed=0,supported=0;
    for(const mode of labelModes(cfg)){
      const xml=await buildLabel(mode,cfg,{title:'BEPARYTECH TEST',meta:'Verifica compatibilità',note:'Etichetta di prova: nessuna stampa inviata.',qrText:''});
      log('formato',mode);
      const result=await renderCheck(info.base,printer,xml,cfg);
      if(result.supported)supported++;
      if(result.png){passed++;log('anteprima',`${mode}: elaborazione riuscita`);if(preview){preview.src='data:image/png;base64,'+result.png;preview.hidden=false;}}
    }
    if(passed)btSetDymoStatus('Etichetta elaborata dal servizio. Ora puoi provare la stampa.','Ok');
    else if(supported)btSetDymoStatus('Elaborazione etichetta fallita. Scarica la diagnostica; nessuna stampa inviata.','Err');
    else btSetDymoStatus('Stampante rilevata, ma questo servizio non supporta la verifica etichetta.','Wait');
    log('diagnosi',`${passed} formati elaborati; nessun comando di stampa inviato.`);
  }catch(e){btSetDymoStatus(e.message,'Err');log('diagnosi',e.message);}
}

function bind(){
  const cfg=btGetDymoConfig();
  for(const [id,key] of Object.entries({dymoFormatMode:'format',dymoRoll:'roll',dymoQuality:'quality',dymoParameters:'parameters',dymoTimeout:'timeout',dymoCustomEndpoint:'customEndpoint'})){
    const el=document.getElementById(id);if(!el)continue;if(cfg[key]!=null)el.value=cfg[key];
    el.addEventListener('change',()=>{try{const value=key==='customEndpoint'?localBase(el.value.trim()):el.value;btSaveDymoConfig({[key]:value});log('impostazioni','Configurazione salvata su questo PC.');}catch(e){el.value=btGetDymoConfig()[key]||'';btSetDymoStatus(e.message,'Err');}});
  }
  document.getElementById('dymoDiagnoseBtn')?.addEventListener('click',diagnostics);
  document.getElementById('dymoExportLabelBtn')?.addEventListener('click',()=>{if(!lastLabel){btSetDymoStatus('Esegui prima la diagnostica o una prova di stampa.','Wait');return;}downloadBlobText('BeparyTech_etichetta.'+lastLabel.extension,lastLabel.xml,'application/xml;charset=utf-8');});
  document.getElementById('dymoExportLogBtn')?.addEventListener('click',()=>downloadBlobText('BeparyTech_DYMO_diagnostica.txt',journal.map(x=>`${x.time} ${x.stage}: ${x.message}`).join('\n'),'text/plain;charset=utf-8'));
  document.getElementById('dymoResetConnectionBtn')?.addEventListener('click',()=>{btDymoEndpoint='';btSaveDymoConfig({printer:'',endpoint:'',customEndpoint:'',format:'auto',parameters:'auto',roll:'Auto',quality:'Auto',timeout:15000,printAction:'PrintLabel',labelMode:'modern'});for(const [id,value] of Object.entries({dymoCustomEndpoint:'',dymoFormatMode:'auto',dymoParameters:'auto',dymoRoll:'Auto',dymoQuality:'Auto',dymoTimeout:'15000'})){const el=document.getElementById(id);if(el)el.value=value;}void diagnostics();});
  const name=document.getElementById('dymoTemplateName');if(name)name.textContent=cfg.templateName||'Nessun modello importato';
  document.getElementById('dymoTemplateFile')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>250000)throw error('File troppo grande (massimo 250 KB).');const xml=await file.text();templateXml(xml,{});btSaveDymoConfig({template:xml,templateName:file.name});name.textContent=file.name;log('modello','Modello DYMO importato.');}catch(err){btSetDymoStatus(err.message,'Err');}finally{e.target.value='';}});
  document.getElementById('dymoClearTemplateBtn')?.addEventListener('click',()=>{btSaveDymoConfig({template:'',templateName:''});name.textContent='Nessun modello importato';});
}
global.BeparyDymo={print,discover,detect,diagnostics,localBase,classifyResponse,templateXml,normalizeLabelXml,renderCheck,journal};
document.addEventListener('DOMContentLoaded',bind);
})(window);
