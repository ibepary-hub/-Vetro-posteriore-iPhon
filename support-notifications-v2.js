/* Ticket alerts for authorized Super Admin, while management app is open. No background push or email. */
(()=>{
 let installed=false,seen=new Set(),ready=false;
 async function init(){
 if(installed||typeof sb==="undefined")return;
 const {data:{user}}=await sb.auth.getUser();if(!user)return;
 const {data:p}=await sb.from("beparytech_profiles").select("role,active").eq("user_id",user.id).maybeSingle();
 if(!p?.active||p.role!=="super_admin")return;
 const menu=document.getElementById("mainMenu");if(!menu)return;
 installed=true;
 const btn=document.createElement("button");btn.className="egyV2CashNav";btn.textContent="🔔 Notifiche ticket (attiva)";
 menu.append(btn);
 const note=document.createElement("div");note.className="egyV2TicketNotice";note.hidden=true;document.body.append(note);
 btn.onclick=async()=>{if(!("Notification" in window)){btn.textContent="Notifiche browser non disponibili";return;}const permission=await Notification.requestPermission();btn.textContent=permission==="granted"?"🔔 Notifiche ticket attive":"🔕 Notifiche non autorizzate";};
 const poll=async()=>{
  try{
   const {data:{user:current}}=await sb.auth.getUser();if(!current||current.id!==user.id)return;
   const {data,error}=await sb.from("bt_support_tickets").select("id,subject,priority").order("created_at",{ascending:false}).limit(30);
   if(error)return;
   if(!ready){(data||[]).forEach(t=>seen.add(t.id));ready=true;return;}
   const fresh=(data||[]).filter(t=>!seen.has(t.id));(data||[]).forEach(t=>seen.add(t.id));
   if(!fresh.length)return;
   const t=fresh[0];note.textContent=fresh.length+" nuovo/i ticket IT · "+t.subject;note.hidden=false;
   if("Notification" in window&&Notification.permission==="granted")new Notification("BeparyTech · Nuovo ticket IT",{body:t.subject});
  }catch(err){console.warn("Avviso ticket",err);}
 };
 await poll();setInterval(poll,30000);
}
window.addEventListener("load",()=>init().catch(console.warn));let n=0;const timer=setInterval(()=>{init().catch(console.warn);if(installed||++n>15)clearInterval(timer)},1500);
})();