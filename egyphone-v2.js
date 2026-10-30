/* EGYPHONE V2 stage 1: conservative, reversible menu organization. */
(()=>{
 const active=()=>document.documentElement.dataset.btBrand==='egyphone';
 let ready=false;
 function apply(){
  if(!active()||ready)return;
  const nav=document.querySelector('#mainMenu .menuNav');if(!nav)return;
  const name=(sel,label)=>{const el=nav.querySelector(sel+' strong');if(el)el.textContent=label;};
  name('[data-category="Dashboard"]','Dashboard');
  name('#deviceSalesMenuItem','Vendite e cassa');
  name('#invoicesMenuItem','Documenti e fatture');
  name('#partsHubMenuItem','Magazzino e ricambi');
  const group=nav.querySelector('#repairMenuGroup');
  const ddt=nav.querySelector('#workDdtMenuItem');
  if(ddt){
    // Move only within its own existing group; preserves native handlers.
    const more=document.createElement('details');more.className='studioNavDetails v2Advanced';
    const summary=document.createElement('summary');summary.textContent='Altre operazioni laboratorio';
    more.append(summary);ddt.parentNode.insertBefore(more,ddt);more.append(ddt);
  }
  const magazine=nav.querySelector('#autoOrdersMenuItem');
  if(magazine?.querySelector('strong'))magazine.querySelector('strong').textContent='Scorte e acquisti';
  // Never hide entire functional groups, user privileges or data.
  ready=true;
 }
 document.addEventListener('egyphone:active',apply);
 window.addEventListener('load',apply);
 let attempts=0;const timer=setInterval(()=>{apply();if(ready||++attempts>=16)clearInterval(timer);},1000);
})();