/* ============================================================================
   VIEW · VIEWS — every screen's markup builder plus the render* helpers that
   paint results into the DOM. Styling is Tailwind utilities (see the UI map in
   format.js for the shared atoms). Class names the controller selects on
   (.nav-item, .cred, .lead-row, .seg button, .qchip, .statusdot, .bar) and the
   JS-toggled state classes (.active, .on, .sel, badges, .modepill, .result …)
   are preserved — those live in index.html's residual <style>.
   ========================================================================== */
"use strict";

/* =========================================================================
   LANDING — the public entry page. Markets the console honestly (no invented
   numbers; the preview uses the real demo dataset) and routes to login/signup
   via [data-go] buttons wired by the controller.
   ========================================================================= */
function viewLanding(){
  const k=computeKPIs(allLeads());
  const pr=priorityBreakdown(allLeads());
  const feat=[
    {ic:'send',    t:'Lead capture & classify', d:'Paste any customer message — email, form note, WhatsApp. The model extracts name, contact, intent and priority into a structured opportunity.'},
    {ic:'shield',  t:'Duplicate-safe',          d:'Email and phone are matched against existing opportunities before anything is written, so your CRM stays clean.'},
    {ic:'refresh', t:'Smart follow-ups',         d:'Find opportunities that have gone quiet and draft a tailored, professional follow-up for each in one batch.'},
    {ic:'activity',t:'Pipeline analytics',       d:'Five KPIs and a short, numbers-only manager briefing — generated from your live counts, never invented.'},
    {ic:'bot',     t:'CRM assistant',            d:'Ask in plain language to list, look up, count or act on opportunities through an Odoo-connected agent.'},
    {ic:'demo',    t:'Honest demo mode',         d:'Present every feature offline from a labelled local dataset — the UI never pretends to read a CRM that is not connected.'}
  ];
  const steps=[
    {ic:'message', t:'Message in',     d:'A customer reaches out on any channel.'},
    {ic:'cpu',     t:'Extract & score', d:'The local model structures and prioritises it.'},
    {ic:'shield',  t:'Duplicate check', d:'Existing records are matched on email & phone.'},
    {ic:'database',t:'Created in Odoo', d:'A clean opportunity lands in your CRM.'}
  ];
  const ghostDark='inline-flex items-center justify-center gap-[9px] rounded-[13px] px-[17px] py-[11px] font-bold text-[14px] border border-white/[.14] bg-white/[.06] text-[#E8EEEE] transition hover:bg-white/[.12] hover:-translate-y-px';
  const sectionPad='max-w-[1180px] mx-auto px-6 py-[clamp(48px,7vw,84px)]';
  const h2='font-display font-medium text-[clamp(26px,3.4vw,38px)] tracking-[-.3px] mt-3 mb-3';
  return `
  <div class="bg-paper">
    <header class="sticky top-0 z-30 backdrop-blur-md bg-paper/80 border-b border-[color:var(--line)]">
      <div class="max-w-[1180px] mx-auto px-6 h-[68px] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-[12px] grid place-items-center shrink-0 bg-gradient-to-br from-mist to-accent text-[#0F1E22] shadow-[0_8px_20px_rgba(58,111,121,.25)]">${I('brain',20)}</div>
          <div><b class="font-display font-semibold text-[16px] block leading-none">AI CRM Platform</b><span class="text-[10.5px] text-faint tracking-[.16em] uppercase">Sales Operations</span></div>
        </div>
        <div class="flex items-center gap-3">
          <button class="${UI.btnGhost} ${UI.btnSm}" data-go="login">Sign in</button>
          <button class="${UI.btnPrimary} ${UI.btnSm}" data-go="signup">Get started</button>
        </div>
      </div>
    </header>

    <section class="relative overflow-hidden text-[#F4EEE4] bg-[linear-gradient(168deg,#16262A_0%,#1C2E33_55%,#264248_100%)]">
      <div class="absolute inset-0 bg-[radial-gradient(640px_420px_at_82%_-6%,rgba(111,169,180,.28),transparent_60%),radial-gradient(560px_460px_at_-4%_108%,rgba(111,169,180,.26),transparent_60%)]"></div>
      <div class="relative z-[1] max-w-[1180px] mx-auto px-6 py-[clamp(56px,9vw,104px)] grid grid-cols-[1.1fr_.9fr] gap-12 items-center max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div>
          <span class="inline-flex items-center gap-2 text-[11.5px] font-extrabold tracking-[.14em] uppercase text-[#9BD3DC]">${I('sparkles',14)} Lead operations, automated</span>
          <h1 class="font-display font-medium text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-.4px] mt-4 mb-5">Turn every customer message into a <span class="text-[#9BD3DC]">qualified opportunity</span>.</h1>
          <p class="max-w-[520px] text-[#CBD6D6] text-[17px] leading-[1.65] m-0">Capture leads from any channel, block duplicates before they reach your CRM, draft tailored follow-ups, and read your pipeline at a glance — orchestrated by n8n, reasoned by a local Ollama model, stored in Odoo.</p>
          <div class="flex gap-3 mt-8 flex-wrap">
            <button class="${UI.btnAccent}" data-go="signup">${I('arrow',16)} Get started</button>
            <button class="${ghostDark}" data-go="login">Sign in to console</button>
          </div>
          <div class="flex items-center gap-2 mt-8 text-[12.5px] text-[#9FB0B1]">${I('shield',14)} Runs locally · n8n · Ollama · Odoo CRM</div>
        </div>
        <div class="relative">
          <div class="bg-white/[.06] border border-white/[.12] rounded-[20px] p-5 backdrop-blur-md shadow-[0_30px_70px_rgba(0,0,0,.3)]">
            <div class="flex items-center justify-between mb-4">
              <b class="font-display font-semibold text-[15px]">Pipeline at a glance</b>
              <span class="text-[10.5px] font-extrabold tracking-[.08em] uppercase text-[#E6C98A] bg-white/[.07] px-2 py-1 rounded-full">Demo data</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              ${[['Opportunities',k.total],['Inactive ≥ 7d',k.inactive],['Hot leads',pr.hot]].map(x=>`<div class="bg-white/[.05] border border-white/[.1] rounded-[13px] p-3"><div class="text-[10.5px] text-[#9FB0B1] font-bold leading-tight">${x[0]}</div><div class="font-display font-semibold text-[24px] mt-1">${x[1]}</div></div>`).join('')}
            </div>
            <div class="mt-3 grid gap-2">
              ${[['send','Lead captured & classified'],['shield','Duplicate blocked'],['refresh','Follow-up drafted']].map(x=>`<div class="flex items-center gap-3 bg-white/[.04] border border-white/[.08] rounded-[12px] px-3 py-[10px]"><span class="text-[#9BD3DC]">${I(x[0],16)}</span><span class="text-[13px] text-[#E2EAEA]">${x[1]}</span><span class="ml-auto text-[#7FB089]">${I('check',15)}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="${sectionPad}">
      <div class="max-w-[640px] mx-auto text-center">
        <span class="${UI.eyebrow}">${I('layers',14)} What it does</span>
        <h2 class="${h2}">Five tools, one console</h2>
        <p class="text-muted text-[15.5px] leading-[1.6] m-0">Everything a small sales team needs to work its pipeline faster — without replacing Odoo.</p>
      </div>
      <div class="grid grid-cols-3 max-[900px]:grid-cols-1 gap-5 mt-12">
        ${feat.map(f=>`<div class="${UI.card} reveal transition hover:-translate-y-[3px] hover:shadow-card"><div class="${UI.ti} mb-3">${I(f.ic,18)}</div><b class="font-display font-semibold text-[16.5px] block mb-[6px]">${f.t}</b><p class="text-muted text-[13.5px] leading-[1.6] m-0">${f.d}</p></div>`).join('')}
      </div>
    </section>

    <section class="bg-paper-2 border-y border-[color:var(--line)]">
      <div class="${sectionPad}">
        <div class="max-w-[640px] mx-auto text-center">
          <span class="${UI.eyebrow}">${I('workflow',14)} How it works</span>
          <h2 class="${h2}">How a message becomes an opportunity</h2>
        </div>
        <div class="${UI.flowstrip} mt-10">
          ${steps.map(s=>`<div class="${UI.flownode}"><div class="${UI.flownodeN}">${I(s.ic,20)}</div><b class="block text-[14.5px] mb-1">${s.t}</b><small class="text-muted text-[12.5px] leading-[1.45] block">${s.d}</small></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="${sectionPad} grid grid-cols-2 max-[900px]:grid-cols-1 gap-6">
      <div class="${UI.card}"><div class="${UI.ti} mb-3">${I('shield',18)}</div><b class="font-display font-semibold text-[17px] block mb-2">Private by design</b><p class="text-muted text-[14px] leading-[1.65] m-0">The language model runs locally through Ollama. Customer data is processed on your own infrastructure and never sent to a third-party AI service.</p></div>
      <div class="${UI.card}"><div class="${UI.ti} mb-3">${I('check',18)}</div><b class="font-display font-semibold text-[17px] block mb-2">Honest by default</b><p class="text-muted text-[14px] leading-[1.65] m-0">Demo mode is clearly labelled and computed from a local sample. The console never fabricates live CRM data or shows results it cannot back up.</p></div>
    </section>

    <section class="max-w-[1180px] mx-auto px-6 pb-[clamp(48px,7vw,90px)]">
      <div class="relative overflow-hidden rounded-[26px] p-[clamp(28px,5vw,52px)] text-center text-[#F4EEE4] bg-[linear-gradient(135deg,#16262A,#264248)]">
        <div class="absolute inset-0 bg-[radial-gradient(520px_320px_at_50%_-20%,rgba(111,169,180,.3),transparent_60%)]"></div>
        <div class="relative z-[1]">
          <h2 class="font-display font-medium text-[clamp(24px,3.2vw,34px)] tracking-[-.3px] m-0 mb-3">Ready to streamline your lead operations?</h2>
          <p class="text-[#CBD6D6] text-[15.5px] max-w-[520px] mx-auto m-0 mb-7">Sign in with a demo account, or create one to explore the full console.</p>
          <div class="flex gap-3 justify-center flex-wrap">
            <button class="${UI.btnAccent}" data-go="signup">${I('arrow',16)} Get started</button>
            <button class="${ghostDark}" data-go="login">Sign in</button>
          </div>
        </div>
      </div>
    </section>

    <footer class="border-t border-[color:var(--line)]"><div class="max-w-[1180px] mx-auto px-6 py-7 flex items-center justify-between gap-4 flex-wrap text-[12.5px] text-faint"><span>AI CRM Platform — internal sales operations console</span><span>Final-year engineering project · n8n · Ollama · Odoo CRM</span></div></footer>
  </div>`;
}

/* =========================================================================
   LOGIN
   ========================================================================= */
function viewLogin(){
  return `
  <div class="min-h-screen grid grid-cols-[1.05fr_.95fr] max-[900px]:grid-cols-1">
    <aside class="relative overflow-hidden text-[#F4EEE4] px-[56px] py-[54px] flex flex-col justify-between bg-[linear-gradient(168deg,#16262A_0%,#1C2E33_55%,#264248_100%)] max-[900px]:hidden">
      <div class="absolute inset-0 bg-[radial-gradient(540px_360px_at_78%_12%,rgba(111,169,180,.30),transparent_62%),radial-gradient(520px_420px_at_10%_96%,rgba(111,169,180,.34),transparent_60%)]"></div>
      <div class="relative z-[1] flex items-center gap-[13px]"><div class="w-[46px] h-[46px] rounded-[14px] grid place-items-center bg-gradient-to-br from-mist to-accent text-[#0F1E22] shadow-[0_14px_30px_rgba(0,0,0,.28)]">${I('brain',24)}</div>
        <div><b class="font-display font-semibold text-[20px] tracking-[.2px] block leading-[1.05]">AI CRM Platform</b><span class="text-[12.5px] text-[#BCCBCB] tracking-[.16em] uppercase">Sales Operations</span></div></div>
      <div class="relative z-[1]">
        <h1 class="font-display font-medium text-[clamp(34px,4.6vw,56px)] leading-[1.02] tracking-[-.2px] m-0 mb-[18px]">One console for sales <em class="italic text-[#BCCBCB]">lead operations</em>.</h1>
        <p class="max-w-[430px] text-[#CBD6D6] text-[16px] leading-[1.65] m-0">Capture leads, block duplicates, draft follow-ups, and read the pipeline — orchestrated by n8n, processed by a local Ollama model, and stored in Odoo CRM.</p>
      </div>
      <div class="relative z-[1] grid gap-[14px] mt-[6px]">
        <div class="flex gap-[13px] items-start text-[#E2EAEA]"><span class="mt-[3px] shrink-0 w-[26px] h-[26px] rounded-[8px] grid place-items-center bg-white/[.08] border border-white/[.12]">${I('zap',15)}</span><div><b class="font-bold">Capture &amp; classify</b><small class="block text-[#AEBFC0] text-[13px] mt-px">Free-text messages become structured, prioritised opportunities.</small></div></div>
        <div class="flex gap-[13px] items-start text-[#E2EAEA]"><span class="mt-[3px] shrink-0 w-[26px] h-[26px] rounded-[8px] grid place-items-center bg-white/[.08] border border-white/[.12]">${I('shield',15)}</span><div><b class="font-bold">No duplicates</b><small class="block text-[#AEBFC0] text-[13px] mt-px">Email &amp; phone matching before anything is written to CRM.</small></div></div>
        <div class="flex gap-[13px] items-start text-[#E2EAEA]"><span class="mt-[3px] shrink-0 w-[26px] h-[26px] rounded-[8px] grid place-items-center bg-white/[.08] border border-white/[.12]">${I('refresh',15)}</span><div><b class="font-bold">Always following up</b><small class="block text-[#AEBFC0] text-[13px] mt-px">Inactive opportunities get a tailored message, automatically.</small></div></div>
      </div>
      <div class="relative z-[1] text-[12.5px] text-[#9FB0B1] tracking-[.04em]">Final-year engineering project · n8n · Ollama · Odoo CRM</div>
    </aside>
    <main class="grid place-items-center p-10">
      <div class="w-[min(420px,100%)] reveal">
        <button class="inline-flex items-center gap-2 text-[13px] font-bold text-muted mb-5 hover:text-accent transition" data-go="landing"><span class="text-[16px] leading-none">←</span> Back to home</button>
        <span class="${UI.eyebrow}">${I('lock',14)} Secure internal access</span>
        <h2 class="font-display font-medium text-[32px] mt-[14px] mb-[6px] tracking-[-.2px]">Sign in to the console</h2>
        <p class="text-muted m-0 mb-[26px]">Use a demo account below, or your team credentials.</p>
        <form id="loginForm">
          <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px] tracking-[.01em]">Work email</label>
            <div class="relative"><span class="absolute left-[14px] top-1/2 -translate-y-1/2 text-faint pointer-events-none">${I('mail',17)}</span>
              <input class="${UI.input} !pl-[42px]" id="li_email" type="email" value="manager@company.com" autocomplete="username"/></div></div>
          <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px] tracking-[.01em]">Password</label>
            <div class="relative"><span class="absolute left-[14px] top-1/2 -translate-y-1/2 text-faint pointer-events-none">${I('key',17)}</span>
              <input class="${UI.input} !pl-[42px]" id="li_pass" type="password" value="admin123" autocomplete="current-password"/></div></div>
          <div id="li_err"></div>
          <button class="${UI.btnPrimary} w-full" type="submit">${I('arrow',17)} Enter console</button>
        </form>
        <div class="mt-[22px] border-t border-dashed border-[color:var(--line)] pt-[18px]">
          <div class="text-[11.5px] font-extrabold tracking-[.12em] uppercase text-faint mb-[10px]">Demo accounts — tap to fill</div>
          ${USERS.map(u=>`<div class="cred flex justify-between items-center gap-[10px] bg-card border border-[color:var(--line)] rounded-[11px] px-[12px] py-[9px] mb-2 cursor-pointer transition hover:border-accent hover:-translate-y-px hover:shadow-soft" data-email="${u.email}" data-pass="${u.password}">
            <code class="font-mono text-[12.5px] text-ink-soft">${u.email} · ${u.password}</code><span class="text-[11px] font-extrabold tracking-[.06em] uppercase text-accent-deep bg-[rgba(111,169,180,.12)] px-[9px] py-1 rounded-full">${u.role}</span></div>`).join('')}
        </div>
        <p class="text-center text-[13px] text-muted mt-6">New to AI CRM Platform? <button class="font-bold text-accent-deep hover:underline" data-go="signup">Create an account</button></p>
      </div>
    </main>
  </div>`;
}

/* =========================================================================
   SIGN UP (demo only — creates no account; the controller routes it to login)
   ========================================================================= */
function viewSignup(){
  const lbl='block text-[13px] font-bold text-ink-soft mb-[7px] tracking-[.01em]';
  const ic='absolute left-[14px] top-1/2 -translate-y-1/2 text-faint pointer-events-none';
  return `
  <div class="min-h-screen grid grid-cols-[1.05fr_.95fr] max-[900px]:grid-cols-1">
    <aside class="relative overflow-hidden text-[#F4EEE4] px-[56px] py-[54px] flex flex-col justify-between bg-[linear-gradient(168deg,#16262A_0%,#1C2E33_55%,#264248_100%)] max-[900px]:hidden">
      <div class="absolute inset-0 bg-[radial-gradient(540px_360px_at_78%_12%,rgba(111,169,180,.30),transparent_62%),radial-gradient(520px_420px_at_10%_96%,rgba(111,169,180,.34),transparent_60%)]"></div>
      <div class="relative z-[1] flex items-center gap-[13px]"><div class="w-[46px] h-[46px] rounded-[14px] grid place-items-center bg-gradient-to-br from-mist to-accent text-[#0F1E22] shadow-[0_14px_30px_rgba(0,0,0,.28)]">${I('brain',24)}</div>
        <div><b class="font-display font-semibold text-[20px] tracking-[.2px] block leading-[1.05]">AI CRM Platform</b><span class="text-[12.5px] text-[#BCCBCB] tracking-[.16em] uppercase">Sales Operations</span></div></div>
      <div class="relative z-[1]">
        <h1 class="font-display font-medium text-[clamp(34px,4.6vw,56px)] leading-[1.02] tracking-[-.2px] m-0 mb-[18px]">Set up in seconds, work your <em class="italic text-[#BCCBCB]">pipeline in minutes</em>.</h1>
        <p class="max-w-[430px] text-[#CBD6D6] text-[16px] leading-[1.65] m-0">One console for capturing leads, blocking duplicates, drafting follow-ups, and reading the pipeline — backed by n8n, a local Ollama model, and Odoo CRM.</p>
      </div>
      <div class="relative z-[1] grid gap-[14px] mt-[6px]">
        <div class="flex gap-[13px] items-start text-[#E2EAEA]"><span class="mt-[3px] shrink-0 w-[26px] h-[26px] rounded-[8px] grid place-items-center bg-white/[.08] border border-white/[.12]">${I('zap',15)}</span><div><b class="font-bold">Fast to start</b><small class="block text-[#AEBFC0] text-[13px] mt-px">No setup needed for the demo — explore every feature offline.</small></div></div>
        <div class="flex gap-[13px] items-start text-[#E2EAEA]"><span class="mt-[3px] shrink-0 w-[26px] h-[26px] rounded-[8px] grid place-items-center bg-white/[.08] border border-white/[.12]">${I('shield',15)}</span><div><b class="font-bold">Private &amp; local</b><small class="block text-[#AEBFC0] text-[13px] mt-px">The model runs on-prem; customer data never leaves your infrastructure.</small></div></div>
      </div>
      <div class="relative z-[1] text-[12.5px] text-[#9FB0B1] tracking-[.04em]">Final-year engineering project · n8n · Ollama · Odoo CRM</div>
    </aside>
    <main class="grid place-items-center p-10">
      <div class="w-[min(440px,100%)] reveal">
        <button class="inline-flex items-center gap-2 text-[13px] font-bold text-muted mb-5 hover:text-accent transition" data-go="landing"><span class="text-[16px] leading-none">←</span> Back to home</button>
        <span class="${UI.eyebrow}">${I('user',14)} Create your account</span>
        <h2 class="font-display font-medium text-[32px] mt-[14px] mb-[6px] tracking-[-.2px]">Get started</h2>
        <p class="text-muted m-0 mb-[26px]">Set up access to the sales operations console.</p>
        <form id="signupForm">
          <div class="mb-4"><label class="${lbl}">Full name</label>
            <div class="relative"><span class="${ic}">${I('user',17)}</span><input class="${UI.input} !pl-[42px]" id="su_name" type="text" placeholder="Your name" autocomplete="name"/></div></div>
          <div class="mb-4"><label class="${lbl}">Work email</label>
            <div class="relative"><span class="${ic}">${I('mail',17)}</span><input class="${UI.input} !pl-[42px]" id="su_email" type="email" placeholder="you@company.com" autocomplete="email"/></div></div>
          <div class="grid grid-cols-2 max-[560px]:grid-cols-1 gap-[14px]">
            <div class="mb-4"><label class="${lbl}">Password</label>
              <div class="relative"><span class="${ic}">${I('key',17)}</span><input class="${UI.input} !pl-[42px]" id="su_pass" type="password" placeholder="Create a password" autocomplete="new-password"/></div></div>
            <div class="mb-4"><label class="${lbl}">Confirm</label>
              <div class="relative"><span class="${ic}">${I('lock',17)}</span><input class="${UI.input} !pl-[42px]" id="su_pass2" type="password" placeholder="Re-enter" autocomplete="new-password"/></div></div>
          </div>
          <div id="su_err"></div>
          <button class="${UI.btnPrimary} w-full" type="submit">${I('arrow',17)} Create account</button>
        </form>
        <div class="${UI.notice} ${UI.noticeSoft} mt-4">${I('alert',16)}<span>This is a demonstration project — sign-up does not create a real account. You'll be taken to sign-in, where a demo account gets you into the console.</span></div>
        <p class="text-center text-[13px] text-muted mt-6">Already have an account? <button class="font-bold text-accent-deep hover:underline" data-go="login">Sign in</button></p>
      </div>
    </main>
  </div>`;
}

/* =========================================================================
   SHELL (rail + topbar)
   ========================================================================= */
function viewShell(){
  const s=state.session;
  return `
  <div class="scrim" id="scrim"></div>
  <div class="grid grid-cols-[300px_1fr] max-[900px]:grid-cols-[1fr] min-h-screen">
    <aside class="rail sticky top-0 h-screen flex flex-col gap-[6px] px-[18px] py-6 text-[#E8EEEE] bg-[linear-gradient(176deg,#16262A,#1C2E33_70%,#21363B)] shadow-[inset_-1px_0_0_rgba(255,255,255,.04),14px_0_50px_rgba(22,38,42,.10)]" id="rail">
      <div class="flex items-center gap-3 px-2 pt-[6px] pb-[14px]"><div class="w-[42px] h-[42px] rounded-[13px] grid place-items-center shrink-0 bg-gradient-to-br from-mist to-accent text-[#0F1E22] shadow-[0_12px_26px_rgba(0,0,0,.30)]">${I('brain',22)}</div>
        <div><b class="font-display font-semibold text-[19px] block leading-[1.05] tracking-[.2px]">AI CRM Platform</b><span class="text-[11px] text-[#9DB8BC] tracking-[.15em] uppercase">Sales Console</span></div></div>
      <div class="rail-mode mx-[6px] mt-1 mb-3 flex bg-white/[.06] border border-white/[.08] rounded-[11px] p-1 gap-1">
        ${[['demo','demo','Demo'],['local','database','Local'],['live','broadcast','Live']].map(m=>`<button data-mode="${m[0]}" class="flex-1 rounded-[8px] px-[5px] py-[7px] text-[11.5px] font-bold text-[#B8C8C9] flex items-center justify-center gap-[5px] transition ${state.mode===m[0]?'on':''}">${I(m[1],13)} ${m[2]}</button>`).join('')}
      </div>
      <nav class="flex flex-col gap-[3px] mt-1">
        ${NAV.map(n=> n.sec ? `<div class="text-[10.5px] font-extrabold tracking-[.16em] uppercase text-[#4E8C99] px-3 pt-[14px] pb-[6px]">${n.sec}</div>`
          : `<button class="nav-item flex items-center gap-3 px-3 py-[11px] rounded-[11px] text-[#C4D2D2] font-semibold text-[14.5px] text-left transition relative hover:bg-white/[.06] hover:text-white ${state.tab===n.tab?'active':''}" data-tab="${n.tab}">${I(n.icon,18)}<span>${n.label}</span></button>`).join('')}
      </nav>
      <div class="mt-auto flex flex-col gap-[10px]">
        <div class="flex items-center gap-[11px] p-[11px] rounded-[13px] bg-white/[.05] border border-white/[.07]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center shrink-0 bg-gradient-to-br from-[rgba(111,169,180,.4)] to-[rgba(111,169,180,.45)] font-display font-semibold">${initials(s.name)}</div>
          <div><b class="block text-[14px]">${esc(s.name)}</b><span class="block text-[11.5px] text-[#A4B5B6]">${esc(s.role)}</span></div></div>
        <button class="flex items-center justify-center gap-2 w-full p-[10px] rounded-[11px] bg-white/[.05] border border-white/[.08] text-[#CDD8D8] font-bold text-[13.5px] transition hover:bg-[rgba(176,69,90,.22)] hover:border-[rgba(176,69,90,.35)] hover:text-white" id="logoutBtn">${I('logout',16)} Sign out</button>
      </div>
    </aside>
    <main class="px-[38px] pt-[30px] pb-[60px] max-w-[1320px] w-full max-[900px]:px-[18px] max-[900px]:pt-5"><div id="page"></div></main>
  </div>`;
}

function pageHead(eyebrow, title, sub, actions=''){
  return `<div class="flex justify-between items-end gap-6 mb-[26px] max-[900px]:flex-col max-[900px]:items-start">
    <div>
      <span class="${UI.eyebrow}"><button class="${UI.mtoggle}" id="mtoggle" type="button">${I('menu',18)}</button> ${esc(eyebrow)}</span>
      <h1 class="font-display font-medium text-[clamp(28px,3.4vw,40px)] leading-[1.04] tracking-[-.2px] mt-[11px] mb-2">${esc(title)}</h1><p class="text-muted text-[15.5px] max-w-[680px] m-0 leading-[1.6]">${esc(sub)}</p>
    </div>
    <div class="${UI.headActions}">${actions}<span class="modepill ${UI.modepill} ${state.mode}"><span class="d"></span>${({demo:'Demo',local:'Local',live:'Live'}[state.mode]||'Demo')} mode</span></div>
  </div>`;
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */
function viewDashboard(){
  const k=computeKPIs(viewData());
  const pr=priorityBreakdown(viewData());
  const cards=[
    {lbl:'Opportunities', val:k.total, hint:'Total in pipeline', ic:'database', col:'var(--accent)'},
    {lbl:'With email', val:k.withEmail, hint:`${Math.round(k.withEmail/(k.total||1)*100)}% reachable by mail`, ic:'mail', col:'var(--mist)'},
    {lbl:'With phone', val:k.withPhone, hint:`${Math.round(k.withPhone/(k.total||1)*100)}% reachable by phone`, ic:'phone', col:'var(--mist-deep)'},
    {lbl:'Inactive ≥ 7d', val:k.inactive, hint:'Need a follow-up', ic:'clock', col:'var(--hot)'},
    {lbl:'New this week', val:k.newWeek, hint:'Captured in last 7 days', ic:'sparkles', col:'var(--ok)'}
  ];
  const barData=[
    {label:'Total', value:k.total, c1:'var(--accent)', c2:'var(--accent-deep)'},
    {label:'Email', value:k.withEmail, c1:'var(--mist)', c2:'var(--mist-deep)'},
    {label:'Phone', value:k.withPhone, c1:'#84B0BA', c2:'var(--mist-deep)'},
    {label:'Inactive', value:k.inactive, c1:'#D08079', c2:'var(--hot)'},
    {label:'New', value:k.newWeek, c1:'#7FB089', c2:'var(--ok)'}
  ];
  const health=[{label:'Active',value:k.active,color:'var(--ok)'},{label:'Inactive',value:k.inactive,color:'var(--hot)'}];
  const prio=[{label:'Hot',value:pr.hot,color:'var(--hot)'},{label:'Warm',value:pr.warm,color:'var(--warm)'},{label:'Cold',value:pr.cold,color:'var(--cold)'}];

  return `
  ${pageHead('Manager view','Pipeline at a glance', state.mode==='live'
      ? 'Run the analytics workflow to pull live Odoo counts and an AI-written summary.'
      : 'Live counts computed from the local demo dataset, with an on-device AI summary.',
    `<button class="${UI.btnAccent}" id="runAnalytics">${I('play',16)} Run analytics</button>`)}

  <div class="grid grid-cols-5 max-[1180px]:grid-cols-3 max-[560px]:grid-cols-2 gap-[14px] mb-5">
    ${cards.map((c,i)=>`<div class="reveal relative overflow-hidden bg-card border border-[color:var(--line)] rounded-[18px] pt-[18px] px-[18px] pb-4 shadow-soft transition hover:-translate-y-[3px] hover:shadow-card" style="animation-delay:${i*60}ms">
      <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background:${c.col}"></div>
      <div class="absolute right-[14px] top-[14px] text-[color:var(--line)] opacity-70">${I(c.ic,26)}</div>
      <div class="flex items-center gap-2 text-[12px] font-bold text-muted tracking-[.02em]">${I(c.ic,13)} ${c.lbl}</div>
      <div class="font-display font-semibold text-[36px] leading-none mt-3 mb-[5px] tracking-[-.4px]" data-count="${c.val}">0</div>
      <div class="text-[12px] text-faint leading-[1.4]">${esc(c.hint)}</div>
    </div>`).join('')}
  </div>

  <div class="grid grid-cols-[1.55fr_1fr] max-[1180px]:grid-cols-1 gap-[18px]">
    <div class="${UI.cardLg} reveal">
      <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('activity',18)}</span> CRM reachability</div>
      <p class="${UI.cardSub}">How many opportunities we can actually act on right now.</p>
      ${barsHTML(barData)}
    </div>
    <div class="grid gap-[18px]">
      <div class="${UI.cardLg} reveal">
        <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('pie',18)}</span> Pipeline health</div>
        <div class="flex items-center gap-[22px] max-[560px]:flex-col max-[560px]:items-start">
          ${donutHTML(health,150, k.total?Math.round(k.active/(k.total||1)*100)+'%':'—','Active')}
          ${legendHTML(health)}
        </div>
      </div>
      <div class="${UI.cardLg} reveal">
        <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('zap',18)}</span> Priority mix</div>
        <div class="flex items-center gap-[22px] max-[560px]:flex-col max-[560px]:items-start">
          ${donutHTML(prio,150, (pr.hot)+'', 'Hot leads')}
          ${legendHTML(prio)}
        </div>
      </div>
    </div>
  </div>

  <div class="${UI.cardLg} reveal mt-[18px]">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('sparkles',18)}</span> AI analytics summary</div>
    <p class="${UI.cardSub}">A short, numbers-only briefing for the sales manager — generated by the LLM from the KPIs above.</p>
    <div id="summaryBox">
      <div class="${UI.empty}"><div class="${UI.ei}">${I('fileText',24)}</div>
        <b class="${UI.emptyTitle}">No summary yet</b><p class="${UI.emptyP}">Click <b>Run analytics</b> to generate the manager briefing.</p></div>
    </div>
  </div>

  <div class="${UI.cardLg} reveal mt-[18px]">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('workflow',18)}</span> How this number is produced</div>
    <div class="${UI.flowstrip}">
      <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('database',20)}</div><b class="block text-[14.5px] mb-1">Odoo CRM</b><small class="text-muted text-[12.5px] leading-[1.45] block">Opportunities &amp; activity dates are read from crm.lead.</small></div>
      <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('workflow',20)}</div><b class="block text-[14.5px] mb-1">n8n workflow</b><small class="text-muted text-[12.5px] leading-[1.45] block">Filters opportunities and computes the five KPIs.</small></div>
      <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('cpu',20)}</div><b class="block text-[14.5px] mb-1">Ollama LLM</b><small class="text-muted text-[12.5px] leading-[1.45] block">Turns the KPIs into a plain-language briefing.</small></div>
      <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('grid',20)}</div><b class="block text-[14.5px] mb-1">This console</b><small class="text-muted text-[12.5px] leading-[1.45] block">Renders the cards, charts and summary you see here.</small></div>
    </div>
  </div>`;
}
function renderSummary(text){
  const box=$('#summaryBox'); if(!box) return;
  box.innerHTML = `<div class="${UI.summary}">${esc(text)}</div>
    <div class="${UI.headActions} mt-[14px]"><button class="${UI.btnGhost} ${UI.btnSm}" id="copySum">${I('copy',15)} Copy summary</button></div>`;
  $('#copySum')?.addEventListener('click',()=>copyText(text));
}

/* =========================================================================
   LEAD CAPTURE
   ========================================================================= */
function viewCapture(){
  return `
  ${pageHead('Front desk','Capture a new lead', 'Paste a customer message or fill the fields. The AI extracts the details, classifies intent and priority, and checks for duplicates before creating an Odoo opportunity.')}
  <div class="grid grid-cols-[1.55fr_1fr] max-[1180px]:grid-cols-1 gap-[18px]">
    <div class="${UI.cardLg} reveal">
      <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('send',18)}</span> Customer message</div>
      <p class="${UI.cardSub}">Anything the customer wrote — an email, a contact-form note, a WhatsApp message.</p>
      <form id="capForm">
        <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px]">Message</label>
          <textarea class="${UI.input} ${UI.textarea}" id="cap_msg" placeholder="e.g. Hi, I'm Amine from Medianet. We'd like a demo of your automation suite for ~20 sales reps. Reach me at amine.trabelsi@medianet.tn or +216 22 145 880."></textarea></div>
        <div class="grid grid-cols-2 max-[1180px]:grid-cols-1 gap-[18px]">
          <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px]">Name (optional)</label><input class="${UI.input}" id="cap_name" placeholder="Auto-detected if blank"/></div>
          <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px]">Email (optional)</label><input class="${UI.input}" id="cap_email" placeholder="Auto-detected if blank"/></div>
        </div>
        <div class="mb-4"><label class="block text-[13px] font-bold text-ink-soft mb-[7px]">Phone (optional)</label><input class="${UI.input}" id="cap_phone" placeholder="Auto-detected if blank"/></div>
        <button class="${UI.btnPrimary} w-full" type="submit" id="capBtn">${I('zap',16)} Extract &amp; create opportunity</button>
      </form>
      <div class="${UI.notice} ${UI.noticeSoft} mt-[14px]">${I('shield',16)}<span>Tip: try an email already in CRM (e.g. <b>karim@vermeg.com</b>) to see duplicate detection in action.</span></div>
    </div>
    <div class="grid gap-[18px]">
      <div class="${UI.cardLg} reveal" id="capResult">
        <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('cpu',18)}</span> AI extraction</div>
        <div class="${UI.empty}"><div class="${UI.ei}">${I('bot',24)}</div><b class="${UI.emptyTitle}">Waiting for a message</b><p class="${UI.emptyP}">The structured result — name, email, phone, intent, priority and the recommended action — appears here.</p></div>
      </div>
      <div class="${UI.card} reveal">
        <div class="${UI.cardTitle} !text-[16px]"><span class="${UI.ti}">${I('workflow',16)}</span> Pipeline</div>
        <div class="${UI.flowstrip} grid-cols-2">
          <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('cpu',18)}</div><b class="block text-[14.5px] mb-1">Extract</b><small class="text-muted text-[12.5px] leading-[1.45] block">LLM returns structured JSON.</small></div>
          <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('shield',18)}</div><b class="block text-[14.5px] mb-1">Dedupe</b><small class="text-muted text-[12.5px] leading-[1.45] block">Match email / phone.</small></div>
          <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('database',18)}</div><b class="block text-[14.5px] mb-1">Create</b><small class="text-muted text-[12.5px] leading-[1.45] block">New Odoo opportunity.</small></div>
          <div class="${UI.flownode}"><div class="${UI.flownodeN}">${I('check',18)}</div><b class="block text-[14.5px] mb-1">Respond</b><small class="text-muted text-[12.5px] leading-[1.45] block">created / duplicate.</small></div>
        </div>
      </div>
    </div>
  </div>`;
}
function renderCaptureResult({status, message, extract, dup, live}){
  const box=$('#capResult');
  if(status==='error'){
    box.innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('cpu',18)}</span> AI extraction</div>
      <div class="result err rounded-[16px] p-[18px] border border-[color:var(--line)] mt-[18px] bg-card-2"><div class="flex gap-3 items-start mb-[6px]"><div class="shrink-0 w-[36px] h-[36px] rounded-[10px] grid place-items-center" style="background:rgba(176,69,90,.16);color:var(--danger)">${I('alert',18)}</div>
      <div><b class="block text-[16px]">Could not process</b><span class="block text-muted text-[13px] mt-px">${esc(message)}</span></div></div></div>`; return;
  }
  const cls = status==='created'?'created':status==='duplicate'?'dup':'';
  const head = status==='created'
    ? `<div class="shrink-0 w-[36px] h-[36px] rounded-[10px] grid place-items-center" style="background:rgba(92,138,102,.16);color:var(--ok)">${I('check',18)}</div><div><b class="block text-[16px]">Opportunity created</b><span class="block text-muted text-[13px] mt-px">A new record was written to CRM.</span></div>`
    : `<div class="shrink-0 w-[36px] h-[36px] rounded-[10px] grid place-items-center" style="background:rgba(176,69,90,.14);color:var(--danger)">${I('shield',18)}</div><div><b class="block text-[16px]">Duplicate detected</b><span class="block text-muted text-[13px] mt-px">${dup?('Matches existing opportunity #'+dup.id+' — '+esc(dup.name)):'A matching opportunity already exists.'} Nothing was created.</span></div>`;
  const ex=extract||{};
  box.innerHTML=`
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('cpu',18)}</span> AI extraction ${live?'<span class="'+UI.chip+' ml-auto">'+I('broadcast',13)+' from server</span>':'<span class="'+UI.chip+' ml-auto">'+I('demo',13)+' demo data</span>'}</div>
    <div class="result ${cls} rounded-[16px] p-[18px] border border-[color:var(--line)] mt-[18px] bg-card-2"><div class="flex gap-3 items-start mb-[6px]">${head}</div></div>
    <div class="${UI.kv}">
      <div class="${UI.cell}"><span class="${UI.cellSpan}">Name</span><b class="text-[14px] break-words font-semibold">${esc(ex.name||'—')}</b></div>
      <div class="${UI.cell}"><span class="${UI.cellSpan}">Email</span><b class="text-[14px] break-words font-semibold">${esc(ex.email||'—')}</b></div>
      <div class="${UI.cell}"><span class="${UI.cellSpan}">Phone</span><b class="text-[14px] break-words font-semibold">${esc(ex.phone||'—')}</b></div>
      <div class="${UI.cell}"><span class="${UI.cellSpan}">Intent</span><b class="text-[14px] break-words font-semibold capitalize">${esc((ex.intent||'—').replace('_',' '))}</b></div>
    </div>
    <div class="flex gap-2 items-center flex-wrap mb-3">
      <span class="badge ${UI.badge} ${priorityClass(ex.priority)}"><span class="d"></span>${esc(ex.priority||'—')} priority</span>
      ${status==='created'?'<span class="badge '+UI.badge+' b-ok"><span class="d"></span>written to CRM</span>':'<span class="badge '+UI.badge+' b-dup"><span class="d"></span>skipped</span>'}
    </div>
    <div class="${UI.notice} ${UI.noticeInfo}">${I('arrow',16)}<span><b>Recommended action:</b> ${esc(ex.recommended_action||'Manual review.')}</span></div>`;
  toast(status==='created'?'Opportunity created':'Duplicate — not created', status==='created'?'check':'shield');
}

/* =========================================================================
   LEAD WORKSPACE
   ========================================================================= */
function viewWorkspace(){
  return `
  ${pageHead('Sales view','Lead workspace','Search every opportunity, filter by priority or status, and open a record to review details and prepare a follow-up.')}
  <div class="grid grid-cols-[1.55fr_1fr] max-[1180px]:grid-cols-1 gap-[18px]">
    <div>
      <div class="flex gap-[10px] items-center flex-wrap mb-4">
        <div class="relative flex-1 min-w-[220px]"><span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint">${I('search',17)}</span><input class="${UI.input} !pl-10" id="ws_q" placeholder="Search name, email, company…" value="${esc(wsState.q)}"/></div>
      </div>
      <div class="seg flex bg-card border border-[color:var(--line)] rounded-[11px] p-[3px] gap-[2px] mb-[14px]">
        ${['all','hot','warm','cold','inactive'].map(f=>`<button data-f="${f}" class="px-[13px] py-2 rounded-[8px] text-[13px] font-bold text-muted transition ${wsState.filter===f?'on':''}">${f[0].toUpperCase()+f.slice(1)}</button>`).join('')}
      </div>
      <div class="grid gap-2" id="ws_list"></div>
    </div>
    <div class="${UI.cardLg} reveal" id="ws_detail">
      <div class="${UI.empty}"><div class="${UI.ei}">${I('users',24)}</div><b class="${UI.emptyTitle}">Select a lead</b><p class="${UI.emptyP}">Pick an opportunity from the list to see the full record and draft a follow-up.</p></div>
    </div>
  </div>`;
}
function wsFiltered(){
  const q=wsState.q.toLowerCase().trim();
  return viewData().filter(l=>l.type==='opportunity').filter(l=>{
    if(q && !(`${l.name} ${l.email_from} ${l.interest}`.toLowerCase().includes(q))) return false;
    if(wsState.filter==='inactive'){ const d=daysSince(l.write_date||l.create_date); return d!=null && d>=7; }
    if(['hot','warm','cold'].includes(wsState.filter)) return l.priority===wsState.filter;
    return true;
  });
}
function renderWsList(){
  const list=$('#ws_list'); const items=wsFiltered();
  if(!items.length){ list.innerHTML=`<div class="${UI.empty}"><div class="${UI.ei}">${I('search',22)}</div><b class="${UI.emptyTitle}">No matches</b><p class="${UI.emptyP}">Try a different search or filter.</p></div>`; return; }
  list.innerHTML=items.map(l=>{
    const d=daysSince(l.write_date||l.create_date);
    const inactive=d!=null&&d>=7;
    return `<button class="lead-row grid grid-cols-[1fr_auto] gap-[14px] items-center bg-card border border-[color:var(--line)] rounded-[14px] px-4 py-[13px] cursor-pointer transition text-left w-full hover:border-accent hover:-translate-y-[2px] hover:shadow-soft ${wsState.selected===l.id?'sel':''}" data-id="${l.id}">
      <div class="flex items-center gap-[13px] min-w-0"><div class="w-[40px] h-[40px] rounded-[11px] shrink-0 grid place-items-center font-display font-semibold text-[16px] text-white bg-gradient-to-br from-accent to-mist">${initials(l.name)}</div>
        <div class="min-w-0"><b class="block text-[14.5px] whitespace-nowrap overflow-hidden text-ellipsis">${esc(l.name)}</b><small class="block text-muted text-[12.5px] whitespace-nowrap overflow-hidden text-ellipsis font-mono">${esc(l.email_from||l.phone||'no contact info')}</small></div></div>
      <div class="flex items-center gap-[9px] shrink-0">
        <span class="text-[12px] text-faint font-semibold min-w-[62px] text-right">${d==null?'':d+'d'}</span>
        <span class="badge ${UI.badge} ${inactive?'b-dup':priorityClass(l.priority)}"><span class="d"></span>${inactive?'inactive':esc(l.priority)}</span>
      </div></button>`;
  }).join('');
  $$('.lead-row',list).forEach(r=>r.addEventListener('click',()=>{ wsState.selected=+r.dataset.id; renderWsList(); renderWsDetail(+r.dataset.id); }));
}
function renderWsDetail(id){
  const l=viewData().find(x=>x.id===id); if(!l) return;
  const d=daysSince(l.write_date||l.create_date);
  const box=$('#ws_detail');
  box.innerHTML=`
    <div>
      <div class="flex items-center gap-[14px] mb-[6px]"><div class="w-[52px] h-[52px] rounded-[14px] grid place-items-center font-display font-semibold text-[21px] text-white bg-gradient-to-br from-accent to-mist">${initials(l.name)}</div>
        <div><b class="font-display font-semibold text-[21px] block">${esc(l.name)}</b>
          <div class="flex gap-2 mt-[6px]"><span class="badge ${UI.badge} ${priorityClass(l.priority)}"><span class="d"></span>${esc(l.priority)}</span>
          ${d>=7?`<span class="badge ${UI.badge} b-dup"><span class="d"></span>inactive ${d}d</span>`:`<span class="badge ${UI.badge} b-ok"><span class="d"></span>active</span>`}</div></div>
      </div>
      <div class="${UI.kv}">
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Opportunity ID</span><b class="text-[14px] break-words font-semibold">#${l.id}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Intent</span><b class="text-[14px] break-words font-semibold capitalize">${esc((l.intent||'—').replace('_',' '))}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Email</span><b class="text-[14px] break-words font-semibold">${esc(l.email_from||'not provided')}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Phone</span><b class="text-[14px] break-words font-semibold">${esc(l.phone||'not provided')}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Created</span><b class="text-[14px] break-words font-semibold">${fmtDate(l.create_date)}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Last activity</span><b class="text-[14px] break-words font-semibold">${fmtDate(l.write_date)}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Expected revenue</span><b class="text-[14px] break-words font-semibold">${fmtMoney(l.expected_revenue)}</b></div>
        <div class="${UI.cell}"><span class="${UI.cellSpan}">Interest</span><b class="text-[14px] break-words font-medium">${esc(l.interest||'—')}</b></div>
      </div>
      <button class="${UI.btnAccent} w-full" id="ws_draft">${I('pencil',16)} Draft follow-up message</button>
      <div id="ws_mail"></div>
    </div>`;
  $('#ws_draft').addEventListener('click', async ()=>{
    const b=$('#ws_draft'); b.disabled=true; b.innerHTML=`${I('refresh',16)} Drafting…`;
    let text;
    if(state.mode==='live' && state.config.assistant){
      try{ const res=await postJson(state.config.assistant,{message:`Write a short professional follow-up email for opportunity ${l.name} (${l.email_from}). Mention we are following up on their interest and ask to continue the discussion. Sign as Sales Team.`,sessionId:'workspace'}); text=res.data?.answer||res.data?.output||draftFollowUp(l); }
      catch{ text=draftFollowUp(l); }
    } else { await new Promise(r=>setTimeout(r,400)); text=draftFollowUp(l); }
    $('#ws_mail').innerHTML=`<div class="${UI.cardSub} !mt-4 !mb-[6px] flex items-center gap-2">${I('mail',15)} Suggested follow-up</div>
      <div class="${UI.mailbox}">${esc(text)}</div>
      <div class="${UI.headActions} mt-3"><button class="${UI.btnGhost} ${UI.btnSm}" id="ws_copy">${I('copy',15)} Copy</button></div>`;
    $('#ws_copy').addEventListener('click',()=>copyText(text));
    b.disabled=false; b.innerHTML=`${I('pencil',16)} Re-draft follow-up message`;
  });
}

/* =========================================================================
   FOLLOW-UP CENTER
   ========================================================================= */
function viewFollowup(){
  const inactive=viewData().filter(l=>l.type==='opportunity').filter(l=>{const d=daysSince(l.write_date||l.create_date);return d!=null&&d>=7;});
  const statLbl='text-muted font-bold text-[13px] flex gap-2 items-center';
  const statVal='font-display text-[34px] font-semibold mt-2';
  return `
  ${pageHead('Automation','Follow-Up Center', state.mode==='live'
      ? 'Trigger the batch workflow: it finds inactive opportunities, removes duplicates, writes a tailored message to each, and saves it back to Odoo.'
      : 'Generate tailored follow-up messages for every inactive opportunity in the demo dataset.',
    `<button class="${UI.btnAccent}" id="runFollow">${I('refresh',16)} Run batch follow-up</button>`)}
  <div class="grid grid-cols-3 max-[560px]:grid-cols-1 gap-4 mb-[18px]">
    <div class="${UI.card} reveal"><div class="${statLbl}">${I('clock',15)} Inactive opportunities</div>
      <div class="${statVal}" data-count="${inactive.length}">0</div></div>
    <div class="${UI.card} reveal"><div class="${statLbl}">${I('mail',15)} Reachable by email</div>
      <div class="${statVal}" data-count="${inactive.filter(l=>l.email_from).length}">0</div></div>
    <div class="${UI.card} reveal"><div class="${statLbl}">${I('zap',15)} Hot &amp; inactive</div>
      <div class="${statVal}" data-count="${inactive.filter(l=>l.priority==='hot').length}">0</div></div>
  </div>
  <div class="${UI.cardLg} reveal" id="followBox">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups</div>
    <p class="${UI.cardSub}">Run the batch to produce one message per inactive opportunity. Each can be copied straight into your mail client.</p>
    <div class="${UI.empty}"><div class="${UI.ei}">${I('refresh',24)}</div><b class="${UI.emptyTitle}">Nothing generated yet</b><p class="${UI.emptyP}">Hit <b>Run batch follow-up</b> to draft messages for the ${inactive.length} inactive opportunities.</p></div>
  </div>`;
}
function renderFollowups(list){
  const box=$('#followBox');
  box.innerHTML=`<div class="${UI.cardTitle}"><span class="${UI.ti}">${I('mail',18)}</span> Generated follow-ups <span class="${UI.chip} ml-auto">${list.length} message${list.length>1?'s':''}</span></div>
    <div class="grid gap-[18px] mt-2">
    ${list.map((r,i)=>`<div class="${UI.card} reveal !bg-card-2" style="animation-delay:${i*50}ms">
      <div class="flex justify-between items-center gap-3 mb-[10px]">
        <div class="flex items-center gap-[11px]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-display font-semibold text-white bg-gradient-to-br from-accent to-mist">${initials(r.name)}</div>
        <div><b class="block">${esc(r.name)}</b><small class="text-muted font-mono text-[12px]">${esc(r.email||'no email')}</small></div></div>
        <div class="flex gap-2 items-center">${r.inactive_days!=null?`<span class="badge ${UI.badge} b-neutral"><span class="d"></span>${r.inactive_days}d quiet</span>`:''}
        <button class="${UI.btnGhost} ${UI.btnSm}" data-copy="${i}">${I('copy',14)} Copy</button></div>
      </div>
      <div class="${UI.mailbox} !mt-0">${esc(r.message)}</div>
    </div>`).join('')}
    </div>`;
  $$('[data-copy]',box).forEach(b=>b.addEventListener('click',()=>copyText(list[+b.dataset.copy].message)));
}

/* =========================================================================
   AI ASSISTANT
   ========================================================================= */
function viewAssistant(){
  return `
  ${pageHead('Conversational','CRM Assistant', state.mode==='live'
      ? 'Ask in plain language. In Live mode the assistant uses the Odoo-connected n8n agent to read and act on opportunities.'
      : 'Ask in plain language. In Demo mode the assistant answers from the local dataset — it never pretends to read Odoo.')}
  <div class="${UI.cardLg} reveal">
    <div class="flex flex-col h-[min(640px,72vh)]">
      <div class="flex-1 overflow-auto flex flex-col gap-[14px] px-1 pt-[6px] pb-3" id="chatLog"></div>
      <div class="flex gap-2 flex-wrap my-3" id="chatQuick">
        ${['List all opportunities','Show opportunity 1003','How many leads do we have?','Draft a follow-up for Karim Haddad'].map(q=>`<button class="qchip text-[12.5px] font-bold text-accent-deep bg-[rgba(111,169,180,.1)] border border-[rgba(111,169,180,.18)] rounded-full px-[13px] py-[7px] transition hover:bg-[rgba(111,169,180,.18)] hover:-translate-y-px">${q}</button>`).join('')}
      </div>
      <form class="grid grid-cols-[1fr_auto] gap-[10px] mt-1" id="chatForm">
        <input class="${UI.input}" id="chatMsg" placeholder="Ask about your CRM…" autocomplete="off"/>
        <button class="${UI.btnPrimary}" type="submit" id="chatSend">${I('send',16)} Send</button>
      </form>
    </div>
  </div>`;
}
function renderChat(){
  const log=$('#chatLog'); if(!log) return;
  log.innerHTML=state.chat.map(m=>{
    if(m.typing) return `<div class="max-w-[78%] flex gap-[10px] self-start"><div class="w-[32px] h-[32px] rounded-[9px] shrink-0 grid place-items-center bg-gradient-to-br from-mist to-accent text-[#0F1E22]">${I('bot',16)}</div><div class="rounded-[16px] px-[15px] py-3 bg-card border border-[color:var(--line)] rounded-bl-[5px]"><div class="typing inline-flex gap-1 items-center py-1"><i class="w-[7px] h-[7px] rounded-full bg-accent inline-block"></i><i class="w-[7px] h-[7px] rounded-full bg-accent inline-block"></i><i class="w-[7px] h-[7px] rounded-full bg-accent inline-block"></i></div></div></div>`;
    const isUser=m.role==='user';
    const av = isUser?I('user',16):I('bot',16);
    const wrap = `max-w-[78%] flex gap-[10px] ${isUser?'self-end flex-row-reverse':'self-start'}`;
    const ava = `w-[32px] h-[32px] rounded-[9px] shrink-0 grid place-items-center ${isUser?'bg-sand text-ink':'bg-gradient-to-br from-mist to-accent text-[#0F1E22]'}`;
    const bub = `rounded-[16px] px-[15px] py-3 text-[14.5px] leading-[1.6] ${isUser?'bg-ink text-paper-2 rounded-br-[5px]':'bg-card border border-[color:var(--line)] rounded-bl-[5px]'}`;
    let body = `<p class="m-0">${esc(m.text||'')}</p>`;
    if(m.records&&m.records.length){ body += m.records.map(r=>`<div class="bg-card-2 border border-[color:var(--line)] rounded-[11px] px-[13px] py-[11px] mt-2 first:mt-0"><span class="font-mono text-[11px] text-accent-deep font-semibold">ID ${esc(r.id)}</span><b class="block text-[14px] my-[2px]">${esc(r.name)}</b><small class="block text-muted text-[12.5px] font-mono">${esc(r.email)} · ${esc(r.phone)}</small></div>`).join(''); }
    return `<div class="${wrap}"><div class="${ava}">${av}</div><div class="${bub}">${body}</div></div>`;
  }).join('');
  log.scrollTop=log.scrollHeight;
}

/* =========================================================================
   ARCHITECTURE
   ========================================================================= */
function viewArchitecture(){
  return `
  ${pageHead('System design','How AI CRM Platform is built','The console is the front end of an event-driven automation system. Four n8n workflows do the heavy lifting; a local Ollama model provides the reasoning; Odoo is the system of record.')}
  <div class="reveal relative bg-[linear-gradient(160deg,#16262A,#1C2E33)] rounded-[26px] p-[30px] text-[#E8EEEE] overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(600px_360px_at_85%_0%,rgba(111,169,180,.2),transparent_60%),radial-gradient(520px_380px_at_0%_100%,rgba(111,169,180,.22),transparent_60%)]"></div>
    <div class="relative z-[1]">
      <div class="${UI.cardTitle} !text-[#E8EEEE] mb-[18px]"><span class="${UI.ti}" style="background:rgba(255,255,255,.08);color:#9BD3DC">${I('layers',18)}</span> Three-layer architecture</div>
      <div class="grid grid-cols-3 max-[1180px]:grid-cols-1 gap-[18px] mt-2">
        <div><h4 class="font-display font-semibold text-[14px] tracking-[.1em] uppercase text-[#9DB8BC] m-0 mb-3">Presentation</h4>
          <div class="bg-white/[.05] border border-white/[.1] rounded-[14px] p-[14px] mb-[11px] backdrop-blur-[6px]"><div class="flex items-center gap-[10px] mb-[6px]">${I('grid',18)}<b class="text-[14.5px]">AI CRM Platform Console</b></div><small class="text-[#B4C4C5] text-[12.5px] leading-[1.5] block">This single-page app. Sends JSON to webhooks and renders results. No business logic lives here.</small><span class="font-mono text-[11px] text-[#9BD3DC] mt-2 block">HTML · CSS · Vanilla JS</span></div>
        </div>
        <div><h4 class="font-display font-semibold text-[14px] tracking-[.1em] uppercase text-[#9DB8BC] m-0 mb-3">Orchestration &amp; AI</h4>
          <div class="bg-white/[.05] border border-white/[.1] rounded-[14px] p-[14px] mb-[11px] backdrop-blur-[6px]"><div class="flex items-center gap-[10px] mb-[6px]">${I('workflow',18)}<b class="text-[14.5px]">n8n</b></div><small class="text-[#B4C4C5] text-[12.5px] leading-[1.5] block">Receives webhooks, branches logic, calls tools, talks to Odoo and the model.</small><span class="font-mono text-[11px] text-[#9BD3DC] mt-2 block">webhook · code · if · agent</span></div>
          <div class="bg-white/[.05] border border-white/[.1] rounded-[14px] p-[14px] mb-[11px] backdrop-blur-[6px]"><div class="flex items-center gap-[10px] mb-[6px]">${I('cpu',18)}<b class="text-[14.5px]">Ollama · llama3.2</b></div><small class="text-[#B4C4C5] text-[12.5px] leading-[1.5] block">Local LLM for extraction, summaries, follow-up writing and the agent.</small><span class="font-mono text-[11px] text-[#9BD3DC] mt-2 block">temperature 0 · on-prem</span></div>
        </div>
        <div><h4 class="font-display font-semibold text-[14px] tracking-[.1em] uppercase text-[#9DB8BC] m-0 mb-3">Data</h4>
          <div class="bg-white/[.05] border border-white/[.1] rounded-[14px] p-[14px] mb-[11px] backdrop-blur-[6px]"><div class="flex items-center gap-[10px] mb-[6px]">${I('database',18)}<b class="text-[14.5px]">Odoo CRM</b></div><small class="text-[#B4C4C5] text-[12.5px] leading-[1.5] block">System of record. Opportunities (crm.lead) are read, deduplicated, created and updated.</small><span class="font-mono text-[11px] text-[#9BD3DC] mt-2 block">crm.lead · type = opportunity</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="${UI.cardTitle} mt-[26px] mb-[14px]"><span class="${UI.ti}">${I('workflow',18)}</span> The four workflows</div>
  <div class="grid gap-3">
    <div class="reveal grid grid-cols-[auto_1fr] gap-[14px] items-start p-4 bg-card border border-[color:var(--line)] rounded-[16px]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-display font-semibold bg-[rgba(111,169,180,.13)] text-accent-deep">1</div><div>
      <b class="text-[15px] block mb-[3px]">Lead Capture &amp; Deduplication</b>
      <p class="m-0 mb-2 text-muted text-[13.5px] leading-[1.55]">A message hits the webhook → the LLM extracts structured fields and classifies intent/priority → existing opportunities are pulled from Odoo → email &amp; phone are matched → the record is either created or flagged as a duplicate.</p>
      <code class="font-mono text-[11.5px] bg-card-2 border border-[color:var(--line)] px-2 py-[3px] rounded-[7px] text-accent-deep">POST /webhook/lead-capture</code></div></div>
    <div class="reveal grid grid-cols-[auto_1fr] gap-[14px] items-start p-4 bg-card border border-[color:var(--line)] rounded-[16px]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-display font-semibold bg-[rgba(111,169,180,.13)] text-accent-deep">2</div><div>
      <b class="text-[15px] block mb-[3px]">Smart Follow-Up (batch)</b>
      <p class="m-0 mb-2 text-muted text-[13.5px] leading-[1.55]">Reads opportunities, detects those inactive for ≥ N days, removes duplicate emails keeping the most recent, asks the LLM to write a polite follow-up per lead, and writes it back to the Odoo record's description.</p>
      <code class="font-mono text-[11.5px] bg-card-2 border border-[color:var(--line)] px-2 py-[3px] rounded-[7px] text-accent-deep">POST /webhook/smart-follow-up</code></div></div>
    <div class="reveal grid grid-cols-[auto_1fr] gap-[14px] items-start p-4 bg-card border border-[color:var(--line)] rounded-[16px]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-display font-semibold bg-[rgba(111,169,180,.13)] text-accent-deep">3</div><div>
      <b class="text-[15px] block mb-[3px]">CRM Analytics Summary</b>
      <p class="m-0 mb-2 text-muted text-[13.5px] leading-[1.55]">Computes five KPIs (total, with-email, with-phone, inactive, new-this-week) and prompts the LLM — under strict "do not invent numbers" rules — to write a short manager briefing.</p>
      <code class="font-mono text-[11.5px] bg-card-2 border border-[color:var(--line)] px-2 py-[3px] rounded-[7px] text-accent-deep">POST /webhook/crm-summary</code></div></div>
    <div class="reveal grid grid-cols-[auto_1fr] gap-[14px] items-start p-4 bg-card border border-[color:var(--line)] rounded-[16px]"><div class="w-[38px] h-[38px] rounded-[11px] grid place-items-center font-display font-semibold bg-[rgba(111,169,180,.13)] text-accent-deep">4</div><div>
      <b class="text-[15px] block mb-[3px]">CRM AI Assistant (agent)</b>
      <p class="m-0 mb-2 text-muted text-[13.5px] leading-[1.55]">A tool-using agent over Odoo: list, get-by-id, create and update opportunities. Returns clean records in a fixed format, with strict rules against guessing or leaking internal data.</p>
      <code class="font-mono text-[11.5px] bg-card-2 border border-[color:var(--line)] px-2 py-[3px] rounded-[7px] text-accent-deep">POST /webhook/crm-ai-assistant</code></div></div>
  </div>

  <div class="${UI.cardLg} reveal mt-[18px]">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('shield',18)}</span> Design principles</div>
    <div class="grid grid-cols-3 max-[560px]:grid-cols-1 gap-4 mt-[6px]">
      <div><b class="block mb-[5px]">Honest by default</b><p class="text-muted text-[13.5px] m-0 leading-[1.6]">The UI never fabricates live CRM data. If a webhook is not connected, it says so and falls back to a clearly-labelled demo dataset.</p></div>
      <div><b class="block mb-[5px]">Privacy-first AI</b><p class="text-muted text-[13.5px] m-0 leading-[1.6]">The model runs locally via Ollama — customer data never leaves the company's infrastructure.</p></div>
      <div><b class="block mb-[5px]">Deterministic output</b><p class="text-muted text-[13.5px] m-0 leading-[1.6]">temperature 0 plus strict JSON contracts make the AI's behaviour repeatable and safe to automate.</p></div>
    </div>
  </div>`;
}

/* =========================================================================
   SETTINGS
   ========================================================================= */
function viewSettings(){
  const c=state.config;
  const rows=[
    {k:'leadCapture', label:'Lead Capture', icon:'send'},
    {k:'analytics', label:'Analytics Summary', icon:'activity'},
    {k:'followUp', label:'Smart Follow-Up', icon:'refresh'},
    {k:'assistant', label:'AI Assistant', icon:'bot'}
  ];
  return `
  ${pageHead('Configuration','Settings','Point the console at your running n8n instance. URLs are stored locally in this browser only.')}
  <div class="${UI.cardLg} reveal max-w-[840px]">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('broadcast',18)}</span> n8n webhook endpoints</div>
    <p class="${UI.cardSub}">Default to <code style="font-family:var(--font-mono);font-size:12px">localhost:5678</code>. Switch to <b>Live</b> mode in the sidebar to use these.</p>
    <div class="grid grid-cols-2 max-[900px]:grid-cols-1 gap-[14px]">
      ${rows.map(r=>`<div class="bg-card-2 border border-[color:var(--line)] rounded-[14px] p-4 relative">
        <div class="flex items-center justify-between gap-[10px] mb-[10px]"><b class="text-[14.5px] flex items-center gap-2">${I(r.icon,16)} ${r.label}</b>
          <span class="statusdot" id="st_${r.k}"><span class="d"></span><span class="t">untested</span></span></div>
        <input class="${UI.input} font-mono !text-[12.5px]" id="cfg_${r.k}" value="${esc(c[r.k])}" placeholder="https://…/webhook/…"/>
      </div>`).join('')}
    </div>
    <div class="${UI.headActions} mt-[18px] justify-start">
      <button class="${UI.btnPrimary}" id="saveCfg">${I('check',16)} Save</button>
      <button class="${UI.btnGhost}" id="testCfg">${I('activity',16)} Test connections</button>
      <button class="${UI.btnGhost}" id="resetCfg">${I('refresh',16)} Reset to defaults</button>
    </div>
    <div class="${UI.notice} ${UI.noticeInfo} mt-4">${I('alert',16)}<span>Connection tests exercise only <b>crm-summary</b> (it has no Odoo write step, so it is always safe). <b>Lead Capture</b>, <b>Smart Follow-Up</b>, and the <b>AI Assistant</b> show “not tested — would modify Odoo,” because a test must never create or change CRM data. Import the workflow <b>ping-guard</b> to enable a safe <code style="font-family:var(--font-mono);font-size:12px">{"ping":true}</code> test for all four. A browser <b>CORS</b> block can make a reachable webhook look offline — harmless if your live demo otherwise runs.</span></div>
  </div>

  <div class="${UI.cardLg} reveal max-w-[840px] mt-[18px]">
    <div class="${UI.cardTitle}"><span class="${UI.ti}">${I('demo',18)}</span> Demo data</div>
    <p class="${UI.cardSub}">The demo dataset lets you present every feature with no backend running. Captured demo leads are kept in this browser.</p>
    <div class="${UI.headActions} justify-start">
      <button class="${UI.btnGhost}" id="clearCap">${I('trash',16)} Clear captured demo leads (${state.captured.length})</button>
    </div>
  </div>`;
}
