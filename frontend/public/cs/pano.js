/* Chaos Studio — panoramic drag wall. Ported from the live bundle (index-CWoAg6Fg.js, fn Tp + helpers):
   same constants, recycling grid, fisheye scale/opacity/3D tilt maths, inertia (.93), intro auto-drift (5.5 → *.971),
   wheel pan, click-vs-drag threshold (7px), near-zone reel previews. Added: pinch / ctrl+wheel / key zoom, keyboard pan,
   filtered item sets, Chaos-style tile markup. API: ChaosPano.init({stage,plane,onOpen,tile}) → {setItems,start,stop,zoom}. */
(function(){
let GAP=56;const PAD=1,CLICK=7,NEAR=.44,FAR=.58,BULGE=.14,FOCUS=.88,SAFE=.03,FADE=.46,DEPTH=360,ZMIN=.55,ZMAX=1.7;
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
/* v3 §6: cell 280×350 (+label strip), gap 56; mobile 168×210, gap 32 */
const MOB=()=>innerWidth<700;
const dims=()=>{const w=innerWidth;GAP=w<700?32:w<1100?44:56;return w<700?{tileW:168,tileH:246,cols:6}:w<1100?{tileW:220,tileH:316,cols:7}:{tileW:280,tileH:394,cols:8}};
const mod=(a,b)=>(a%b+b)%b;
function init(o){const stage=o.stage,plane=o.plane;let items=[],RM=reduced();
  let {tileW:W,tileH:H,cols:COLS}=dims(),fw=W+GAP,fh=H+GAP,x=0,y=0,vx=0,vy=0,drift=RM?0:5.5,drag=false,moved=0,px=0,py=0,pid=null,downId=null,z=1;
  let lastC=null,hudT=0,tiltX=0,tiltY=0;let tiles=[],st=[],M=0,I=0,raf=0,running=false,dirty=true,activeVideo=null,frame=0;
  const pts=new Map();let pinch0=0,z0=1;
  function build(){plane.textContent="";tiles=[];st.length=0;const C=stage.clientWidth||innerWidth,P=stage.clientHeight||innerHeight;
    M=Math.ceil(C/ZMIN/fw)+PAD*2+2;I=Math.ceil(P/ZMIN/fh)+PAD*2+2;const f=document.createDocumentFragment();
    for(let k=0;k<M*I;k++){const t=o.tile();f.appendChild(t);tiles.push(t);st.push({id:"",op:-1,z:-1,tr:"",vz:""})}plane.appendChild(f)}
  function bulge(n){return Math.min(fw/W-SAFE,1+n*n*BULGE)}
  function video(t,it,d,s){const v=t._v;if(!v||!it.preview)return;let zone=s.vz||"far";if(d<NEAR)zone="near";else if(d>FAR)zone="far";
    if(zone===s.vz)return;s.vz=zone;
    if(zone==="near"&&!RM){if(!v.src)v.src=it.preview;v.hidden=false;if(!activeVideo||activeVideo===v)v.play().then(()=>activeVideo=v).catch(()=>{})}
    else{v.pause();if(activeVideo===v)activeVideo=null;v.removeAttribute("src");v.load();v.hidden=true}}
  function layout(){if(!items.length)return;const C=stage.clientWidth,P=stage.clientHeight,cx=C/2,cy=P/2,N=items.length,R=Math.hypot(C,P)/2.35||1;
    const vw=C/z,vh=P/z,ox=cx-vw/2,oy=cy-vh/2; // visible plane window at zoom z (plane scaled about centre)
    const c0=Math.floor((x+ox)/fw)-PAD-1,r0=Math.floor((y+oy)/fh)-PAD-1;let k=0,bestZ=-1,best=null;
    for(let r=0;r<I;r++){const row=r0+r,ty0=row*fh-y;
      for(let c=0;c<M;c++,k++){const col=c0+c,ty=ty0+(mod(col,2)?H*.44:0),ny=(ty+H/2-cy)/R,t=tiles[k],s=st[k],it=items[mod(row*(COLS+1)+col,N)];
        if(s.id!==it.id){o.fill(t,it);s.id=it.id;s.vz="";if(t._v){t._v.pause();t._v.removeAttribute("src");t._v.hidden=true}}
        const tx=col*fw-x,nx=(tx+W/2-cx)/R,d=Math.min(1.25,Math.hypot(nx,ny)),foc=Math.max(0,1-d/FOCUS),fade=1-Math.min(FADE,d*d*.38),sc=bulge(foc)*fade,e=sc-1;
        const X=tx+nx*e*W*.72,Y=ty+ny*e*H*.38;let tr=`translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0)`;
        if(RM)tr+=` scale(${sc.toFixed(2)})`;else{const ry=nx*34*Math.min(1,d/.35),rx=-ny*24*Math.min(1,d/.35),tz=-(d*d)*DEPTH;{const m=MOB()?.5:1;tr+=` rotateY(${(ry*m+(it.ry||0)*m).toFixed(1)}deg) rotateX(${(rx*m).toFixed(1)}deg) translateZ(${(tz*m+(it.zz||0)*m).toFixed(0)}px) rotateZ(${(it.rz||0).toFixed(1)}deg) scale(${sc.toFixed(2)})`}}
        if(tr!==s.tr){t.style.transform=tr;s.tr=tr}
        const op=Math.round((.32+foc*.58)*fade*100)/100;if(op!==s.op){t.style.opacity=op;s.op=op;t.tabIndex=-1}
        const br=Math.round(Math.max(.45,1-d*.5)*20)/20;if(br!==s.br){t.style.setProperty('--fog',br);s.br=br}
        const zi=Math.round((1-d)*1e6-Math.abs(nx)*12e3-Math.abs(ny)*2e3)+2e5+k;if(zi!==s.z){t.style.zIndex=zi;s.z=zi}if(zi>bestZ){bestZ=zi;best=t}
        video(t,it,d,s)}}
    if(best!==lastC){lastC&&lastC.classList.remove('is-centre');best&&best.classList.add('is-centre');lastC=best}}
  function tick(){frame++;let need=dirty;dirty=false;
    if(!drag&&(Math.abs(vx)>.05||Math.abs(vy)>.05)){const f=MOB()?.94:.92;x+=vx;y+=vy;vx*=f;vy*=f;need=true}
    if(!drag&&!RM&&drift>0){x+=.62+drift;y+=.1+drift*.05;drift=drift>.01?drift*.971:0;need=true}
    else if(!drag&&!RM&&o.idleDrift){x+=.35;y+=.06;need=true}
    if(need&&(drag||Math.abs(vx)>=.08||Math.abs(vy)>=.08||frame%2===0))layout();
    {const tm=MOB()?3:6,gx=drag||Math.abs(vx)>.3?Math.max(-tm,Math.min(tm,vx*.25)):0,gy=drag||Math.abs(vy)>.3?Math.max(-tm,Math.min(tm,-vy*.25)):0;tiltX+=(gx-tiltX)*.15;tiltY+=(gy-tiltY)*.15;if(!RM)plane.style.transform=`scale(${z.toFixed(3)}) rotateY(${tiltX.toFixed(2)}deg) rotateX(${tiltY.toFixed(2)}deg)`}
    if(o.onMove&&frame-hudT>5){hudT=frame;o.onMove(x,y)}
    if(running)raf=requestAnimationFrame(tick)}
  function start(){if(!running){running=true;raf=requestAnimationFrame(tick)}}
  function stop(){running=false;cancelAnimationFrame(raf)}
  function setZoom(nz){z=Math.max(ZMIN,Math.min(ZMAX,nz));plane.style.transform=`scale(${z.toFixed(3)})`;stage.style.setProperty("--z",z.toFixed(2));dirty=true;layout()}
  function hideHint(){o.onInteract&&o.onInteract()}
  stage.addEventListener("pointerdown",e=>{if(e.button!==0&&e.pointerType==="mouse")return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){const [a,b]=[...pts.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);z0=z;drag=false;return}
    drag=true;moved=0;pid=e.pointerId;px=e.clientX;py=e.clientY;vx=vy=0;drift=0;const t=e.target.closest("[data-pano-id]");downId=t?t.dataset.panoId:null;
    stage.classList.add("is-grabbing");stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);hideHint()});
  addEventListener("pointermove",e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2&&pinch0){const [a,b]=[...pts.values()];setZoom(z0*Math.hypot(a.x-b.x,a.y-b.y)/pinch0);moved=99;return}
    if(!drag||e.pointerId!==pid)return;const dx=(e.clientX-px)/z,dy=(e.clientY-py)/z;px=e.clientX;py=e.clientY;x-=dx;y-=dy;vx=Math.max(-60,Math.min(60,-dx));vy=Math.max(-60,Math.min(60,-dy));moved+=Math.abs(dx)+Math.abs(dy);dirty=true});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch0=0;if(e.pointerId!==pid)return;drag=false;pid=null;stage.classList.remove("is-grabbing");
    if(moved<CLICK&&downId){const it=items.find(i=>i.id===downId);it&&o.onOpen(it)}downId=null;start()};
  addEventListener("pointerup",up);addEventListener("pointercancel",up);
  stage.addEventListener("click",e=>{if(e.target.closest("a"))e.preventDefault()}); // anchors are for semantics / middle-click only
  stage.addEventListener("wheel",e=>{e.preventDefault();hideHint();drift=0;if(e.ctrlKey){setZoom(z*Math.exp(-e.deltaY*.01));return}
    vx+=((e.shiftKey?e.deltaY:e.deltaX)*.9/z-vx)*.18;vy+=((e.shiftKey?0:e.deltaY)*.9/z-vy)*.18;dirty=true},{passive:false});
  stage.addEventListener("keydown",e=>{const k=e.key,s=60/z;let h=true;
    if(k==="ArrowRight")vx=s/4;else if(k==="ArrowLeft")vx=-s/4;else if(k==="ArrowDown")vy=s/4;else if(k==="ArrowUp")vy=-s/4;
    else if(k==="+"||k==="=")setZoom(z*1.15);else if(k==="-")setZoom(z/1.15);
    else if(k==="Enter"){const C=stage.clientWidth/2,P=stage.clientHeight/2,el=document.elementFromPoint(stage.getBoundingClientRect().left+C,stage.getBoundingClientRect().top+P);const t=el&&el.closest("[data-pano-id]");const it=t&&items.find(i=>i.id===t.dataset.panoId);it&&o.onOpen(it)}
    else h=false;if(h){e.preventDefault();drift=0;hideHint()}});
  addEventListener("resize",()=>{({tileW:W,tileH:H,cols:COLS}=dims());fw=W+GAP;fh=H+GAP;stage.style.setProperty("--tile-w",W+"px");stage.style.setProperty("--tile-h",H+"px");build();dirty=true;layout()});
  const io=new IntersectionObserver(es=>{(es[0]&&es[0].isIntersecting&&!document.hidden&&o.visible())?start():stop()});io.observe(stage);
  document.addEventListener("visibilitychange",()=>{document.hidden?stop():o.visible()&&start()});
  stage.style.setProperty("--tile-w",W+"px");stage.style.setProperty("--tile-h",H+"px");build();
  return{setItems(list){items=list;x=0;y=0;st.forEach(s=>{s.id="";s.tr="";s.vz=""});dirty=true;layout()},start,stop,zoom:f=>setZoom(z*f),relayout(){dirty=true;layout()}}}
window.ChaosPano={init};
})();
