/* ============================================================================
   VIEW · CHARTS — self-contained SVG/DOM chart builders (bars, donut, legend)
   and the small count/bar animations. Tailwind utilities for styling; the
   [data-bars] attribute, the .bar class, and the inline height/gradient are
   preserved because animateBars() drives them at runtime.
   ========================================================================== */
"use strict";

/* ------------------------------------------------------------- CHARTS --- */
function barsHTML(data){
  const max = Math.max(1, ...data.map(d=>d.value));
  return `<div class="flex items-end gap-[14px] h-[230px] pt-2 px-1" data-bars>${data.map(d=>`
    <div class="flex-1 flex flex-col items-center gap-[10px] h-full justify-end">
      <div class="bar w-full max-w-[54px] rounded-t-[9px] rounded-b-[4px] relative transition-[height] duration-1000 ease-[cubic-bezier(.22,1,.36,1)] min-h-[4px]" data-h="${Math.round((d.value/max)*100)}" style="height:0%;background:linear-gradient(${d.c1||'var(--accent)'},${d.c2||'var(--accent-deep)'})">
        <span class="absolute -top-[22px] left-1/2 -translate-x-1/2 font-mono text-[13px] font-semibold text-ink">${d.value}</span>
      </div>
      <div class="text-[11.5px] font-bold text-muted text-center leading-[1.25] h-[30px] flex items-start justify-center">${esc(d.label)}</div>
    </div>`).join('')}</div>`;
}
function animateBars(root){
  $$('[data-bars] .bar', root).forEach((b,i)=>{ setTimeout(()=>{ b.style.height=b.dataset.h+'%'; }, 80+i*70); });
}
function donutHTML(segments, size=150, centerTop='', centerBot=''){
  const total = segments.reduce((s,x)=>s+x.value,0) || 1;
  const r = (size/2)-13, cx=size/2, cy=size/2, C=2*Math.PI*r;
  let off=0;
  const rings = segments.map(s=>{
    const len=(s.value/total)*C;
    const c=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="16"
      stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" stroke-linecap="butt"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    off+=len; return c;
  }).join('');
  return `<div class="relative shrink-0" style="width:${size}px;height:${size}px;animation:rv .6s ease both">
    <svg width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(22,38,42,.06)" stroke-width="16"/>
      ${rings}
    </svg>
    <div class="absolute inset-0 grid place-content-center text-center"><b class="font-display font-semibold text-[30px] block leading-none">${centerTop}</b><span class="text-[11px] text-muted font-bold tracking-[.04em] uppercase">${centerBot}</span></div>
  </div>`;
}
function legendHTML(segments){
  return `<div class="grid gap-[11px]">${segments.map(s=>`
    <div class="flex items-center gap-[10px] text-[13.5px]"><span class="w-[11px] h-[11px] rounded-[4px] shrink-0" style="background:${s.color}"></span>${esc(s.label)}<b class="ml-auto font-mono font-semibold">${s.value}</b></div>`).join('')}</div>`;
}
function animateCount(el, target, dur=900){
  const start=performance.now();
  function step(now){
    const p=Math.min(1,(now-start)/dur);
    const e=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*e);
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
