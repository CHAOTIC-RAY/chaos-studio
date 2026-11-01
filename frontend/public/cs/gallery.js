/* Chaos Studio — /gallery (Lu v3). Data: same-origin /api/portfolio (preview worker proxies the live API via a
   service binding) → falls back to bundled /gallery-snapshot.json → error state. Item mapping mirrors the live bundle. */
(function(){
const P="/images/posts",WA=window.__WA__||"https://wa.me/9609401011";
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Remove invented claims (awards/rankings) from captions; fall back to neutral labels. */
const TITLE_FIX={"rioga-03":"Travel branding post"};
const CLAIM=/\b(best|award(s|ed)?|winner|top\s*\d+|#\s*1|no\.?\s*1|number one|leading)\b/i;
function fixClaims(n){const t=TITLE_FIX[n.id]||(CLAIM.test(n.title||"")?(n.client+" post"):n.title);return{...n,title:t,tags:(n.tags||[]).filter(x=>!/^(awards?|best.*)$/i.test(x))}}
const slugify=s=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const pad=n=>String(n).padStart(3,"0");
const panoSrc=u=>u.replace(/\.webp$/i,".pano.webp");
const base=n=>(n.image&&n.image.trim())||n.id;
const slideSrc=(n,s)=>`${P}/${n.id}/${s}.webp`;
/* category model (≤8): industries stay in the client filter */
const CATS=[["","All"],["branding","Branding"],["social","Social"],["carousel","Carousel"],["reel","Reel"],["print","Print"],["jersey","Jersey"],["webapp","Web/App"]];
const LABEL=Object.fromEntries(CATS);
function cats(n){const t=(n.tags||[]).join(" ").toLowerCase(),k=(n.slides||[]).length,s=new Set();
  if(n.video)s.add("reel");if(k>1)s.add("carousel");
  if(/jersey|uniform/.test(t))s.add("jersey");
  if(/poster|print|banner|flyer|media\s*kit/.test(t)||n.platform==="Media kit"||/poster/.test(n.id))s.add("print");
  if(/brand|logo|identity|media\s*kit/.test(t))s.add("branding");
  if(/web|app|ui/.test(t))s.add("webapp");
  if(/instagram|facebook|tiktok/i.test(n.platform||""))s.add("social");
  const primary=["reel","jersey","print","branding","carousel","webapp","social"].find(c=>s.has(c))||"social";s.add(primary);
  return{set:s,primary}}
function fmt(n){const p=(n.platform||"post").toLowerCase(),k=(n.slides||[]).length;
  if(n.video)return"reel · video";if(/poster/.test(n.id)||(n.tags||[]).some(t=>/poster/i.test(t)))return"poster · print";
  return k>1?`${p} · ${k} slides`:`${p} · single`}
function toItem(n,i){n=fixClaims(n);const cover=n.video?`${P}/${n.id}/${n.poster||"poster.webp"}`:(n.slides&&n.slides.length?slideSrc(n,n.slides[0]):`${P}/${base(n)}.webp`);
  const media=n.video?[{type:"video",src:`${P}/${n.id}/${n.video}`,poster:cover}]:(n.slides&&n.slides.length?n.slides.map(s=>({type:"image",src:slideSrc(n,s)})):[{type:"image",src:cover}]);
  const c=cats(n);const year=((n.tags||[]).join(" ").match(/\b20\d\d\b/)||[])[0]||"";
  return{n:i+1,id:n.id,slug:slugify(n.client+" "+n.title),client:n.client,cslug:slugify(n.client),title:n.title,desc:n.description||"",tags:n.tags||[],platform:n.platform||"",
    cats:c.set,cat:c.primary,fmt:fmt(n),year,reel:!!n.video,preview:n.video?`${P}/${n.id}/preview.mp4`:"",cover:panoSrc(cover),coverFull:cover,media}}
function items(d){const g=(d.galleryPosts&&d.galleryPosts.items)||[],s=(d.socialPosts&&d.socialPosts.items)||[];
  const all=g.length?[...g,...s.filter(x=>!g.some(y=>y.id===x.id))]:s;return all.filter(x=>!x.id.startsWith("_")).map(toItem)}
async function load(){
  try{const r=await fetch("/api/portfolio",{headers:{accept:"application/json"}});if(!r.ok)throw 0;const d=await r.json();if(!d.socialPosts)throw 0;return{d,src:"live"}}
  catch(e){const r=await fetch("/gallery-snapshot.json");if(!r.ok)throw new Error("offline");return{d:await r.json(),src:"snapshot"}}}

let ALL=[],VIEW=[],cat="",client="",mode=reduced()?"grid":"canvas",pano=null;
const grid=$("#grid"),chips=$("#chips"),sel=$("#client"),live=$("#g-live"),state=$("#g-state");
const GROUNDS=["ink","paper","plum","kraft","lilac","purple"];
const ICON=`<svg class="cmark" viewBox="0 0 245 334" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${window.__LOGO_PATH__||""}"/></svg>`;

/* loading skeleton */
function skeleton(){grid.innerHTML=Array.from({length:8},(_,i)=>`<li class="card sk" data-g="${GROUNDS[i%6]}"><div class="fr"><span class="media"></span><span class="mono load">LOADING <b>***</b></span></div></li>`).join("");
  if(!reduced()){let k=0;skeleton.t=setInterval(()=>{k=(k+1)%4;grid.querySelectorAll(".load b").forEach(b=>b.textContent="*".repeat(k||1).padEnd(3," "))},300)}}
function renderChips(){const n=c=>c?ALL.filter(i=>i.cats.has(c)&&(!client||i.cslug===client)).length:ALL.filter(i=>!client||i.cslug===client).length;
  chips.innerHTML=CATS.filter(([v])=>!v||ALL.some(i=>i.cats.has(v))).map(([v,l])=>`<button type="button" class="chip" data-c="${v}" aria-pressed="${v===cat}">${l}${v===cat?` <span class="ct">${n(v)}</span>`:""}</button>`).join("");
  const a=chips.querySelector('[aria-pressed="true"]');a&&(chips.scrollLeft=a.offsetLeft-(chips.clientWidth-a.offsetWidth)/2)}
function renderClients(){const by={};ALL.forEach(i=>by[i.cslug]=[i.client,(by[i.cslug]?by[i.cslug][1]:0)+1]);
  sel.innerHTML=`<option value="">Client ▾</option>`+Object.entries(by).sort((a,b)=>a[1][0].localeCompare(b[1][0])).map(([k,[l,c]])=>`<option value="${k}"${k===client?" selected":""}>${esc(l)} (${c})</option>`).join("");
  sel.parentElement.classList.toggle("on",!!client)}
function paintGrounds(){const cols=getComputedStyle(grid).gridTemplateColumns.split(" ").length||1;
  [...grid.children].forEach((li,k)=>{const r=Math.floor(k/cols),c=k%cols;li.dataset.g=GROUNDS[(r+c*2)%6]})}
function card(i,k){const many=i.media.length>1;
  return`<li class="card" style="--d:${Math.min(k,12)*40}ms"><a class="fr" href="/gallery/${i.slug}" data-slug="${i.slug}">
  <span class="top"><span class="num">${pad(i.n)}</span><span class="cat">${LABEL[i.cat]}</span></span>
  <span class="media"><img src="${esc(i.cover)}" alt="${esc(i.title)} — ${esc(i.client)}" loading="${k<4?"eager":"lazy"}" decoding="async" width="472" height="590" onerror="this.onerror=null;this.src='${esc(i.coverFull)}'">
   ${i.reel?`<span class="badge">▶ reel</span>`:many?`<span class="badge">⧉ 1/${i.media.length}</span>`:""}</span>
  <span class="cap"><span class="hl2">${esc(i.client)} — ${esc(i.title)}</span></span>
  <span class="fmt"><span>${esc(i.fmt)}</span>${ICON}</span></a></li>`}
function render(anim){VIEW=ALL.filter(i=>(!cat||i.cats.has(cat))&&(!client||i.cslug===client));
  clearInterval(skeleton.t);grid.removeAttribute("aria-busy");
  const go=()=>{grid.innerHTML=VIEW.map(card).join("");paintGrounds();
    state.innerHTML=VIEW.length?"":`<div class="empty"><svg class="ast" viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><rect x="42" width="16" height="100"/><rect x="42" width="16" height="100" transform="rotate(60 50 50)"/><rect x="42" width="16" height="100" transform="rotate(-60 50 50)"/></g></svg>
     <p class="disp">nothing here yet.</p><p class="brace">{try another filter}</p><div class="row"><button type="button" class="pill line" id="clear">Clear filters</button><a class="btn pill btn-lime" href="${WA}" target="_blank" rel="noopener noreferrer">Want this to be your project?</a></div></div>`;
    $("#clear")&&($("#clear").onclick=()=>setF("","",true));
    if(!reduced())requestAnimationFrame(()=>grid.querySelectorAll(".card").forEach(c=>io.observe(c)));else grid.querySelectorAll(".card").forEach(c=>c.classList.add("in"));
    live.textContent=`${pad(VIEW.length)} works`;$("#fbtn-l").textContent=(cat||client)?`· ${pad(VIEW.length)}`:"";pano&&pano.setItems(VIEW)};
  if(anim&&!reduced()&&grid.children.length){grid.classList.add("out");setTimeout(()=>{grid.classList.remove("out");go()},120)}else go()}
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}}),{threshold:.05});
function qs(){const u=new URL(location.origin+"/gallery/");cat&&u.searchParams.set("cat",cat);client&&u.searchParams.set("client",client);mode==="grid"&&u.searchParams.set("view","grid");return u.pathname+u.search}
function setF(c,cl,push){cat=c;client=cl;renderChips();renderClients();render(true);if(push)history.replaceState(null,"",qs())}
chips.addEventListener("click",e=>{e.stopPropagation();const b=e.target.closest(".chip");if(b)setF(b.dataset.c,client,true)});
sel.addEventListener("change",()=>setF(cat,sel.value,true));
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(paintGrounds,120)});

/* ---------- project view (<dialog>, deep link /gallery/<slug>) ---------- */
const lb=$("#lb"),stage=$("#lb-stage");let cur=0,slide=0,opener=null;
const list=()=>VIEW.length?VIEW:ALL;
function show(){const L=list(),it=L[cur],m=it.media[slide],nx=L[(cur+1)%L.length];
  $("#lb-fine").textContent=`${pad(it.n)} · ${LABEL[it.cat]}`;$("#lb-client").textContent=it.client;$("#lb-title").textContent=it.title;
  $("#lb-brief").textContent=it.desc||`${it.fmt.replace(/^./,c=>c.toUpperCase())} for ${it.client}, designed by Chaos Studio.`;
  $("#lb-spec").innerHTML=[["Client",it.client],it.year&&["Year",it.year],["Format",it.fmt],["Services",[...it.cats].map(c=>LABEL[c]).join(", ")]].filter(Boolean).map(([k,v])=>`<div><dt class="cond">${k}</dt><dd class="mono">${esc(v)}</dd></div>`).join("");
  $("#lb-tags").innerHTML=it.tags.map(t=>`<li>${esc(t)}</li>`).join("");
  $("#lb-cta").href=`${WA}?text=${encodeURIComponent(`Hi, I saw the ${it.title} work`)}`;
  $("#lb-count").textContent=`${String(slide+1).padStart(2,"0")} / ${String(it.media.length).padStart(2,"0")}`;
  $("#lb-sprev").disabled=slide===0;$("#lb-snext").disabled=slide>=it.media.length-1;$(".lb-ctrl").hidden=it.media.length<2;
  $("#lb-nexttitle").textContent=`${nx.client} — ${nx.title}`;
  stage.querySelectorAll("img,video").forEach(n=>{n.pause&&n.pause();n.remove()});
  let el;if(m.type==="video"){el=document.createElement("video");el.src=m.src;el.poster=m.poster;el.controls=true;el.playsInline=true;el.preload="metadata";if(!reduced()){el.muted=true;el.autoplay=true;el.loop=true}}
  else{el=new Image();el.src=m.src;el.decoding="async";const p=it.media[slide+1];if(p&&p.type==="image")new Image().src=p.src}
  el.setAttribute("aria-label",`${it.title} — ${it.client}, ${slide+1} of ${it.media.length}`);if(el.alt!==undefined)el.alt=el.getAttribute("aria-label");
  el.draggable=false;stage.appendChild(el);$("#lb-status").textContent=el.getAttribute("aria-label")}
function openSlug(s,btn,push){const L=list();let i=L.findIndex(x=>x.slug===s);if(i<0){i=ALL.findIndex(x=>x.slug===s);if(i<0)return;VIEW=ALL;cat="";client=""}
  cur=i;slide=0;opener=btn||opener;pano&&pano.stop();show();if(!lb.open){lb.showModal();document.body.style.overflow="hidden"}lb.scrollTop=0;$("#lb-close").focus();
  if(push)history.pushState({p:s},"",`/gallery/${s}`)}
function close(push){if(!lb.open)return;stage.querySelectorAll("video").forEach(v=>v.pause());lb.close();document.body.style.overflow="";
  if(push)history.pushState(null,"",qs());mode==="canvas"&&pano&&pano.start();const o=opener||grid.querySelector(`[data-slug="${list()[cur].slug}"]`);o&&o.focus()}
lb.addEventListener("cancel",e=>{e.preventDefault();close(true)});
$("#lb-close").onclick=()=>close(true);
const step=d=>{const it=list()[cur],n=slide+d;if(n>=0&&n<it.media.length){slide=n;show()}};
const proj=d=>{const L=list();cur=(cur+d+L.length)%L.length;slide=0;show();history.replaceState({p:L[cur].slug},"",`/gallery/${L[cur].slug}`);lb.scrollTop=0};
$("#lb-sprev").onclick=()=>step(-1);$("#lb-snext").onclick=()=>step(1);$("#lb-inext").onclick=()=>proj(1);
lb.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const d=e.key==="ArrowRight"?1:-1;e.shiftKey?proj(d):step(d)}});
grid.addEventListener("click",e=>{const a=e.target.closest("a[data-slug]");if(!a||e.metaKey||e.ctrlKey)return;e.preventDefault();openSlug(a.dataset.slug,a,true)});
let sx=null,sy=0;stage.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"){sx=e.clientX;sy=e.clientY}});
stage.addEventListener("pointerup",e=>{if(sx===null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1)});
stage.addEventListener("pointercancel",()=>sx=null);
function route(){const m=location.pathname.match(/^\/gallery\/([a-z0-9-]+)\/?$/);m?openSlug(m[1],null,false):close(false)}
addEventListener("popstate",route);

/* ---------- wall (pano) ---------- */
const root=$("#pano"),fpanel=$("#fpanel"),fbtn=$("#fbtn");
function tile(){const a=document.createElement("a");a.className="pt";a.tabIndex=-1;a.draggable=false;
  a.innerHTML=`<span class="pt-in"><i class="tp" aria-hidden="true"></i><span class="media"><img alt="" decoding="async" draggable="false"><img class="gl" alt="" aria-hidden="true" draggable="false"><video muted loop playsinline preload="none" hidden></video><span class="badge" hidden></span></span><span class="film-id mono" aria-hidden="true"></span><span class="sticker cat"></span><span class="sticker hov" aria-hidden="true"></span></span><span class="lab"><span class="num"></span><span class="cl"></span>${ICON}</span>`;
  a._img=a.querySelector("img");a._gl=a.querySelector(".gl");a._v=a.querySelector("video");return a}
const rnd=n=>{let x=Math.sin(n*9301+49297)*233280;return x-Math.floor(x)};
function seed(it){const r=rnd(it.n+1),r2=rnd(it.n+7),r3=rnd(it.n+13);it.rz=(r*8-4);it.ry=(r2*12-6);it.zz=Math.round(r3*240-160);it.kind=rnd(it.n+29)<.3?"film":"print"}
function fill(a,it){a.dataset.panoId=it.id;a.href=`/gallery/${it.slug}`;a.dataset.kind=it.kind;
  a.querySelector(".num").textContent=pad(it.n)+" —";a.querySelector(".cl").textContent=it.client;a.querySelector(".cat").textContent=LABEL[it.cat];
  a.querySelector(".hov").textContent=it.title;a.querySelector(".film-id").textContent=`CS-${pad(it.n)} ▸ ${String(it.media.length).padStart(2,"0")}A`;
  a._img.src=it.cover;a._gl.src=it.cover;a._img.onerror=()=>{a._img.onerror=null;a._img.src=a._gl.src=it.coverFull};a._img.alt=`${it.title} — ${it.client}`;
  const b=a.querySelector(".badge");b.hidden=!(it.reel||it.media.length>1);b.textContent=it.reel?"▶ reel":`⧉ 1/${it.media.length}`;
  a.setAttribute("aria-label",`${it.title} — ${it.client}`)}
/* crosshair cursor + HUD */
const curEl=$("#cursor"),hud=$("#hud");let curOn=false;
if(curEl&&matchMedia("(pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const st=$("#stage");
  st.addEventListener("pointermove",e=>{if(!curOn){curEl.hidden=false;curOn=true}curEl.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
    const over=e.target.closest(".pt");curEl.querySelector("b").textContent=st.classList.contains("is-grabbing")?"← →":over?"OPEN":"DRAG"});
  st.addEventListener("pointerleave",()=>{curEl.hidden=true;curOn=false});st.classList.add("has-cursor")}
const f4=v=>(v<0?"−":"")+String(Math.abs(Math.round(v/10))%10000).padStart(4,"0");
function setMode(m,push){mode=m;root.dataset.view=m;document.body.dataset.view=m;
  root.querySelectorAll("[data-view]").forEach(b=>b.tagName==="BUTTON"&&b.setAttribute("aria-pressed",b.dataset.view===m));
  if(pano){m==="canvas"?(pano.start(),pano.relayout()):pano.stop()}if(m==="grid")paintGrounds();closeF();push&&history.replaceState(null,"",qs())}
root.querySelectorAll("button[data-view]").forEach(b=>b.onclick=()=>setMode(b.dataset.view,true));
root.querySelectorAll(".zbtn").forEach(b=>b.onclick=()=>pano&&pano.zoom(+b.dataset.z));
function closeF(){fpanel.classList.remove("open");fbtn.setAttribute("aria-expanded","false")}
fbtn.onclick=e=>{e.stopPropagation();const o=!fpanel.classList.contains("open");fpanel.classList.toggle("open",o);fbtn.setAttribute("aria-expanded",o);if(o){const f=fpanel.querySelector("button,select");f&&f.focus()}};
document.addEventListener("click",e=>{if(mode==="canvas"&&!e.target.closest("#fpanel,#fbtn"))closeF()});
fpanel.addEventListener("keydown",e=>{if(e.key==="Escape"){closeF();fbtn.focus()}});
const hint=$("#hint");
function preload(list){const bar=$("#loader-bar"),L=$("#loader");let k=0;const n=list.length;
  return Promise.race([Promise.all(list.map(i=>new Promise(r=>{const im=new Image();im.onload=im.onerror=()=>{k++;bar.style.width=Math.round(k/n*100)+"%";r()};im.src=i.cover}))),new Promise(r=>setTimeout(r,1400))])
   .then(()=>{L.classList.add("done");setTimeout(()=>L.remove(),420)})}
function boot(){skeleton();state.innerHTML="";
  load().then(({d,src})=>{ALL=items(d);ALL.forEach(seed);if(innerWidth<360||(navigator.hardwareConcurrency||8)<=2)mode="grid";document.documentElement.dataset.source=src;$("#g-total").textContent=pad(ALL.length);$("#hud-n").textContent=pad(ALL.length);
    const q=new URL(location.href).searchParams;const c=q.get("cat")||"",cl=q.get("client")||"";
    cat=CATS.some(([v])=>v===c)?c:"";client=ALL.some(i=>i.cslug===cl)?cl:"";
    if(!pano)pano=ChaosPano.init({stage:$("#stage"),plane:$("#plane"),tile,fill,onOpen:it=>openSlug(it.slug,$("#stage"),true),onInteract:()=>hint.hidden=true,onMove:(x,y)=>{hud&&(hud.firstChild.textContent=`X ${f4(x)} · Y ${f4(y)} · `)},visible:()=>mode==="canvas"&&!lb.open});
    if(q.get("view")==="grid")mode="grid";else if(q.get("view")==="wall")mode="canvas";
    renderChips();renderClients();render(false);setMode(mode,false);preload(ALL.slice(0,14));route()})
  .catch(()=>{clearInterval(skeleton.t);grid.innerHTML="";live.textContent="";
    state.innerHTML=`<div class="err"><p class="mono">ERR · COULDN'T LOAD THE WORK</p><button type="button" class="pill line" id="retry">Retry</button></div>`;$("#retry").onclick=boot})}
if(matchMedia("(prefers-reduced-motion: reduce)").matches){const w=root.querySelector('button[data-view=canvas]');w&&(w.textContent="Explore the wall")}
boot();
})();
