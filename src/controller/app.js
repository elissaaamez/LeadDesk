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
  // Local mode reads opportunities from the backend; Live mode reads the real
  // Odoo records via n8n — fetch, then re-render with data.
  if(state.mode==='local'){ loadServerOpps().then(()=>renderPage()).catch(()=>{}); }
  else if(state.mode==='live'){ refreshLiveOpps(); }
}
/* Fetch the live Odoo opportunities, showing a loading state and an honest error
   if the workflow is unreachable. Used wherever Local mode calls loadServerOpps. */
async function refreshLiveOpps(){
  state.liveLoading=true; state.liveError=null; renderPage();
  try{ await loadLiveOpps(); }
  catch(e){ state.liveOpps=[]; state.liveError=e.message||'Could not reach the leads workflow'; }
  finally{ state.liveLoading=false; renderPage(); }
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
  if(m==='local'){ try{ await loadServerOpps(); }catch(e){ toast('Backend not reachable: '+e.message,'alert'); } renderPage(); }
  else if(m==='live'){ renderPage(); refreshLiveOpps(); }
  else renderPage();
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
function logoutUser(){
  if(state.session&&state.session.token) api.logout();
  state.session=null; state.serverOpps=[]; state.liveOpps=[]; state.liveError=null;
  LS.del('acp_session'); state.authView='landing'; render();
}
function wireShell(){
  $$('.nav-item').forEach(n=>n.addEventListener('click',()=>setTab(n.dataset.tab)));
  $$('.rail-mode button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#logoutBtn')?.addEventListener('click', logoutUser);
  $('#scrim')?.addEventListener('click', closeRail);
}
function openRail(){ $('#rail')?.classList.add('open'); $('#scrim')?.classList.add('open'); }
function closeRail(){ $('#rail')?.classList.remove('open'); $('#scrim')?.classList.remove('open'); }

/* Per-page header wiring: the mobile menu toggle and the always-visible Sign out button. */
function afterHead(){ $('#mtoggle')?.addEventListener('click', openRail); $('#headLogout')?.addEventListener('click', logoutUser); }

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
      const res=await api.live('analytics',{trigger:'dashboard',requested_by:state.session.email});
      if(!res.ok) throw new Error(res.data?.text || ('Analytics workflow returned HTTP '+res.status));
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
        const res=await api.live('leadCapture',{message:finalMsg,source:'AI CRM Platform console',submitted_by:state.session.email});
        if(!res.ok) throw new Error(res.data?.text || ('Lead capture workflow returned HTTP '+res.status));
        const d=res.data||{}; const status=d.status||'created';
        const ex=localExtract(finalMsg);
        renderCaptureResult({status, message:d.message||'', extract:{...ex, name:name||ex.name||'(detected server-side)'}, live:true});
        if(status!=='error' && status!=='duplicate') loadLiveOpps().catch(()=>{});  // re-pull from Odoo so the workspace shows the new lead
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
  $('#ws_refresh')?.addEventListener('click',()=>refreshLiveOpps());
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
      const res=await api.live('followUp',{trigger:'followup_center',requested_by:state.session.email});
      if(!res.ok) throw new Error(res.data?.text || ('Follow-up workflow returned HTTP '+res.status));
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
        // Structured questions (list / count / inactive / hot / id) are answered
        // exactly from the same live Odoo data the workspace shows. Only free-form
        // questions go to the conversational n8n agent.
        const direct=structuredAnswer(msg);
        if(direct){ reply=direct; }
        else {
          const res=await api.live('assistant',{message:msg,chatInput:msg,sessionId:'acp-console',source:'assistant'});
          if(!res.ok){ reply={text: res.data?.text || ('The assistant workflow returned HTTP '+res.status+'.')}; }
          else {
            const ans=res.data?.answer||res.data?.output||res.data?.text||(typeof res.data==='string'?res.data:'No answer returned.');
            reply=parseAssistant(ans);
          }
        }
      } else { await new Promise(r=>setTimeout(r,500)); reply=localAssistant(msg); }
    }catch(err){ reply={text:'I could not reach the assistant: '+err.message+'. Try Demo mode.'}; }
    state.chat.pop(); state.chat.push(Object.assign({role:'bot'},reply)); renderChat();
  });
}

/* =========================================================================
   SETTINGS
   ========================================================================= */
function wireSettings(){
  afterHead();
  $('#saveCfg').addEventListener('click',async ()=>{
    ['leadCapture','leadList','analytics','followUp','assistant'].forEach(k=>state.config[k]=$('#cfg_'+k).value.trim());
    persistConfig();
    // Mirror the endpoints to the backend so the Live proxy resolves the same URLs.
    try{ await api.saveSettings(state.config); }catch{}
    if(state.mode==='live') state.liveOpps=[];  // re-pull with the new endpoint next time the workspace opens
    toast('Settings saved');
  });
  $('#resetCfg').addEventListener('click',async ()=>{ state.config=Object.assign({},DEFAULTS); persistConfig(); try{ await api.saveSettings(state.config); }catch{} renderPage(); toast('Reset to defaults'); });
  $('#clearCap').addEventListener('click',()=>{ state.captured=[]; LS.set('acp_captured',[]); renderPage(); toast('Captured demo leads cleared','trash'); });
  $('#testCfg').addEventListener('click', async ()=>{
    ['leadCapture','leadList','analytics','followUp','assistant'].forEach(k=>state.config[k]=$('#cfg_'+k).value.trim());
    persistConfig();
    try{ await api.saveSettings(state.config); }catch{}
    // Probes go through the backend proxy (same origin, no CORS). Only read-safe
    // webhooks are auto-probed: crm-list-leads, crm-summary and the assistant have
    // no Odoo WRITE path, so a request cannot create or modify a lead. lead-capture
    // and smart-follow-up can write to Odoo, so they are left untested.
    const probe={ leadCapture:false, leadList:true, analytics:true, followUp:false, assistant:true };
    const payload={
      leadList:{ action:'list' },
      analytics:{ trigger:'connection-test', requested_by:(state.session&&state.session.email)||'console' },
      assistant:{ ping:true }
    };
    for(const k of ['leadCapture','leadList','analytics','followUp','assistant']){
      const dot=$('#st_'+k); const t=$('.t',dot);
      if(!probe[k]){ dot.className='statusdot warn'; t.textContent='not tested — would modify Odoo'; continue; }
      if(!state.config[k]){ dot.className='statusdot off'; t.textContent='not set'; continue; }
      dot.className='statusdot test'; t.textContent='testing…';
      try{
        const res=await api.live(k, payload[k]);
        if(res.ok){ dot.className='statusdot ok'; t.textContent='reachable'; }
        else { dot.className='statusdot off'; t.textContent = res.status ? ('HTTP '+res.status) : 'unreachable'; }
      }catch(e){
        dot.className='statusdot off';
        t.textContent='unreachable';
      }
    }
  });
}

/* ----------------------------------------------------------------- BOOT --- */
render();
