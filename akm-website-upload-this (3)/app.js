(()=>{'use strict';
const d=document,h=d.documentElement,w=window;w.__akm=1;
const $=(s,r=d)=>r.querySelector(s),$$=(s,r=d)=>[...r.querySelectorAll(s)];
const rmq=w.matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>rmq.matches;
const desk=w.matchMedia('(min-width:960px)');

/* ---------- header: solid after top, hides on scroll down, returns on scroll up ---------- */
const hd=$('.hd'),pg=$('.pg'),burger=$('.burger'),menu=$('#menu');
const lockables=()=>$$('main,footer,.skip');
let open=false,lastFocus=null,ly=w.scrollY,acc=0,ticking=false,par=$('[data-par]');

function setOpen(v){
  if(!burger||!menu||v===open)return;
  open=v;menu.classList.toggle('open',v);h.classList.toggle('menu-open',v);
  burger.setAttribute('aria-expanded',v);burger.setAttribute('aria-label',v?'Close menu':'Open menu');
  lockables().forEach(e=>v?e.setAttribute('inert',''):e.removeAttribute('inert'));
  if(v){lastFocus=d.activeElement;hd.classList.remove('is-hidden');const a=$('a',menu);a&&a.focus({preventScroll:true})}
  else{if(menu.contains(d.activeElement)||d.activeElement===d.body)burger.focus({preventScroll:true})}
}
if(burger&&menu){
  burger.addEventListener('click',()=>setOpen(!open));
  d.addEventListener('keydown',e=>{
    if(!open)return;
    if(e.key==='Escape'){e.preventDefault();setOpen(false);return}
    if(e.key==='Tab'){ // keep focus inside header + menu while open
      const f=[$('.brand'),burger,...$$('a',menu)].filter(Boolean),i=f.indexOf(d.activeElement);
      if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}
      else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus()}
    }
  });
  const closeOnDesk=()=>{if(desk.matches)setOpen(false)};
  desk.addEventListener?desk.addEventListener('change',closeOnDesk):desk.addListener(closeOnDesk);
  w.addEventListener('orientationchange',()=>{if(desk.matches)setOpen(false)});
}

function frame(){
  ticking=false;
  const y=Math.max(0,w.scrollY),max=h.scrollHeight-w.innerHeight,dy=y-ly;ly=y;
  hd.classList.toggle('is-solid',y>8);
  if(y<=0){hd.classList.remove('is-hidden');acc=0}
  else if(y<max){ // ignore iOS rubber-band overscroll at both ends
    acc=(dy*acc<0)?dy:acc+dy;
    if(!open){if(acc>26&&y>140)hd.classList.add('is-hidden');else if(acc<-10)hd.classList.remove('is-hidden')}
  }
  if(pg&&!reduced())pg.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')';
}
w.addEventListener('scroll',()=>{if(!ticking){ticking=true;w.requestAnimationFrame(frame)}},{passive:true});
w.addEventListener('resize',()=>{if(!ticking){ticking=true;w.requestAnimationFrame(frame)}},{passive:true});
hd&&hd.addEventListener('focusin',()=>hd.classList.remove('is-hidden'));
frame();

/* hero depth: gentle pointer drift, fine pointers only, stops when settled */
if(par&&w.matchMedia('(hover:hover) and (pointer:fine)').matches){
  let tx=0,ty=0,cx=0,cy=0,run=false;
  const loop=()=>{cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;par.style.setProperty('--mx',cx.toFixed(2));par.style.setProperty('--my',cy.toFixed(2));
    if(Math.abs(tx-cx)>.05||Math.abs(ty-cy)>.05)w.requestAnimationFrame(loop);else run=false};
  w.addEventListener('pointermove',e=>{if(reduced()||w.scrollY>w.innerHeight)return;tx=(e.clientX/w.innerWidth-.5)*-8;ty=(e.clientY/w.innerHeight-.5)*-5;if(!run){run=true;w.requestAnimationFrame(loop)}},{passive:true});
}

/* ---------- reveals ---------- */
const els=$$('[data-r]');
const show=(e,delay,instant)=>{
  if(e.classList.contains('in'))return;
  if(instant)e.classList.add('ni');
  else if(delay!=null&&!e.hasAttribute('data-ld'))e.style.setProperty('--dl',delay+'ms');
  e.classList.add('in');
};
function startReveals(){
  const loads=els.filter(e=>e.hasAttribute('data-ld'));
  if(reduced()||!('IntersectionObserver' in w)){els.forEach(e=>show(e,0,true));return}
  loads.forEach(e=>show(e));
  const io=new IntersectionObserver(es=>{
    const vis=es.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left);
    vis.forEach((e,i)=>{show(e.target,Math.min(i,7)*90);io.unobserve(e.target)});
    es.forEach(e=>{if(!e.isIntersecting&&e.boundingClientRect.top<0){show(e.target,0,true);io.unobserve(e.target)}}); // already scrolled past (restored scroll)
  },{rootMargin:'0px 0px -7% 0px',threshold:0});
  els.filter(e=>!e.hasAttribute('data-ld')).forEach(e=>io.observe(e));
}
if(h.classList.contains('ready'))startReveals();else d.addEventListener('akm:ready',startReveals,{once:true});
rmq.addEventListener&&rmq.addEventListener('change',()=>{if(reduced())els.forEach(e=>show(e,0,true))});

/* ---------- page transitions (black veil wipes up through the screen) ---------- */
const clear=()=>{h.classList.remove('pt-out');try{sessionStorage.removeItem('akm-pt')}catch(e){}};
let leaving=false;
d.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest&&e.target.closest('a[href]');
  if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
  let u;try{u=new URL(a.href,location.href)}catch(x){return}
  if(u.protocol!==location.protocol||u.host!==location.host)return;
  if(u.pathname===location.pathname&&u.search===location.search){ // same page
    if(a.closest('#menu')){e.preventDefault();setOpen(false);w.scrollTo({top:0,behavior:reduced()?'auto':'smooth'})}
    return;
  }
  if(reduced()||leaving)return;
  e.preventDefault();leaving=true;
  try{sessionStorage.setItem('akm-pt','1')}catch(x){}
  h.classList.add('pt-out');
  setTimeout(()=>{w.location.href=u.href},470);
  setTimeout(()=>{leaving=false;clear()},3000); // failsafe if navigation is blocked
});
w.addEventListener('pageshow',e=>{if(e.persisted){leaving=false;clear();h.classList.remove('pt-in')}});
const veil=$('.veil');veil&&veil.addEventListener('animationend',()=>h.classList.remove('pt-in'));

/* ---------- contact form (posts to Formspree, which emails AKM; falls back to mailto and a copy box) ---------- */
const f=$('form[data-contact]');
if(f){
  const v=(el,m)=>{el.dataset.m=m;const e=d.getElementById(el.id+'-e');const bad=!el.checkValidity();el.setAttribute('aria-invalid',bad);e.textContent=bad?m:'';return!bad};
  const chk=()=>[v(f.name,'Enter your name.'),v(f.email,'Enter a valid email address.'),v(f.type,'Choose a project type.'),v(f.msg,'Describe your project in at least 20 characters.')].every(Boolean);
  f.addEventListener('submit',e=>{
    e.preventDefault();
    if(!chk()){f.querySelector('[aria-invalid=true]').focus();return}
    const t='Hello AKM Technologies,\n\nName: '+f.name.value+'\nEmail: '+f.email.value+'\nProject type: '+f.type.value+'\nBudget: '+(f.budget.value||'Not sure')+'\n\n'+f.msg.value;
    d.getElementById('out').value=t;const r=d.getElementById('res'),h2=r.querySelector('h2'),pp=r.querySelector('p'),btn=f.querySelector('[type=submit]');
    const fail=()=>{h2.textContent='We could not send it automatically';pp.innerHTML='Please copy this message and email it to <a href="mailto:akmtechnologies33@gmail.com">akmtechnologies33@gmail.com</a>.';r.querySelectorAll('label,textarea,p:last-child').forEach(x=>x.style.display='');r.hidden=false;r.focus();w.location.href='mailto:akmtechnologies33@gmail.com?subject='+encodeURIComponent('Project enquiry from '+f.name.value)+'&body='+encodeURIComponent(t)};
    if(f._gotcha&&f._gotcha.value)return;
    btn.disabled=true;
    fetch('https://formspree.io/f/xaeeozaz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:f.name.value,email:f.email.value,project_type:f.type.value,budget:f.budget.value||'Not sure',message:f.msg.value,_subject:'New project enquiry from '+f.name.value})})
      .then(x=>x.json().then(j=>{if(!x.ok||j.error)throw 0;
        h2.textContent='Message sent. Thank you!';pp.textContent='We received your project details and will reply to '+f.email.value+' soon.';
        r.querySelectorAll('label,textarea,p:last-child').forEach(x=>x.style.display='none');r.hidden=false;r.focus();f.reset()}))
      .catch(fail).finally(()=>{btn.disabled=false});
  });
  $$('input,select,textarea',f).forEach(el=>el.addEventListener('input',()=>{if(el.getAttribute('aria-invalid')==='true')v(el,el.dataset.m||'Check this field.')}));
  d.getElementById('copy').addEventListener('click',async()=>{
    const s=d.getElementById('cs'),o=d.getElementById('out');
    try{await navigator.clipboard.writeText(o.value);s.textContent='Copied.'}catch(x){o.select();s.textContent='Select the text and copy it manually.'}
  });
}
})();
