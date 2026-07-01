/* ============================================================================
   MODEL · STORE — the single source of truth. localStorage wrapper, the live
   application state object, the workspace UI state, and small accessors.
   Depends on: constants.js (DEFAULTS), dataset.js (buildDataset).
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------- STATE --- */
const LS = {
  get:(k,f)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch{ return f; } },
  set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
  del:(k)=>{ try{ localStorage.removeItem(k); }catch{} }
};
const state = {
  session: LS.get('acp_session', null),
  authView: 'landing',          // which pre-login screen shows: landing | login | signup
  config:  Object.assign({}, DEFAULTS, LS.get('acp_config', {})),
  // 'local' is hidden from the UI (see viewShell). Coerce a saved 'local' preference
  // to 'demo' so the app never opens in a mode that has no button to switch out of.
  mode:    (LS.get('acp_mode','demo')==='local' ? 'demo' : LS.get('acp_mode','demo')),
  tab:     'dashboard',
  dataset: buildDataset(),
  captured: LS.get('acp_captured', []),
  chat:    [{ role:'bot', text:'Hi — I am your CRM assistant. Ask me to list opportunities, look one up by ID, count records, or draft a follow-up. In Live mode I query Odoo through n8n; in Demo mode I answer from the local dataset.' }],
  analytics: null,
  followup: null,
  serverOpps: [],               // opportunities fetched from the local backend (Local mode)
  liveOpps: [],                 // opportunities fetched from Odoo via n8n (Live mode)
  liveLoading: false,
  liveError: null,
  loading: {}
};
/* Workspace view state (search query, active filter, selected lead). */
const wsState={ q:'', filter:'all', selected:null };

function persistConfig(){ LS.set('acp_config', state.config); }
function allLeads(){ return state.captured.concat(state.dataset); }
/* Leads the views/analytics read from, by mode:
   Local → backend (NeDB) cache · Live → Odoo-via-n8n cache · Demo → in-browser dataset.
   Live mode never shows the demo dataset — only the real opportunities fetched from Odoo. */
function viewData(){
  if(state.mode==='local') return state.serverOpps||[];
  if(state.mode==='live')  return state.liveOpps||[];
  return allLeads();
}
