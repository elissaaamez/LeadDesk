/* ============================================================================
   CONTROLLER · APP — the orchestrator. Owns the render router, tab/mode
   switching, every page's event wiring, and the Live/Demo async operations
   (analytics + batch follow-up). It reads the model and calls the view; the
   view and model never call back into the controller.
   Loaded last; boots the app at the bottom.
   ========================================================================= */
"use strict";

/* =========================================================================
   RENDER — root router
   ========================================================================= */
function render(){
  const root=$('#root');
  if(!state.session){
    const view={ landing:viewLanding, login:viewLogin, signup:viewSignup };
    const wire={ landing:wireAuthNav, login:wireLogin, signup:wireSignup };
    root.innerHTML = (view[state.authView]||viewLanding)();
    (wire[state.authView]||wireAuthNav)();
    return;
  }
  root.innerHTML = viewShell();
  wireShell();
  renderPage();
  // Local mode reads opportunities from the backend — fetch, then re-render with data.
  if(state.mode==='local'){ loadServerOpps().then(()=>renderPage()).catch(()=>{}); }
}
/* Pre-login navigation between landing / login / signup. */
function setAuth(v){ state.authView=v; render(); }
function wireAuthNav(){ $$('[data-go]').forEach(b=>b.addEventListener('click',()=>setAuth(b.dataset.go))); }
function renderPage(){
  const main=$('#page');
  const map={ dashboard:viewDashboard, capture:viewCapture, workspace:viewWorkspace,
    followup:viewFollowup, assistant:viewAssistant, architecture:viewArchitecture, settings:viewSettings };
  main.innerHTML = (map[state.tab]||viewDashboard)();
  const wire={ dashboard:wireDashboard, capture:wireCapture, workspace:wireWorkspace,
    followup:wireFollowup, assistant:wireAssistant, architecture:()=>{}, settings:wireSettings };
  (wire[state.tab]||(()=>{}))();
  main.scrollIntoView?.({block:'start'});
}
function setTab(t){ state.tab=t; $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.tab===t)); renderPage(); closeRail(); }
async function setMode(m){
  state.mode=m; LS.set('acp_mode', m);
  $$('.rail-mode button').forEach(b=>b.classList.toggle('on', b.dataset.mode===m));
  const msg={demo:'Demo mode — using local dataset', local:'Local mode — using the local database', live:'Live mode — calling n8n webhooks'}[m];
  toast(msg, {demo:'demo', local:'database', live:'broadcast'}[m]);
  if(m==='local'){ try{ await loadServerOpps(); }catch(e){ toast('Backend not reachable: '+e.message,'alert'); } }
  renderPage();
}

/* =========================================================================
   LOGIN
   ========================================================================= */
function wireLogin(){
  wireAuthNav();
  $$('.cred').forEach(c=>c.addEventListener('click',()=>{ $('#li_email').value=c.dataset.email; $('#li_pass').value=c.dataset.pass; }));
  $('#loginForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const email=$('#li_email').value.trim().toLowerCase(), pass=$('#li_pass').value;
    const showErr=(m)=>$('#li_err').innerHTML=`<div class="flex gap-[9px] items-center bg-[rgba(176,69,90,.1)] text-[#923146] border border-[rgba(176,69,90,.2)] rounded-[12px] px-[13px] py-[11px] text-[13.5px] font-semibold mb-[14px]">${I('alert',16)} ${esc(m)}</div>`;
    const enter=async(sess)=>{ state.session=sess; LS.set('acp_session', state.session); if(state.mode==='local'){ try{ await loadServerOpps(); }catch{} } state.tab='dashboard'; render(); };
    try{
      // Prefer real auth against the local backend.
      const { token, user }=await api.login(email, pass);
      await enter({ email:user.email, name:user.name, role:user.role, token, at:Date.now() });
    }catch(err){
      if(isNetworkError(err)){
        // No backend (e.g. opened as a static file) — fall back to offline demo accounts.
        const u=USERS.find(x=>x.email===email && x.password===pass);
        if(u){ await enter({ email:u.email, name:u.name, role:u.role, at:Date.now() }); }
        else showErr('Invalid email or password.');
      } else { showErr(err.message||'Invalid email or password.'); }
    }
  });
}

/* =========================================================================
   SIGN UP — creates a real account in the backend when available; falls back
   to the demo hand-off (route to sign-in) when no backend is reachable.
   ========================================================================= */
function wireSignup(){
  wireAuthNav();
  $('#signupForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const name=$('#su_name').value.trim(), email=$('#su_email').value.trim().toLowerCase(), pass=$('#su_pass').value, pass2=$('#su_pass2').value;
    const showErr=(m)=>$('#su_err').innerHTML=`<div class="flex gap-[9px] items-center bg-[rgba(176,69,90,.1)] text-[#923146] border border-[rgba(176,69,90,.2)] rounded-[12px] px-[13px] py-[11px] text-[13.5px] font-semibold mb-[14px]">${I('alert',16)} ${esc(m)}</div>`;
    if(!name||!email||!pass){ showErr('Please fill in name, email and password.'); return; }
    if(pass!==pass2){ showErr('Passwords do not match.'); return; }
    try{
      const { token, user }=await api.signup(name, email, pass);
      state.session={ email:user.email, name:user.name, role:user.role, token, at:Date.now() };
      LS.set('acp_session', state.session);
      toast('Account created — welcome','check');
      if(state.mode==='local'){ try{ await loadServerOpps(); }catch{} }
      state.tab='dashboard'; render();
    }catch(err){
      if(isNetworkError(err)){ toast('Demo sign-up — continue with a demo account to sign in','user'); setAuth('login'); }
      else showErr(err.message||'Could not create account.');
    }
  });
}

/* =========================================================================
   SHELL (rail + topbar)
   ========================================================================= */
function wireShell(){
  $$('.nav-item').forEach(n=>n.addEventListener('click',()=>setTab(n.dataset.tab)));
  $$('.rail-mode button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#logoutBtn').addEventListener('click',()=>{ if(state.session&&state.session.token) api.logout(); state.session=null; state.serverOpps=[]; LS.del('acp_session'); state.authView='landing'; render(); });
  $('#scrim')?.addEventListener('click', closeRail);
}
function openRail(){ $('#rail')?.classList.add('open'); $('#scrim')?.classList.add('open'); }
function closeRail(){ $('#rail')?.classList.remove('open'); $('#scrim')?.classList.remove('open'); }

function afterHead(){ $('#mtoggle')?.addEventListener('click', openRail); }

/* =========================================================================
   DASHBOARD
   ========================================================================= */
function wireDashboard(){
  afterHead();
  const root=$('#page');
  $$('[data-count]', root).forEach(el=>animateCount(el, +el.dataset.count));
  animateBars(root);
  if(state.analytics) renderSummary(state.analytics);
  $('#runAnalytics').addEventListener('click', runAnalytics);
}
async function runAnalytics(){
  const btn=$('#runAnalytics'); btn.disabled=true; btn.innerHTML=`${I('refresh',16)} Running…`;
  $('#summaryBox').innerHTML=`<div class="${UI.empty}"><div class="${UI.ei}">${I('refresh',24)}</div><b class="${UI.emptyTitle}">Generating briefing…</b><p class="${UI.emptyP}">${state.mode==='live'?'Calling the analytics webhook.':'Composing the on-device summary.'}</p></div>`;
  try{
    let text;
    if(state.mode==='live'){
      const res=await postJson(state.config.analytics,{trigger:'dashboard',requested_by:state.session.email});
      const d=res.data||{};
      text = d.text||d.output||d.summary||(typeof d==='string'?d:JSON.stringify(d,null,2));
    } else if(state.mode==='local'){
      const d=await api.analytics();
      text = d.text;
    } else {
      await new Promise(r=>setTimeout(r,650));
      text = composeLocalSummary();
    }
    state.analytics=text; renderSummary(text); toast('Analytics summary ready');
  }catch(e){
    $('#summaryBox').innerHTML=`<div class="${UI.notice} ${UI.noticeWarn}">${I('alert',17)}<span>Could not reach the analytics webhook: ${esc(e.message)}. Check Settings or switch to Demo mode.</span></div>`;
  }finally{ btn.disabled=false; btn.innerHTML=`${I('play',16)} Run analytics`; }
}

/* =========================================================================
   LEAD CAPTURE
   ========================================================================= */
function wireCapture(){
  afterHead();
  $('#capForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const msg=$('#cap_msg').value.trim();
    const name=$('#cap_name').value.trim(), email=$('#cap_email').value.trim(), phone=$('#cap_phone').value.trim();
    if(!msg && !name && !email){ toast('Add a message or at least a name/email','alert'); return; }
    const finalMsg = msg || `Hello, my name is ${name}. I am interested in your CRM automation solution. My email is ${email} and my phone is ${phone}.`;
    const btn=$('#capBtn'); btn.disabled=true; btn.innerHTML=`${I('refresh',16)} Processing…`;
    try{
      if(state.mode==='live'){
        const res=await postJson(state.config.leadCapture,{message:finalMsg,source:'AI CRM Platform console',submitted_by:state.session.email});
        const d=res.data||{}; const status=d.status||(res.ok?'created':'error');
        const ex=localExtract(finalMsg);
        renderCaptureResult({status, message:d.message||'', extract:{...ex, name:name||ex.name||'(detected server-side)'}, live:true});
      } else if(state.mode==='local'){
        const r=await api.capture({ message:finalMsg, name, email, phone });
        await loadServerOpps();
        renderCaptureResult({ status:r.status, message:'', extract:r.extract, dup:r.duplicate||undefined });
      } else {
        await new Promise(r=>setTimeout(r,600));
        const ex=localExtract(finalMsg);
        const dispName=name|| (finalMsg.match(/my name is ([^.,\n]+)/i)?.[1]?.trim()) || (ex.email?ex.email.split('@')[0]:'New lead');
        const e1=(email||ex.email||'').toLowerCase(), p1=(phone||ex.phone||'').replace(/\s/g,'');
        const dup=allLeads().find(l=>l.type==='opportunity' && ((e1 && (l.email_from||'').toLowerCase()===e1) || (p1 && (l.phone||'').replace(/\s/g,'')===p1)));
        if(dup){
          renderCaptureResult({status:'duplicate', message:'Lead already exists', extract:{...ex,name:dispName,email:email||ex.email,phone:phone||ex.phone}, dup});
        } else {
          const lead={ id:2000+state.captured.length, name:dispName, email_from:email||ex.email, phone:phone||ex.phone, type:'opportunity',
            interest:ex.interest, intent:ex.intent, priority:ex.priority, create_date:new Date().toISOString(), write_date:new Date().toISOString(), expected_revenue:0 };
          state.captured.unshift(lead); LS.set('acp_captured', state.captured.slice(0,40));
          renderCaptureResult({status:'created', message:'Lead created successfully', extract:{...ex,name:dispName,email:email||ex.email,phone:phone||ex.phone}});
        }
      }
    }catch(err){
      renderCaptureResult({status:'error', message:err.message});
    }finally{ btn.disabled=false; btn.innerHTML=`${I('zap',16)} Extract &amp; create opportunity`; }
  });
}

/* =========================================================================
   LEAD WORKSPACE
   ========================================================================= */
function wireWorkspace(){
  afterHead();
  $('#ws_q').addEventListener('input', e=>{ wsState.q=e.target.value; renderWsList(); });
  $$('.seg button').forEach(b=>b.addEventListener('click',()=>{ wsState.filter=b.dataset.f; $$('.seg button').forEach(x=>x.classList.toggle('on',x===b)); renderWsList(); }));
  renderWsList();
}

/* =========================================================================
   FOLLOW-UP CENTER
   ========================================================================= */
function wireFollowup(){
  afterHead();
  $$('[data-count]').forEach(el=>animateCount(el,+el.dataset.count));
  if(state.followup) renderFollowups(state.followup);
  $('#runFollow').addEventListener('click', runFollowup);
}
async function runFollowup(){
  const btn=$('#runFollow'); btn.disabled=true; btn.innerHTML=`${I('refresh',16)} Running…`;
  $('#followBox').innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups</div><div class="${UI.empty}"><div class="${UI.ei}">${I('refresh',24)}</div><b class="${UI.emptyTitle}">Generating messages…</b><p class="${UI.emptyP}">${state.mode==='live'?'Calling the smart follow-up webhook.':'Drafting on-device.'}</p></div>`;
  try{
    let results;
    if(state.mode==='live'){
      const res=await postJson(state.config.followUp,{trigger:'followup_center',requested_by:state.session.email});
      let d=res.data; const arr=Array.isArray(d)?d:(d&&typeof d==='object'?[d]:[]);
      results=arr.map(x=>({ name:x.name||'Lead', email:x.email||'', inactive_days:x.inactive_days, message:x.follow_up_message||x.text||'' })).filter(r=>r.message);
      if(!results.length){
        const note=(typeof d==='string' && d.trim()) ? esc(d) : 'No opportunities are inactive for ≥ 7 days, so the workflow returned nothing to send.';
        $('#followBox').innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups</div><div class="${UI.empty}"><div class="${UI.ei}">${I('check',24)}</div><b class="${UI.emptyTitle}">No follow-ups generated</b><p class="${UI.emptyP}">${note}</p></div>`;
        state.followup=null; return;
      }
    } else if(state.mode==='local'){
      results=await api.followups();
      if(!results.length){
        $('#followBox').innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups</div><div class="${UI.empty}"><div class="${UI.ei}">${I('check',24)}</div><b class="${UI.emptyTitle}">No follow-ups generated</b><p class="${UI.emptyP}">No opportunities are inactive for ≥ 7 days.</p></div>`;
        state.followup=null; return;
      }
    } else {
      await new Promise(r=>setTimeout(r,750));
      const inactive=allLeads().filter(l=>l.type==='opportunity').filter(l=>{const dd=daysSince(l.write_date||l.create_date);return dd!=null&&dd>=7;});
      results=inactive.map(l=>({ name:l.name, email:l.email_from, inactive_days:daysSince(l.write_date||l.create_date), priority:l.priority, message:draftFollowUp(l) }));
    }
    state.followup=results; renderFollowups(results); toast(`${results.length} follow-up${results.length>1?'s':''} generated`);
  }catch(e){
    $('#followBox').innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups</div><div class="${UI.notice} ${UI.noticeWarn}">${I('alert',17)}<span>Could not reach the follow-up webhook: ${esc(e.message)}. Check Settings or use Demo mode.</span></div>`;
  }finally{ btn.disabled=false; btn.innerHTML=`${I('refresh',16)} Run batch follow-up`; }
}

/* =========================================================================
   AI ASSISTANT
   ========================================================================= */
function wireAssistant(){
  afterHead();
  renderChat();
  $$('#chatQuick .qchip').forEach(c=>c.addEventListener('click',()=>{ $('#chatMsg').value=c.textContent; $('#chatForm').requestSubmit(); }));
  $('#chatForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const msg=$('#chatMsg').value.trim(); if(!msg) return;
    $('#chatMsg').value='';
    state.chat.push({role:'user',text:msg}); renderChat();
    state.chat.push({role:'bot',typing:true}); renderChat();
    let reply;
    try{
      if(state.mode==='live'){
        if(!state.config.assistant) reply={text:'Live mode is on but no assistant webhook is configured. Add it in Settings, or switch to Demo mode.'};
        else { const res=await postJson(state.config.assistant,{message:msg,chatInput:msg,sessionId:'acp-console',source:'assistant'},15000);
          const ans=res.data?.answer||res.data?.output||res.data?.text||(typeof res.data==='string'?res.data:'No answer returned.');
          reply=parseAssistant(ans); }
      } else { await new Promise(r=>setTimeout(r,500)); reply=localAssistant(msg); }
    }catch(err){ reply={text:'I could not reach the assistant webhook: '+err.message+'. Try Demo mode.'}; }
    state.chat.pop(); state.chat.push(Object.assign({role:'bot'},reply)); renderChat();
  });
}

/* =========================================================================
   SETTINGS
   ========================================================================= */
function wireSettings(){
  afterHead();
  $('#saveCfg').addEventListener('click',()=>{
    ['leadCapture','analytics','followUp','assistant'].forEach(k=>state.config[k]=$('#cfg_'+k).value.trim());
    persistConfig(); toast('Settings saved');
  });
  $('#resetCfg').addEventListener('click',()=>{ state.config=Object.assign({},DEFAULTS); persistConfig(); renderPage(); toast('Reset to defaults'); });
  $('#clearCap').addEventListener('click',()=>{ state.captured=[]; LS.set('acp_captured',[]); renderPage(); toast('Captured demo leads cleared','trash'); });
  $('#testCfg').addEventListener('click', async ()=>{
    ['leadCapture','analytics','followUp','assistant'].forEach(k=>state.config[k]=$('#cfg_'+k).value.trim());
    // Endpoints reachable through an Odoo WRITE path are NOT probed until the workflow ping-guard
    // exists, so a connection test can never create a lead or modify CRM data. crm-summary has no
    // write node, so it is always safe to exercise. Once the ping-guard is imported, flip these to true.
    const probe={ leadCapture:false, analytics:true, followUp:false, assistant:false };
    const payload={
      leadCapture:{ ping:true },
      analytics:{ trigger:'connection-test', requested_by:(state.session&&state.session.email)||'console' },
      followUp:{ ping:true },
      assistant:{ ping:true }
    };
    for(const k of ['leadCapture','analytics','followUp','assistant']){
      const dot=$('#st_'+k); const t=$('.t',dot);
      if(!probe[k]){ dot.className='statusdot warn'; t.textContent='not tested — would modify Odoo'; continue; }
      if(!state.config[k]){ dot.className='statusdot off'; t.textContent='not set'; continue; }
      dot.className='statusdot test'; t.textContent='testing…';
      try{
        const res=await postJson(state.config[k], payload[k], 8000);
        if(res.ok){ dot.className='statusdot ok'; t.textContent='reachable'; }
        else { dot.className='statusdot warn'; t.textContent='HTTP '+res.status; }
      }catch(e){
        dot.className='statusdot off';
        t.textContent = e.name==='AbortError' ? 'timeout' : 'unreachable';
      }
    }
  });
}

/* ----------------------------------------------------------------- BOOT --- */
render();
