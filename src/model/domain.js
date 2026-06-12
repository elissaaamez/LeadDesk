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
/* Demo-mode assistant: answers strictly from local dataset. */
function localAssistant(msg){
  const m=msg.toLowerCase();
  const ops=viewData().filter(l=>l.type==='opportunity');
  const idMatch=msg.match(/\b(\d{3,5})\b/);
  if(idMatch){
    const l=ops.find(x=>String(x.id)===idMatch[1]);
    if(!l) return {text:'Lead not found.'};
    return {text:'Here is the opportunity:', records:[{id:l.id,name:l.name,email:l.email_from||'not provided',phone:l.phone||'not provided'}]};
  }
  if(/how many|count|number of/.test(m)){
    const k=computeKPIs(viewData());
    return {text:`There are ${k.total} opportunities in the pipeline — ${k.newWeek} new this week and ${k.inactive} inactive for a week or more.`};
  }
  if(/draft|follow.?up|write|message|email/.test(m)){
    const named=ops.find(l=>m.includes(l.name.toLowerCase().split(' ')[0]));
    const l=named||ops.find(l=>{const d=daysSince(l.write_date);return d>=7;})||ops[0];
    return {text:`Suggested follow-up for ${l.name}:\n\n${draftFollowUp(l)}`};
  }
  if(/list|show|all|display|find|get|opportun|lead/.test(m)){
    const subset=ops.slice(0,8);
    return {text:`Showing ${subset.length} of ${ops.length} opportunities:`, records:subset.map(l=>({id:l.id,name:l.name,email:l.email_from||'not provided',phone:l.phone||'not provided'}))};
  }
  if(/hot|priority|urgent/.test(m)){
    const hot=ops.filter(l=>l.priority==='hot');
    return {text:`${hot.length} hot opportunities right now:`, records:hot.map(l=>({id:l.id,name:l.name,email:l.email_from||'not provided',phone:l.phone||'not provided'}))};
  }
  if(/hello|hi|hey|help|what can you/.test(m)){
    return {text:'I can list opportunities, look one up by ID (e.g. "show 1003"), count records, find hot leads, or draft a follow-up. What would you like?'};
  }
  return {text:'I work on CRM opportunities. Try: "list all opportunities", "show 1004", "how many leads", or "draft a follow-up for Karim".'};
}
