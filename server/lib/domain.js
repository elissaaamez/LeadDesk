/* ============================================================================
   Pure domain logic (no DB, no HTTP) — the server-side equivalent of the
   front-end's model/domain.js. Extraction, duplicate matching, KPIs, the
   manager summary, and follow-up drafting. Kept dependency-free and testable.
   ========================================================================== */
"use strict";
const DAY = 86400000;

function daysSince(iso){ if(!iso) return null; return Math.floor((Date.now() - new Date(iso).getTime()) / DAY); }

/* Extract structured fields from a free-text customer message. */
function extract(message){
  const text = String(message || "");
  const m = text.toLowerCase();
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [""])[0];
  const phoneSource = email ? text.replace(email, " ") : text;
  const phone = (phoneSource.match(/(\+\d[\d\s().-]{6,}\d|\b\d[\d\s().-]{6,}\d\b)/) || [""])[0].trim();
  const nameMatch = text.match(/my name is ([^.,\n]+)/i) || text.match(/\b(?:i am|i'm)\s+([a-z][a-z' -]{1,40}?)(?=\s+from\b|[,.])/i);
  let intent = "irrelevant";
  if(/price|pricing|quote|cost|demo|meeting|buy|purchase|interested|seats|subscription/.test(m)) intent = "sales_inquiry";
  else if(/partner|integration|reseller|collaborat/.test(m)) intent = "partnership";
  else if(/complain|angry|delay|refund|issue|problem|broken/.test(m)) intent = "complaint";
  else if(/help|support|question|how do|reset|callback/.test(m)) intent = "support_request";
  let priority = "cold";
  if(/price|pricing|quote|demo|meeting|asap|urgent/.test(m) || (email && phone)) priority = "hot";
  else if(/information|details|learn|tell me|interested/.test(m)) priority = "warm";
  const actionMap = {
    sales_inquiry: priority === "hot" ? "Call within 24h and send a tailored demo invite." : "Send pricing overview and qualify the need.",
    partnership: "Route to partnerships team and schedule a discovery call.",
    complaint: "Escalate to support lead and respond within 2 hours.",
    support_request: "Assign to support queue and confirm receipt by email.",
    irrelevant: "No action — keep for nurturing list."
  };
  return {
    name: nameMatch ? nameMatch[1].trim() : "",
    email, phone, intent, priority,
    interest: text.trim().slice(0, 90),
    recommended_action: actionMap[intent]
  };
}

/* Find an existing opportunity matching email or phone (duplicate check). */
function matchDuplicate(opps, email, phone){
  const e = String(email || "").toLowerCase();
  const p = String(phone || "").replace(/\s/g, "");
  return opps.find(l => l.type === "opportunity" && (
    (e && String(l.email_from || "").toLowerCase() === e) ||
    (p && String(l.phone || "").replace(/\s/g, "") === p)
  )) || null;
}

function computeKPIs(opportunities){
  const ops = opportunities.filter(l => l.type === "opportunity");
  const total = ops.length;
  const withEmail = ops.filter(l => l.email_from).length;
  const withPhone = ops.filter(l => l.phone).length;
  const inactive = ops.filter(l => { const d = daysSince(l.write_date || l.create_date); return d != null && d >= 7; }).length;
  const newWeek = ops.filter(l => { const d = daysSince(l.create_date); return d != null && d <= 7; }).length;
  return { total, withEmail, withPhone, inactive, newWeek, active: total - inactive };
}
function priorityBreakdown(opportunities){
  const ops = opportunities.filter(l => l.type === "opportunity");
  return {
    hot: ops.filter(l => l.priority === "hot").length,
    warm: ops.filter(l => l.priority === "warm").length,
    cold: ops.filter(l => l.priority === "cold").length
  };
}

function composeSummary(k){
  const emailAll = k.withEmail === k.total;
  const phoneAll = k.withPhone === k.total;
  return `CRM Daily Summary:
The pipeline holds ${k.total} opportunities, of which ${k.newWeek} were captured in the last seven days. ${k.inactive} opportunities have had no activity for a week or more and need attention.

Key Observations:
- ${emailAll ? "All opportunities have an email address" : k.withEmail + " of " + k.total + " opportunities have an email address"}, and ${phoneAll ? "all have a phone number" : k.withPhone + (k.withPhone === 1 ? " has" : " have") + " a phone number"}.
- ${k.inactive} inactive opportunities are at risk of going cold and should be followed up first.

Recommended Action:
Prioritise the ${k.inactive} inactive opportunities today and run the Follow-Up Center to generate tailored outreach for each one.`;
}

function draftFollowUp(name){
  return `Dear ${name || "there"},

I hope you are doing well. I am reaching out to follow up regarding your interest in our CRM automation solution. It has been a little while since we last connected, and I wanted to check whether you would like to continue the discussion.

If it helps, I would be glad to arrange a short call or share more details tailored to your needs.

Best regards,
Sales Team`;
}

module.exports = { DAY, daysSince, extract, matchDuplicate, computeKPIs, priorityBreakdown, composeSummary, draftFollowUp };
