/* ============================================================================
   Repository layer — the only place that talks to NeDB. Services depend on
   these; they never touch the datastores directly. Each repo exposes a small,
   intention-revealing async API and strips NeDB's internal _id on the way out.
   ========================================================================== */
"use strict";
const { db } = require("./db");

const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest; };
const cleanAll = (docs) => docs.map(clean);

const usersRepo = {
  async findByEmail(email){ return db.users.findOneAsync({ email: String(email || "").toLowerCase() }); },
  async create(doc){ return clean(await db.users.insertAsync(doc)); },
  async all(){ return cleanAll(await db.users.findAsync({})); }
};

const opportunitiesRepo = {
  async all(){ return cleanAll(await db.opportunities.findAsync({})); },
  async byId(id){ return clean(await db.opportunities.findOneAsync({ id: Number(id) })); },
  async insert(doc){ return clean(await db.opportunities.insertAsync(doc)); },
  async update(id, patch){
    await db.opportunities.updateAsync({ id: Number(id) }, { $set: patch });
    return this.byId(id);
  },
  async nextId(){
    const docs = await db.opportunities.findAsync({});
    const max = docs.reduce((m, d) => Math.max(m, Number(d.id) || 0), 1999); // created leads start at 2000
    return max + 1;
  }
};

const capturesRepo = {
  async insert(doc){ return clean(await db.captures.insertAsync(doc)); },
  async all(){ return cleanAll(await db.captures.findAsync({})); }
};

const settingsRepo = {
  async get(){ const doc = await db.settings.findOneAsync({ key: "endpoints" }); return doc ? doc.value : null; },
  async set(value){
    await db.settings.updateAsync({ key: "endpoints" }, { key: "endpoints", value }, { upsert: true });
    return value;
  }
};

module.exports = { usersRepo, opportunitiesRepo, capturesRepo, settingsRepo };
