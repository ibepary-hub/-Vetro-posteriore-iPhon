
(()=>{"use strict";
let admin=false,rec=null;
const style=document.createElement("style");style.textContent=[
"#btJarvisLaunch[hidden],#btJarvisModal[hidden]{display:none!important}",
"#btJarvisModal{position:fixed;inset:0;z-index:999999;background:#020a14eF;display:flex;align-items:center;justify-content:center;padding:12px}",
"#btJarvisBox{width:min(100%,670px);height:min(92dvh,820px);display:flex;flex-direction:column;background:radial-gradient(circle at 50% 20%,#17465d,#061827 55%,#030b14);border:1px solid #30738b;border-radius:22px;overflow:hidden;color:#e5f8ff;font-family:-apple-system,BlinkMacSystemFont,sans-serif}",
".btJHeader{padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #265066}.btJHeader strong{letter-spacing:3px;color:#76efff;font-size:20px}.btJHeader small{display:block;color:#9cb9c8;font-size:11px;margin-top:4px}",
"#btJarvisBox button{cursor:pointer;touch-action:manipulation;border:1px solid #386b80;border-radius:11px;background:#124257;color:#e8fbff;padding:10px}",
".btJOrb{width:110px;height:110px;margin:15px auto 7px;display:grid;place-items:center;border-radius:50%;color:white;font-size:25px;font-weight:800;background:radial-gradient(circle,#a8ffff 0%,#23afd5 17%,#125477 36%,#0a2033 72%);border:2px solid #89edff;box-shadow:0 0 38px #00bce988;animation:btJPulse 3s infinite}",
"@keyframes btJPulse{50%{transform:scale(1.045);box-shadow:0 0 60px #00cfffaa}}",
".btJStatus{text-align:center;font-size:12px;color:#8edff0;margin-bottom:10px}",
".btJMessages{flex:1;min-height:60px;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:12px}",
".btJMsg{max-width:90%;align-self:flex-start;background:#123247;border:1px solid #27536a;border-radius:13px;padding:10px 12px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}.btJMsg.me{align-self:flex-end;background:#075a70}",
".btJQuick{display:flex;gap:7px;flex-wrap:wrap;padding:9px}.btJQuick button{font-size:12px}",
".btJInput{display:flex;gap:8px;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));border-top:1px solid #265066}",
".btJInput input{min-width:0;flex:1;background:#071f31;border:1px solid #32657c;border-radius:10px;color:white;padding:12px;font-size:16px}"
].join("");document.head.append(style);
const launch=document.createElement("button");launch.type="button";launch.id="btJarvisLaunch";launch.className="menuItem adminOnly";launch.hidden=true;
launch.innerHTML='<span class="menuIcon">✦</span><span><strong>JARVIS</strong><small>Assistente · Solo Admin</small></span>';
document.querySelector(".menuNav")?.append(launch);
const modal=document.createElement("div");modal.id="btJarvisModal";modal.hidden=true;
modal.innerHTML='<section id="btJarvisBox" role="dialog" aria-modal="true" aria-label="JARVIS"><div class="btJHeader"><div><strong>J.A.R.V.I.S.</strong><small>BEPARYTECH · ADMIN</small></div><button id="btJClose" type="button" aria-label="Chiudi">✕</button></div><div class="btJOrb">AI</div><div class="btJStatus">SISTEMA PRONTO</div><div class="btJMessages" aria-live="polite"></div><div class="btJQuick"><button data-jcmd="Che ore sono?">Ora</button><button data-jcmd="Che data è oggi?">Data</button><button data-jcmd="Mostra appunti">Appunti</button><button data-jcmd="Aiuto">Comandi</button></div><form class="btJInput"><button id="btJMic" type="button" aria-label="Microfono">🎙</button><input aria-label="Comando" placeholder="Chiedi a JARVIS…" autocomplete="off"><button type="submit">➤</button></form></section>';
document.body.append(modal);
const messages=modal.querySelector(".btJMessages"),status=modal.querySelector(".btJStatus"),field=modal.querySelector("input");
function bubble(t,me=false){const e=document.createElement("div");e.className="btJMsg"+(me?" me":"");e.textContent=t;messages.append(e);messages.scrollTop=messages.scrollHeight}
function speak(s){try{if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s);u.lang="it-IT";speechSynthesis.speak(u)}}catch(e){}}
function getNotes(){try{return JSON.parse(localStorage.getItem("bt-jarvis-notes")||"[]")}catch(e){return []}}
function reply(text){
const q=text.toLowerCase().trim();
if(/^(ciao|salve|buongiorno)/.test(q))return "Salve, JARVIS operativo.";
if(/(ora|ore sono|orario)/.test(q))return "Sono le "+new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})+".";
if(/(data|che giorno|oggi che giorno)/.test(q))return "Oggi è "+new Date().toLocaleDateString("it-IT",{dateStyle:"full"})+".";
if(/^(ricorda|salva appunto|prendi nota)\b/.test(q)){const v=text.replace(/^(ricorda|salva appunto|prendi nota)\s*[:\-]?\s*/i,"").trim();if(!v)return "Dimmi il contenuto dell'appunto.";const n=getNotes();n.push(v);try{localStorage.setItem("bt-jarvis-notes",JSON.stringify(n.slice(-100)))}catch(e){return "Impossibile salvare l'appunto su questo dispositivo."}return "Appunto salvato su questo iPhone."}
if(/(mostra appunti|leggi appunti|miei appunti)/.test(q)){const n=getNotes();return n.length?n.slice(-10).map((x,i)=>(i+1)+". "+x).join("\n"):"Non hai ancora appunti."}
if(/^(calcola|quanto fa)\s+/.test(q)){let e=q.replace(/^(calcola|quanto fa)\s+/,"").replace(/,/g,".").replace(/ per /g,"*").replace(/ diviso /g,"/").replace(/ più /g,"+").replace(/ meno /g,"-").replace(/ x /g,"*").replace(/\s/g,"");
if(!/^\d+(?:\.\d+)?\s*[\+\-*\/]\s*\d+(?:\.\d+)?$/.test(e))return "Prova: calcola 25 * 4.";
const m=e.match(/^(\d+(?:\.\d+)?)([\+\-*\/])(\d+(?:\.\d+)?)$/),a=Number(m[1]),b=Number(m[3]);const r=m[2]==="+"?a+b:m[2]==="-"?a-b:m[2]==="*"?a*b:a/b;return Number.isFinite(r)?"Risultato: "+r.toLocaleString("it-IT"):"Calcolo non valido."}
if(/(aiuto|comandi|cosa sai fare)/.test(q))return "Puoi chiedermi ora, data, calcoli semplici e appunti. Esempi: «calcola 8 * 5», «salva appunto ordinare display», «mostra appunti».";
if(/meteo/.test(q))return "Per il meteo aggiornato consulta l'app Meteo di iPhone. Questa versione non ha dati meteo in diretta.";
return "Non ho ancora un modello AI online collegato. Prova ora, data, calcoli e appunti. Scrivi «aiuto» per i comandi.";
}
function send(t){if(!admin||modal.hidden||!t.trim())return;bubble(t,true);const r=reply(t);bubble(r);speak(r);status.textContent="COMANDO ESEGUITO"}
function close(){modal.hidden=true;document.body.style.overflow="";try{rec?.stop();speechSynthesis?.cancel()}catch(e){}}
launch.addEventListener("click",()=>{if(!admin)return;modal.hidden=false;document.body.style.overflow="hidden";if(!messages.childElementCount)bubble("Salve. JARVIS è operativo. Come posso aiutarti?");field.focus()});
modal.querySelector("#btJClose").addEventListener("click",close);modal.addEventListener("click",e=>{if(e.target===modal)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()});
modal.querySelector("form").addEventListener("submit",e=>{e.preventDefault();const t=field.value;field.value="";send(t)});
modal.querySelectorAll("[data-jcmd]").forEach(b=>b.addEventListener("click",()=>send(b.dataset.jcmd)));
modal.querySelector("#btJMic").addEventListener("click",()=>{if(!admin)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){bubble("Il riconoscimento vocale non è disponibile in questo browser. Scrivi il comando.");return}if(rec){rec.stop();rec=null;return}const r=new SR();rec=r;r.lang="it-IT";r.onresult=e=>{if(e.results?.[0]?.[0]?.transcript)send(e.results[0][0].transcript)};r.onerror=e=>{status.textContent="MICROFONO: "+e.error};r.onend=()=>{if(rec===r)rec=null;if(status.textContent==="ASCOLTO…")status.textContent="SISTEMA PRONTO"};try{r.start();status.textContent="ASCOLTO…"}catch(e){rec=null;status.textContent="MICROFONO NON DISPONIBILE"}});
window.addEventListener("beparytech:jarvis-role",e=>{admin=e.detail?.admin===true;launch.hidden=!admin;if(!admin)close()});window.addEventListener("pagehide",close);
})();
