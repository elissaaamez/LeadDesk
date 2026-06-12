/* ============================================================================
   Capture service — the lead-capture use case end to end: extract structured
   fields from a message, dedupe, create the opportunity if new, and write an
   audit record to the captures collection either way.
   ========================================================================== */
"use strict";
const { capturesRepo } = require("../repositories");
const opportunityService = require("./opportunity.service");
const { extract } = require("../lib/domain");

async function capture({ message, name, email, phone, by }){
  const finalMsg = (message && message.trim())
    || `Hello, my name is ${name || ""}. I am interested in your CRM automation solution. My email is ${email || ""} and my phone is ${phone || ""}.`;
  const ex = extract(finalMsg);
  const dispName = (name && name.trim()) || ex.name || (ex.email ? ex.email.split("@")[0] : "New lead");
  const data = {
    name: dispName,
    email_from: (email || ex.email || "").trim(),
    phone: (phone || ex.phone || "").trim(),
    interest: ex.interest, intent: ex.intent, priority: ex.priority
  };
  const result = await opportunityService.create(data);

  await capturesRepo.insert({
    at: new Date().toISOString(),
    by: by || "console",
    message: finalMsg,
    extract: { ...ex, name: dispName, email: data.email_from, phone: data.phone },
    status: result.status,
    opportunity_id: result.opportunity ? result.opportunity.id : (result.duplicate ? result.duplicate.id : null)
  });

  return {
    status: result.status,
    extract: { ...ex, name: dispName, email: data.email_from, phone: data.phone },
    duplicate: result.duplicate || null,
    opportunity: result.opportunity || null
  };
}

async function history(){ return (await capturesRepo.all()).sort((a, b) => new Date(b.at) - new Date(a.at)); }

module.exports = { capture, history };
