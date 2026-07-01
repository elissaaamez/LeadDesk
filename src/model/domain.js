/* ============================================================================
   MODEL · DOMAIN — pure business logic used by Demo mode and the dashboards.
   Mirrors what the n8n workflows / Ollama model do server-side, so the console
   behaves identically offline. No DOM here.
   Depends on (at call time): store.js (allLeads), format.js (daysSince).
   ========================================================================== */
"use strict";

/* Lightweight local "AI" extraction — mirrors the n8n LLM extraction prompt so
   the Demo mode shows the same rich output the server produces. */
function localExtract(message){
  const m=(message||'').toLowerCase();
  const email=(message.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)||[''])[0];
  const phone=(message.match(/(\+?\d[\d\s().-]{6,}\d)/)||[''])[0].trim();
  let intent='irrelevant';
  if(/price|pricing|quote|cost|demo|meeting|buy|purchase|interested|seats|subscription/.test(m)) intent='sales_inquiry';
  else if(/partner|integration|reseller|collaborat/.test(m)) intent='partnership';
  else if(/complain|angry|delay|refund|issue|problem|broken/.test(m)) intent='complaint';
  else if(/help|support|question|how do|reset|callback/.test(m)) intent='support_request';
  let priority='cold';
  if(/price|pricing|quote|demo|meeting|asap|urgent/.test(m) || (email&&phone)) priority='hot';
  else if(/information|details|learn|tell me|interested/.test(m)) priority='warm';
  const actionMap={
    sales_inquiry: priority==='hot'?'Call within 24h and send a tailored demo invite.':'Send pricing overview and qualify the need.',
    partnership:'Route to partnerships team and schedule a discovery call.',
    complaint:'Escalate to support lead and respond within 2 hours.',
    support_request:'Assign to support queue and confirm receipt by email.',
    irrelevant:'No action — keep for nurturing list.'
  };
  return { email, phone, intent, priority, interest:message.trim().slice(0,90), recommended_action:actionMap[intent] };
}

/* Simple inactivity-aware follow-up draft (used by Demo mode). */
function draftFollowUp(lead){
  const name = lead.name || 'there';
  return `Dear ${name},

I hope you are doing well. I am reaching out to follow up regarding your interest in our CRM automation solution. It has been a little while since we last connected, and I wanted to check whether you would like to continue the discussion.

If it helps, I would be glad to arrange a short call or share more details tailored to your needs.

Best regards,
Sales Team`;
}

/* ------------------------------------------------ LIVE (ODOO) MAPPING --- */
/* The Live workspace reads real Odoo crm.lead records returned by the
   crm-list-leads n8n workflow. These helpers map whatever field names n8n
   returns onto the same shape Demo/Local leads use, so every view is identical. */

/* Pull the records array out of whatever envelope n8n returns. */
function extractLeadArray(data){
  if(Array.isArray(data)) return data;
  if(!data || typeof data!=='object') return [];
  return data.leads || data.records || data.opportunities || data.data || data.items || [];
}
/* Map Odoo's priority (0–3) or a word onto the console's hot/warm/cold. */
function normPriority(p){
  const s=String(p==null?'':p).toLowerCase();
  if(s==='hot'||s==='warm'||s==='cold') return s;
  if(s==='3'||s==='very high'||s==='high') return 'hot';
  if(s==='2'||s==='medium') return 'warm';
  return 'cold';
}
/* Normalise an Odoo datetime ("2024-01-15 10:30:00", naive UTC) to ISO. */
function normDate(v){
  if(!v) return '';
  const s=String(v).trim();
  const m=/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/.exec(s);
  if(m && !/[Z+]|-\d{2}:\d{2}$/.test(s.slice(10))) return `${m[1]}T${m[2]}Z`;
  return s.replace(' ','T');
}
/* Map one Odoo crm.lead record onto the canonical lead shape. Tolerant of
   missing fields and of however the n8n workflow names them. */
function mapLiveLead(r, i){
  r = r || {};
  return {
    id: r.id != null ? r.id : (r.lead_id != null ? r.lead_id : (9000 + (i||0))),
    name: r.contact_name || r.partner_name || r.name || r.display_name || 'Unnamed lead',
    email_from: r.email_from || r.email || '',
    phone: r.phone || r.mobile || '',
    type: 'opportunity',
    interest: r.interest || r.description || r.name || '',
    intent: r.intent || r.type || 'sales_inquiry',
    priority: normPriority(r.priority),
    create_date: normDate(r.create_date || r.created_at),
    write_date:  normDate(r.write_date || r.updated_at || r.create_date || r.created_at),
    expected_revenue: Number(r.expected_revenue || r.revenue || 0) || 0
  };
}

/* ------------------------------------------------------- KPI / METRICS --- */
function computeKPIs(leads){
  const ops = leads.filter(l=>l.type==='opportunity');
  const total=ops.length;
  const withEmail=ops.filter(l=>l.email_from).length;
  const withPhone=ops.filter(l=>l.phone).length;
  const inactive=ops.filter(l=>{ const d=daysSince(l.write_date||l.create_date); return d!=null && d>=7; }).length;
  const newWeek=ops.filter(l=>{ const d=daysSince(l.create_date); return d!=null && d<=7; }).length;
  return { total, withEmail, withPhone, inactive, newWeek, active: total-inactive };
}
function priorityBreakdown(leads){
  const ops=leads.filter(l=>l.type==='opportunity');
  return {
    hot: ops.filter(l=>l.priority==='hot').length,
    warm: ops.filter(l=>l.priority==='warm').length,
    cold: ops.filter(l=>l.priority==='cold').length
  };
}

function composeLocalSummary(){
  const k=computeKPIs(viewData());
  const emailAll = k.withEmail===k.total;
  const phoneAll = k.withPhone===k.total;
  return `CRM Daily Summary:
The pipeline holds ${k.total} opportunities, of which ${k.newWeek} were captured in the last seven days. ${k.inactive} opportunities have had no activity for a week or more and need attention.

Key Observations:
- ${emailAll?'All opportunities have an email address':k.withEmail+' of '+k.total+' opportunities have an email address'}, and ${phoneAll?'all have a phone number':k.withPhone+(k.withPhone===1?' has':' have')+' a phone number'}.
- ${k.inactive} inactive opportunities are at risk of going cold and should be followed up first.

Recommended Action:
Prioritise the ${k.inactive} inactive opportunities today and run the Follow-Up Center to generate tailored outreach for each one.`;
}

/* Parse the n8n agent's "ID / Name / Email / Phone" record format into cards. */
function parseAssistant(ans){
  if(typeof ans!=='string') return {text:JSON.stringify(ans,null,2)};
  const blocks=ans.split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean);
  const records=[];
  blocks.forEach(b=>{
    const m={ id:(b.match(/ID:\s*(.+)/i)||[])[1], name:(b.match(/Name:\s*(.+)/i)||[])[1], email:(b.match(/Email:\s*(.+)/i)||[])[1], phone:(b.match(/Phone:\s*(.+)/i)||[])[1] };
    if(m.id||m.name) records.push({id:m.id||'—',name:m.name||'—',email:m.email||'—',phone:m.phone||'—'});
  });
  if(records.length) return {text:`Found ${records.length} record${records.length>1?'s':''}:`, records};
  return {text:ans};
}
/* Deterministic answers to the structured data questions (the quick-action chips:
   list all, count, inactive, hot — plus look-up by ID). Computes over viewData(),
   so it is exact in EVERY mode (Demo dataset, Local backend, or Live Odoo records).
   Returns null for anything else, so Demo/Local fall through to drafting/help and
   Live falls through to the conversational n8n agent. */
function structuredAnswer(msg){
  const m=msg.toLowerCase();
  const ops=viewData().filter(l=>l.type==='opportunity');
  const card=l=>({id:l.id,name:l.name,email:l.email_from||'not provided',phone:l.phone||'not provided'});

  // In Live mode, if the real opportunities could not be loaded, say so plainly
  // instead of answering "0" — that would look like Odoo is empty.
  const dataIntent=/how many|how much|count|number of|\btotal\b|inactive|unactive|quiet|stale|idle|dormant|\bhot\b|priorit|urgent|\blist\b|show|\ball\b|display|find|\bget\b|opportun|\blead|pipeline|\b\d{1,6}\b/.test(m);
  if(dataIntent && typeof state!=='undefined' && state.mode==='live' && state.liveError && !ops.length){
    return {text:`I couldn't load live opportunities from Odoo (${state.liveError}). Open Settings to check the Lead List webhook, or switch to Demo or Local mode.`};
  }

  const idMatch=msg.match(/\b(\d{1,6})\b/);
  if(idMatch && /opportunit|\blead|record|\bid\b|show|\bget\b|open|look ?up|number/.test(m)){
    const l=ops.find(x=>String(x.id)===idMatch[1]);
    return l ? {text:'Here is the opportunity:', records:[card(l)]}
             : {text:`No opportunity with ID ${idMatch[1]} in the current pipeline.`};
  }
  if(/how many|how much|count|number of|\btotal\b/.test(m)){
    const k=computeKPIs(viewData());
    return {text:`There are ${k.total} opportunities in the pipeline — ${k.newWeek} new this week and ${k.inactive} inactive for a week or more.`};
  }
  if(/inactive|unactive|quiet|stale|idle|dormant|no activity/.test(m)){
    const inactive=ops.filter(l=>{ const d=daysSince(l.write_date||l.create_date); return d!=null && d>=7; });
    return inactive.length ? {text:`${inactive.length} inactive opportunit${inactive.length>1?'ies':'y'} (no activity for 7+ days):`, records:inactive.map(card)}
                           : {text:'Good news — no opportunities have been inactive for 7 days or more.'};
  }
  if(/\bhot\b|high.?priority|urgent|priorit/.test(m)){
    const hot=ops.filter(l=>l.priority==='hot');
    return hot.length ? {text:`${hot.length} hot opportunit${hot.length>1?'ies':'y'} right now:`, records:hot.map(card)}
                      : {text:'No hot opportunities right now.'};
  }
  if(/\blist\b|show|\ball\b|display|find|\bget\b|opportun|\blead|pipeline|everything/.test(m)){
    if(!ops.length) return {text:'There are no opportunities in the pipeline yet.'};
    const CAP=50, subset=ops.slice(0,CAP);
    const head = ops.length>CAP ? `Showing the first ${CAP} of ${ops.length} opportunities:`
                                 : `All ${ops.length} opportunit${ops.length>1?'ies':'y'}:`;
    return {text:head, records:subset.map(card)};
  }
  return null;
}

/* Demo/Local-mode assistant: structured data answers first, then drafting / help. */
function localAssistant(msg){
  const direct=structuredAnswer(msg);
  if(direct) return direct;
  const m=msg.toLowerCase();
  const ops=viewData().filter(l=>l.type==='opportunity');
  if(/draft|follow.?up|write|message|email/.test(m)){
    const named=ops.find(l=>m.includes(l.name.toLowerCase().split(' ')[0]));
    const l=named||ops.find(l=>{const d=daysSince(l.write_date);return d>=7;})||ops[0];
    if(!l) return {text:'There are no opportunities to draft a follow-up for yet.'};
    return {text:`Suggested follow-up for ${l.name}:\n\n${draftFollowUp(l)}`};
  }
  if(/hello|hi|hey|help|what can you/.test(m)){
    return {text:'I can list opportunities, look one up by ID, count records, find hot or inactive leads, or draft a follow-up. What would you like?'};
  }
  return {text:'I work on CRM opportunities. Try: "list all opportunities", "how many leads", "list inactive leads", or "show hot leads".'};
}
