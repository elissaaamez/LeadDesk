/* ============================================================================
   VIEW · FORMAT — shared presentation helpers: DOM selectors, HTML escaping,
   value formatters (dates, money, initials), and the toast/copy utilities.
   ========================================================================== */
"use strict";

/* ----------------------------------------------------------- UTILITIES --- */
const $  = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(n){ const p=String(n||'?').trim().split(/\s+/); const a=(p[0]||'?')[0]||''; const b=(p[1]||'')[0]||''; return (a+b).toUpperCase()||'?'; }
function daysSince(iso){ if(!iso) return null; return Math.floor((Date.now()-new Date(iso).getTime())/DAY); }
function fmtDate(iso){ if(!iso) return '—'; const d=new Date(iso); return d.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}); }
function fmtMoney(n){ if(!n) return '—'; return new Intl.NumberFormat(undefined,{maximumFractionDigits:0}).format(n)+' TND'; }
function priorityClass(p){ return p==='hot'?'b-hot':p==='warm'?'b-warm':'b-cold'; }

let toastT;
function toast(msg, icon='check'){
  const t=$('#toast'); t.innerHTML=I(icon,17)+'<span>'+esc(msg)+'</span>'; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), 2600);
}
function copyText(txt){ navigator.clipboard?.writeText(txt).then(()=>toast('Copied to clipboard')).catch(()=>toast('Copy failed','alert')); }

/* ------------------------------------------------------------- UI MAP --- */
/* Tailwind utility-class strings for the repeated atoms, kept in one place so
   the markup stays DRY while still emitting pure utilities into the class
   attribute. Values mirror the old styles.css 1:1 (arbitrary values where the
   original used exact px). State / combinator classes (.active, .on, .sel,
   badges, status dots, mode pill, result tints) live in index.html's residual
   <style> because the app's JS toggles them at runtime. */
const _BTN='inline-flex items-center justify-center gap-[9px] rounded-[13px] px-[17px] py-[11px] font-bold text-[14px] border border-transparent whitespace-nowrap transition active:translate-y-px';
const UI = {
  btnPrimary:_BTN+' bg-ink text-paper-2 shadow-[0_12px_26px_rgba(22,38,42,.22)] hover:bg-[#21363B] hover:-translate-y-px disabled:opacity-[0.55] disabled:cursor-not-allowed',
  btnAccent:_BTN+' text-white bg-gradient-to-br from-accent to-accent-deep shadow-[0_12px_26px_rgba(58,111,121,.3)] hover:-translate-y-px',
  btnGhost:_BTN+' bg-card border-[color:var(--line)] text-ink-soft hover:border-accent hover:text-ink hover:-translate-y-px hover:shadow-soft',
  btnSm:'!px-[13px] !py-2 !text-[13px] !rounded-[10px]',
  card:'bg-card border border-[color:var(--line)] rounded-[18px] shadow-soft p-[22px]',
  cardLg:'bg-card border border-[color:var(--line)] shadow-soft rounded-[26px] p-[26px]',
  cardTitle:'flex items-center gap-[11px] font-display font-semibold text-[18.5px] mb-1 tracking-[-.1px]',
  ti:'w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0 bg-[rgba(111,169,180,.13)] text-accent-deep',
  cardSub:'text-muted text-[13.5px] mb-4 leading-[1.55]',
  input:'w-full bg-card border border-[color:var(--line)] rounded-[13px] px-[15px] py-[13px] text-[15px] transition placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_4px_rgba(111,169,180,.14)] focus:bg-white focus:outline-none',
  textarea:'min-h-[120px] resize-y leading-[1.6]',
  chip:'inline-flex items-center gap-[7px] bg-card border border-[color:var(--line)] rounded-full px-[13px] py-[7px] text-[12.5px] font-bold text-ink-soft',
  eyebrow:'inline-flex items-center gap-[7px] text-[11.5px] font-extrabold tracking-[.14em] uppercase text-accent-deep',
  headActions:'flex gap-[10px] items-center shrink-0',
  empty:'border-[1.5px] border-dashed border-[color:var(--line)] rounded-[16px] px-6 py-[34px] text-center text-muted',
  ei:'w-[52px] h-[52px] mx-auto mb-3 rounded-[14px] grid place-items-center bg-[rgba(111,169,180,.1)] text-accent-deep',
  emptyTitle:'block text-ink-soft text-[16px] mb-[5px] font-display font-semibold',
  emptyP:'max-w-[380px] mx-auto text-[13.5px] leading-[1.55]',
  notice:'flex gap-[11px] items-start rounded-[13px] px-[15px] py-[13px] text-[13.5px] font-semibold leading-[1.5]',
  noticeInfo:'bg-[rgba(111,169,180,.12)] text-[#3f6e76]',
  noticeWarn:'bg-[rgba(194,145,63,.12)] text-[#8a6018]',
  noticeSoft:'bg-card-2 text-ink-soft border border-[color:var(--line)]',
  kv:'grid grid-cols-2 max-[900px]:grid-cols-1 gap-[10px] my-4',
  cell:'bg-card-2 border border-[color:var(--line)] rounded-[12px] px-[13px] py-[11px]',
  cellSpan:'block text-[11px] font-extrabold tracking-[.06em] uppercase text-faint mb-1',
  mailbox:'bg-gradient-to-br from-[rgba(111,169,180,.1)] to-card-2 border border-[color:var(--line)] rounded-[14px] p-4 leading-[1.65] whitespace-pre-wrap text-[14px] text-ink-soft mt-2',
  summary:'whitespace-pre-wrap bg-card-2 border border-[color:var(--line)] rounded-[14px] p-[18px] leading-[1.7] text-[14.5px] text-ink-soft',
  badge:'inline-flex items-center gap-[6px] text-[11.5px] font-extrabold tracking-[.03em] px-[10px] py-[5px] rounded-full capitalize',
  modepill:'inline-flex items-center gap-[7px] text-[11.5px] font-extrabold tracking-[.04em] px-[11px] py-[6px] rounded-full',
  flowstrip:'grid grid-cols-4 max-[1180px]:grid-cols-2 gap-0 mt-[6px]',
  flownode:'relative px-4 py-[18px] text-center',
  flownodeN:'w-[42px] h-[42px] mx-auto mb-[11px] rounded-[13px] grid place-items-center bg-[rgba(111,169,180,.12)] text-accent-deep',
  mtoggle:'hidden max-[900px]:inline-flex max-[900px]:items-center max-[900px]:justify-center max-[900px]:w-[42px] max-[900px]:h-[42px] max-[900px]:rounded-[12px] max-[900px]:bg-card max-[900px]:border max-[900px]:border-[color:var(--line)] max-[900px]:text-ink'
};
