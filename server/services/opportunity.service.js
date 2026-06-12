/* ============================================================================
   Opportunity service — list/filter, get, create (with duplicate detection)
   and update, over the persisted opportunities collection.
   ========================================================================== */
"use strict";
const { opportunitiesRepo } = require("../repositories");
const { matchDuplicate, daysSince } = require("../lib/domain");

async function list({ q = "", filter = "all" } = {}){
  let ops = (await opportunitiesRepo.all()).filter(l => l.type === "opportunity");
  const query = String(q).toLowerCase().trim();
  if(query) ops = ops.filter(l => `${l.name} ${l.email_from} ${l.interest}`.toLowerCase().includes(query));
  if(filter === "inactive") ops = ops.filter(l => { const d = daysSince(l.write_date || l.create_date); return d != null && d >= 7; });
  else if(["hot","warm","cold"].includes(filter)) ops = ops.filter(l => l.priority === filter);
  return ops.sort((a, b) => new Date(b.create_date) - new Date(a.create_date));
}

async function get(id){ return opportunitiesRepo.byId(id); }

/* Create an opportunity, blocking duplicates by email/phone. */
async function create(data){
  const all = (await opportunitiesRepo.all());
  const dup = matchDuplicate(all, data.email_from, data.phone);
  if(dup) return { status: "duplicate", duplicate: dup };
  const now = new Date().toISOString();
  const opp = await opportunitiesRepo.insert({
    id: await opportunitiesRepo.nextId(),
    name: data.name || "New lead",
    email_from: data.email_from || "",
    phone: data.phone || "",
    type: "opportunity",
    interest: data.interest || "",
    intent: data.intent || "irrelevant",
    priority: data.priority || "cold",
    create_date: now, write_date: now,
    expected_revenue: data.expected_revenue || 0
  });
  return { status: "created", opportunity: opp };
}

async function update(id, patch){
  const allowed = ["name","email_from","phone","interest","intent","priority","expected_revenue"];
  const set = { write_date: new Date().toISOString() };
  for(const k of allowed) if(k in patch) set[k] = patch[k];
  return opportunitiesRepo.update(id, set);
}

module.exports = { list, get, create, update };
