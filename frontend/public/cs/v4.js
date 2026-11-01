/* v4: shape-2 scroll grow + stepped pixel reveal; hero shape-5 parallax hook already in app.js (--logo-mx/my). */
(function(){
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const g=document.getElementById("grow2");
if(g){
  if(RM){g.classList.add("on","done");g.style.setProperty("--g2","1")}
  else{
    let raf=0,max=0;
    const upd=()=>{raf=0;const r=g.parentElement.getBoundingClientRect(),h=innerHeight;
      const p=Math.max(0,Math.min(1,(h-r.top)/(h*.9)));if(p>max)max=p; // grows, then stays
      g.style.setProperty("--g2",max.toFixed(3));
      if(max>.05&&!g.classList.contains("on")){g.classList.add("on");
        const n=g.querySelectorAll("rect").length;setTimeout(()=>g.classList.add("done"),n*24+200)}};
    addEventListener("scroll",()=>{raf||(raf=requestAnimationFrame(upd))},{passive:true});upd();
  }
}
})();
/* v5: hide floating nav while a full-screen final section fills the view */
(function(){const f=document.querySelector(".studio-finale,[data-final-fullscreen]");if(!f||!("IntersectionObserver"in window))return;
new IntersectionObserver(es=>es.forEach(e=>document.body.classList.toggle("nav-hide",e.intersectionRatio>=.5)),{threshold:[0,.5,1]}).observe(f)})();
