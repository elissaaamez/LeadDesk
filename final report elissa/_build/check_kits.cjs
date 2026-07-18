const fs = require("fs");
const path = require("path");
const S = path.join(__dirname, "..", "umls", "staruml");
const kits = ["uc-platform-foundation", "uc-authentication", "uc-account-management", "uc-lead-capture", "uc-analytics-followup", "uc-assistant-live", "uc-global"];
for (const f of kits) {
  const js = fs.readFileSync(path.join(S, f + ".populate.js"), "utf8");
  const mdj = fs.readFileSync(path.join(S, f + ".mdj"), "utf8").replace(/^﻿/, "");
  const posNames = [...js.matchAll(/"([^"]+)"\s*:\s*\{\s*"x"\s*:/g)].map(m => m[1]);
  let model;
  try { model = JSON.parse(mdj); } catch (e) { console.log(`=== ${f} ===\n  MODEL PARSE ERROR: ${e.message}`); continue; }
  const names = new Set();
  (function walk(o) { if (o && typeof o === "object") { if (typeof o.name === "string") names.add(o.name); for (const k in o) walk(o[k]); } })(model);
  const missing = posNames.filter(n => !names.has(n));
  console.log(`=== ${f} ===`);
  console.log(`  elements placed by populate.js : ${posNames.length}`);
  console.log(`  names NOT found in model       : ${missing.length ? JSON.stringify(missing) : "none  -> export-ready"}`);
}
