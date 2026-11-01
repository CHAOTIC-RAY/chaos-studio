/* Chaos Studio — /studio redesign. Background scroll-logo engine ported 1:1 from the
   production bundle (index-CWoAg6Fg.js: pu / Tu / ba / ya / Eu / hu / Yu). Only colours changed
   (gradients -> flat house-palette fills). Timing, easing, scroll maths, dither are unchanged. */
(function(){
const LOGO_PATH = window.__LOGO_PATH__;
const hr={w:245,h:334};
let P2D=null;const logoPath=()=>P2D||(P2D=new Path2D(LOGO_PATH));
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse=()=>window.matchMedia("(hover: none), (pointer: coarse)").matches;
// palette (was rgba(213,119,237,*) purples / radial gradients)
const C={purple:"193,107,224",lilac:"214,144,232",plum:"40,18,44"};

/* ---------- scroll state (pu) ---------- */
const Pr={reveal:0,scale:.48,fill:0,finale:0};
let li={...Pr},si={...Pr},Er={...Pr};
const st=()=>li;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smoother=n=>{const e=clamp(n,0,1);return e*e*e*(e*(e*6-15)+10)};
const lerp=(n,e,t)=>({reveal:n.reveal+(e.reveal-n.reveal)*t,scale:n.scale+(e.scale-n.scale)*t,fill:n.fill+(e.fill-n.fill)*t,finale:n.finale+(e.finale-n.finale)*t});
const dist=(n,e)=>Math.abs(n.reveal-e.reveal)+Math.abs(n.scale-e.scale)*.08+Math.abs(n.fill-e.fill)+Math.abs(n.finale-e.finale);
function apply(n){const e=document.documentElement;e.style.setProperty("--studio-logo-reveal",n.reveal.toFixed(4));e.style.setProperty("--studio-logo-scale",n.scale.toFixed(4));e.style.setProperty("--studio-logo-fill",n.fill.toFixed(4));e.style.setProperty("--studio-finale",n.finale.toFixed(4));document.body.classList.toggle("studio-finale-active",n.finale>.45)}
function scrollState(){
  const n=document.querySelector(".page-studio"),e=document.getElementById("studio-contact");if(!n)return;
  if(reduced()){li={reveal:1,scale:1.1,fill:0,finale:0};apply(li);return}
  let t=0,r=0;const k=.11,eps=.0015;
  const o=()=>{const u=window.scrollY,f=window.innerHeight,p=n.offsetTop,d=n.offsetHeight,_=u-p+f*.12,h=f*.08,g=f*1.35,v=smoother((_-h)/g),w=f*.35,S=Math.max(f*2.6,d-f*2.2),b=.48+smoother((_-w)/S)*3.4;let $=0,y=0;
    if(e){const A=e.getBoundingClientRect(),T=u+A.top,M=T-f*.65,I=T-f*.05;y=smoother((u-M)/Math.max(1,I-M));const L=T-f*.5,z=T+f*.2;$=smoother((u-L)/Math.max(1,z-L))}
    si={reveal:v,scale:b,fill:$,finale:y}};
  const a=()=>{r||(r=requestAnimationFrame(l))};
  const l=()=>{r=0;Er=lerp(Er,si,k);li=Er;apply(Er);dist(Er,si)>eps&&(r=requestAnimationFrame(l))};
  const c=()=>{cancelAnimationFrame(t);t=requestAnimationFrame(()=>{o();a()})};
  o();apply(si);Er={...si};li=Er;a();
  addEventListener("scroll",c,{passive:true});addEventListener("resize",c,{passive:true});
}

/* ---------- smoothed pointer (hu / Ki) ---------- */
const Dt={x:.5,y:.5,active:false},Nr={x:.5,y:.5};let Hn=0;
function pointer(){const r=()=>{Hn||(Hn=requestAnimationFrame(t))};
  const t=()=>{Hn=0;const i=Dt.x-Nr.x,s=Dt.y-Nr.y;Nr.x+=i*.1;Nr.y+=s*.1;(!Dt.active&&Math.abs(i)<25e-5&&Math.abs(s)<25e-5&&Math.abs(Nr.x-.5)<25e-5&&Math.abs(Nr.y-.5)<25e-5)||r()};
  addEventListener("mousemove",i=>{Dt.active=true;Dt.x=i.clientX/innerWidth;Dt.y=i.clientY/innerHeight;r()},{passive:true});
  document.documentElement.addEventListener("mouseleave",()=>{Dt.active=false;r()});r()}
const Ki=()=>({x:Nr.x,y:Nr.y});
/* hero logo parallax (Yu) */
function heroLogo(){const n=document.querySelector(".studio-page-logo__mark");if(!n)return;let e=0;
  const t=()=>{e=0;const{x:i,y:s}=Ki();n.style.setProperty("--logo-mx",String((i-.5)*10));n.style.setProperty("--logo-my",String((s-.5)*8))};
  addEventListener("mousemove",()=>{e||(e=requestAnimationFrame(t))},{passive:true});t()}

/* ---------- ordered dither + noise (mu / va / ya) ---------- */
const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],B8=[0,48,12,60,3,51,15,63,32,16,44,28,35,19,47,31,8,56,4,52,11,59,7,55,40,24,36,20,43,27,39,23,2,50,14,62,1,49,13,61,34,18,46,30,33,17,45,29,10,58,6,54,9,57,5,53,42,26,38,22,41,25,37,21];
const bayer=(n,e,t)=>t===8?(B8[(e&7)*8+(n&7)]+.5)/64-.5:(B4[(e&3)*4+(n&3)]+.5)/16-.5;
function hash(n,e,t){let r=n*374761393+e*668265263+t*982451653;r=(r^r>>>13)*1274126177;return((r^r>>>16)>>>0)/4294967295}
function dither(n,e,t,i){const s=i.profile??"default",o=i.lite===true,a=i.strength??(s==="studio"?.42:.22),l=i.noise??(s==="studio"?.55:.08),c=i.vignetteNoise??(s==="studio"&&!o),u=i.cx??.5,f=i.cy??.42,p=o||s!=="studio"?4:8,d=s==="studio"?9137:42,_=i.time??0,h=!o&&s==="studio"&&_>0;
  const g=n.getImageData(0,0,e,t),v=g.data,w=e,S=t,x=Math.hypot(w,S)*.5;
  for(let b=0;b<S;b++)for(let $=0;$<w;$++){const y=(b*w+$)*4,A=v[y+3];if(A<4)continue;const T=$/w,M=b/S,I=Math.hypot(T-u,M-f)*x,L=c?Math.min(1,Math.pow(I/(x*.85),1.35)):.35,z=h?$+Math.floor(_*.04):$,O=h?b+Math.floor(_*.03):b,Y=bayer(z,O,p),H=(hash(z,O,d+Math.floor(_*.02))-.5)*2,q=s==="studio"&&!o?(hash(z*3+7,O*5+11,d+3+Math.floor(_*.015))-.5)*1.2:0,Q=(Y*(1-l*.65)+H*l+q*l*.45)*(.65+L*.55)*a*255;let m=A+Q;const ae=.299*v[y]+.587*v[y+1]+.114*v[y+2],Te=Q*(s==="studio"?.5:.35);
    if(ae>8){v[y]=clamp(v[y]+Te,0,255);v[y+1]=clamp(v[y+1]+Te,0,255);v[y+2]=clamp(v[y+2]+Te,0,255)}v[y+3]=clamp(m,0,255)}
  n.putImageData(g,0,0)}

/* ---------- logo drawing (ba / Tu) — flat palette fills instead of radial gradients ---------- */
function drawLogo(n,e,t,r,i,s,o,solid){const l=logoPath(),c=1+Math.sin(i*.001)*.02,u=Math.sin(i*5e-4)*.006,p=Math.min(n.canvas.width,n.canvas.height)*.62/hr.h*c*r;
  n.save();n.globalAlpha=o;n.translate(e,t);n.rotate(u+(reduced()?0:Math.round((st().scale-.48)/3*24)/24*12*Math.PI/180));n.scale(p,p);n.translate(-245/2,-334/2);n.clip(l);
  if(solid){n.fillStyle=`rgba(${C.purple},0.92)`;n.fillRect(-245,-334,hr.w*3,hr.h*3)}
  else{n.fillStyle=`rgba(${C.purple},0.85)`;n.fillRect(0,0,hr.w,hr.h)}
  n.restore()}
function drawScene(n,e,t,r,i,s){const{reveal:a,scale:l,fill:c,finale:u}=st();if(a<.004&&c<.004)return;
  const f=(i-.5)*.14,p=(s-.5)*.12,d=e*(.5+f),_=t*(.36+p+u*.22),h=a*(1-c*.55);
  if(h>.01)drawLogo(n,d,_,l,r,s,h,false);
  if(c>.02){const g=l*(1+c*2.8);drawLogo(n,d,_,g,r,s,c*.95,true)}
  if(c>.08){n.save();n.globalAlpha=c*.35*.45;n.fillStyle=`rgb(${C.purple})`;n.fillRect(0,0,e,t);n.restore()}
  if(a>.05&&c<.65){n.save();n.globalAlpha=a*.85*.18;n.fillStyle=`rgb(${C.plum})`;n.fillRect(0,0,e,t);n.restore()}}

function cursorAuto(n,e){if(e){const r=n*4e-4;return{x:.5+Math.sin(r)*.08,y:.38+Math.cos(r*.9)*.06}}const t=n*55e-5;return{x:.5+Math.sin(t)*.26+Math.sin(t*1.65+1.2)*.1,y:.5+Math.cos(t*.85)*.22+Math.cos(t*1.35+.6)*.09}}
function focus(n){if(coarse())return cursorAuto(n,true);const e=Ki();return{x:.5+(e.x-.5)*.62,y:.38+(e.y-.5)*.55}}

/* ---------- canvas loop (Eu, studio branch) ---------- */
function canvasLoop(){const n=document.getElementById("bg-canvas");if(!n)return;const RM=reduced();const e=n.getContext("2d",{alpha:true});const t=document.createElement("canvas"),r=t.getContext("2d",{alpha:true,willReadFrequently:true});
  let a=0,l=0,c=0,u=0,p=0,d="",_=false;
  const g=()=>{const $=Math.min(devicePixelRatio||1,1.5);a=innerWidth;l=innerHeight;n.width=a*$;n.height=l*$;n.style.width=a+"px";n.style.height=l+"px";e.setTransform($,0,0,$,0,0);c=Math.max(1,Math.floor(a*.2));u=Math.max(1,Math.floor(l*.2));t.width=c;t.height=u};
  const due=(b,k,y)=>document.hidden||!(b-p>=y)&&k===d?false:(p=b,d=k,true);
  const S=b=>{const T=st();if(!(T.reveal>.004||T.fill>.004)){if(!_){e.clearRect(0,0,a,l);_=true;d=""}RM||requestAnimationFrame(S);return}_=false;
    const I=`${T.reveal.toFixed(3)}|${T.scale.toFixed(2)}|${T.fill.toFixed(3)}|${T.finale.toFixed(3)}`,L=focus(b),z=`${I}|${L.x.toFixed(2)}|${L.y.toFixed(2)}|dark`;
    if(RM||due(b,z,36)){const{x:O,y:Y}=L;r.clearRect(0,0,c,u);drawScene(r,c,u,b,O,Y);const H=T.reveal*(1-T.fill*.7)+T.fill*.35;
      if(H>.02)dither(r,c,u,{profile:"studio",lite:true,strength:.52*H,noise:.45*H,vignetteNoise:false,cx:O,cy:Y+T.finale*.15});
      e.clearRect(0,0,a,l);e.imageSmoothingEnabled=false;e.drawImage(t,0,0,a,l);e.imageSmoothingEnabled=true}
    RM||requestAnimationFrame(S)};
  g();addEventListener("resize",()=>{g();RM&&requestAnimationFrame(S)});requestAnimationFrame(S)}

/* ---------- mobile menu sheet ---------- */
function menu(){const b=document.getElementById("menu-btn"),m=document.getElementById("menu");if(!b||!m)return;
  const set=o=>{b.setAttribute("aria-expanded",o);m.hidden=!o;document.body.style.overflow=o?"hidden":"";if(o)m.querySelector("a").focus();else b.focus()};
  b.onclick=()=>set(b.getAttribute("aria-expanded")!=="true");m.querySelector(".menu-close").onclick=()=>set(false);
  m.addEventListener("click",e=>{if(e.target.closest("a"))set(false)});addEventListener("keydown",e=>{if(e.key==="Escape"&&!m.hidden)set(false)})}
/* ---------- reveal on scroll ---------- */
function reveals(){const els=document.querySelectorAll("[data-reveal]");if(reduced()||!("IntersectionObserver"in window)){els.forEach(e=>e.classList.add("in"));return}
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}}),{rootMargin:"0px 0px -8% 0px",threshold:.05});els.forEach(e=>io.observe(e))}

function glitches(){if(reduced())return;const gs=[...document.querySelectorAll('.glitch')];
  const fire=g=>{g.classList.remove('is-live');void g.offsetWidth;g.classList.add('is-live')};
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){fire(x.target);io.unobserve(x.target)}}),{threshold:.25});gs.forEach(g=>io.observe(g));
  const h=document.querySelector('.hero-h .glitch');if(h){setTimeout(()=>{const w=document.querySelector('.warp');w&&w.classList.add('done')},700);(function loop(){setTimeout(()=>{if(!document.hidden&&scrollY<innerHeight)fire(h);loop()},6000+Math.random()*3000)})()}}
menu();pointer();glitches();heroLogo();scrollState();canvasLoop();reveals();
})();
