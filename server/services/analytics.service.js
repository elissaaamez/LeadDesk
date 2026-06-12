/* ============================================================================
   Analytics service — KPIs + manager summary, and the batch follow-up draft
   generator, computed from the persisted opportunities.
   ========================================================================== */
"use strict";
const { opportunitiesRepo } = require("../repositories");
const { computeKPIs, priorityBreakdown, composeSummary, draftFollowUp, daysSince } = require("../lib/domain");

async function summary(){
  const ops = await opportunitiesRepo.all();
  const kpis = computeKPIs(ops);
  return { kpis, priority: priorityBreakdown(ops), text: composeSummary(kpis) };
}

async function followups(){
  const ops = (await opportunitiesRepo.all()).filter(l => l.type === "opportunity");
  const inactive = ops.filter(l => { const d = daysSince(l.write_date || l.create_date); return d != null && d >= 7; });
  return inactive.map(l => ({
    name: l.name,
    email: l.email_from,
    inactive_days: daysSince(l.write_date || l.create_date),
    priority: l.priority,
    message: draftFollowUp(l.name)
  }));
}

module.exports = { summary, followups };
