/* EGYPHONE · solo branding, nessuna modifica a dati, prezzi o login. */
(() => {
  let lastUid = "";
  const logo = "egyphone-brand.svg?v=1";
  function setText(selector,value){const el=document.querySelector(selector);if(el)el.textContent=value;}
  function setLogo(selector){
    const node=document.querySelector(selector);
    if(!node)return;
    node.textContent="";
    const img=document.createElement("img");
    img.src=logo;img.alt="EGYPHONE";img.width=36;img.height=36;
    img.style.cssText="width:36px;height:36px;object-fit:contain;border-radius:7px;";
    node.append(img);
  }
  function apply(){
    setLogo(".menuHead .studioBrandMark");
    setText(".menuHead .menuBrand strong","EGYPHONE");
    setText(".menuHead .menuBrand div > span","CENTRO ASSISTENZA");
    setLogo(".studioWorkspace > span");
    const box=document.querySelector(".studioWorkspace > div");
    if(box){const first=[...box.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(first)first.textContent="EGYPHONE";else box.prepend(document.createTextNode("EGYPHONE"));}
    document.documentElement.dataset.btBrand="egyphone";
    if(document.title.includes("BeparyTech"))document.title="EGYPHONE · Il tuo laboratorio";
  }
  function clearBrand(){
    // Al logout la pagina applica nuovamente lo stato grafico originale.
    delete document.documentElement.dataset.btBrand;
  }
  async function check(){
    if(typeof sb==="undefined")return;
    const {data:{user}}=await sb.auth.getUser();
    if(!user){lastUid="";clearBrand();return;}
    if(lastUid===user.id&&document.documentElement.dataset.btBrand==="egyphone")return;
    const {data:profile,error}=await sb.from("beparytech_profiles").select("workspace_owner_id,active").eq("user_id",user.id).maybeSingle();
    if(error||!profile?.active)return;
    const {data:company,error:ce}=await sb.from("beparytech_companies").select("slug,vat_number").eq("workspace_owner_id",profile.workspace_owner_id).maybeSingle();
    if(ce)return;
    if(String(company?.slug||"").toLowerCase()==="egyphone"||String(company?.vat_number||"").replace(/\D/g,"")==="01753890332"){apply();lastUid=user.id;}
  }
  window.addEventListener("load",()=>{check().catch(console.warn);});
  if(typeof sb!=="undefined")sb.auth.onAuthStateChange(()=>{setTimeout(()=>check().catch(console.warn),250);});
  // Login asincrono e render ritardati: riprova solo durante l'avvio.
  let attempts=0;
  const poll=setInterval(()=>{check().catch(console.warn);if(++attempts>=12)clearInterval(poll);},2500);
})();