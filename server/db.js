/* ============================================================================
   Data layer — embedded NeDB datastores (one file per collection under
   server/data). Collections: users, opportunities, captures, settings.
   seedIfEmpty() populates demo accounts + the starter opportunity set on first
   run, so the console has real, persisted data out of the box.
   ========================================================================== */
"use strict";
const Datastore = require("@seald-io/nedb");
const path = require("path");
const fs = require("fs");
const { DATA_DIR } = require("./config");
const { hashPassword } = require("./lib/security");

fs.mkdirSync(DATA_DIR, { recursive: true });
const open = (name) => new Datastore({ filename: path.join(DATA_DIR, name + ".db"), autoload: true });

const db = {
  users:         open("users"),
  opportunities: open("opportunities"),
  captures:      open("captures"),
  settings:      open("settings")
};

/* Starter opportunities (name, email, phone, interest, intent, priority, created-days-ago, updated-days-ago, revenue) */
const SEED_OPPS = [
  ["Amine Trabelsi","amine.trabelsi@medianet.tn","+216 22 145 880","Demo of the automation suite","sales_inquiry","hot",2,1,18000],
  ["Sofia Bouaziz","s.bouaziz@delice-holding.com","+216 71 860 200","Pricing for 40 sales seats","sales_inquiry","hot",5,4,42000],
  ["Karim Haddad","karim@vermeg.com","+216 98 332 411","Integration with existing ERP","partnership","warm",10,9,30000],
  ["Leïla Mansour","leila.mansour@poulina.com.tn","+216 71 200 044","General information request","sales_inquiry","warm",12,11,9000],
  ["Yassine Gharbi","yassine.gharbi@talan.com","","Asked about onboarding timeline","sales_inquiry","warm",16,16,15000],
  ["Nadia Cherif","nadia.cherif@sagemcom.com","+216 70 014 220","Renewal discussion","sales_inquiry","hot",22,3,26000],
  ["Mohamed Ali Khelifi","","+216 55 778 109","Complaint about response delay","complaint","cold",9,8,0],
  ["Ines Belhadj","ines.belhadj@biat.com.tn","+216 71 340 733","Requested a callback","support_request","warm",14,13,7000],
  ["Omar Jelassi","omar.jelassi@orange.tn","+216 98 110 540","Comparing vendors","sales_inquiry","warm",30,28,21000],
  ["Rania Ayari","rania.ayari@sopal.com.tn","","Newsletter signup, low intent","irrelevant","cold",21,21,0],
  ["Hatem Souissi","hatem@cynapsys.de","+216 36 401 200","Wants a technical workshop","partnership","hot",1,1,38000],
  ["Fatma Zouari","fatma.zouari@stb.com.tn","+216 71 132 000","Asked for a quote last month","sales_inquiry","warm",40,35,17000],
  ["Bilel Mejri","bilel.mejri@tunisietelecom.tn","+216 50 220 880","Interested in analytics module","sales_inquiry","hot",6,6,24000],
  ["Sarra Lahmar","sarra.lahmar@monoprix.tn","+216 71 950 010","Follow-up needed, went quiet","sales_inquiry","warm",27,24,12000]
];
const SEED_USERS = [
  { name: "Sales Manager",  email: "manager@company.com", password: "admin123", role: "Manager" },
  { name: "Sales Employee", email: "sales@company.com",   password: "sales123", role: "Sales" }
];

async function seedIfEmpty(){
  await db.users.ensureIndexAsync({ fieldName: "email", unique: true }).catch(() => {});
  await db.opportunities.ensureIndexAsync({ fieldName: "id", unique: true }).catch(() => {});

  if (await db.users.countAsync({}) === 0) {
    for (const u of SEED_USERS) {
      await db.users.insertAsync({ name: u.name, email: u.email.toLowerCase(), role: u.role, password: hashPassword(u.password), created_at: new Date().toISOString() });
    }
  }
  if (await db.opportunities.countAsync({}) === 0) {
    const DAY = 86400000;
    const iso = (d) => new Date(Date.now() - d * DAY).toISOString();
    let i = 0;
    for (const r of SEED_OPPS) {
      await db.opportunities.insertAsync({
        id: 1000 + i, name: r[0], email_from: r[1], phone: r[2], type: "opportunity",
        interest: r[3], intent: r[4], priority: r[5],
        create_date: iso(r[6]), write_date: iso(r[7]), expected_revenue: r[8]
      });
      i++;
    }
  }
}

module.exports = { db, seedIfEmpty };
