/* ============================================================================
   MODEL · DATASET — the offline demo dataset. Realistic Odoo crm.lead-shaped
   opportunities used by Demo mode so the console works with no backend.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------- DEMO DATASET --- */
const DAY = 86400000;
function isoDaysAgo(d){ return new Date(Date.now() - d*DAY).toISOString(); }
/* Realistic Odoo crm.lead-shaped opportunities. created/updated offsets in days. */
const SEED = [
  ['Amine Trabelsi','amine.trabelsi@medianet.tn','+216 22 145 880','Demo of the automation suite','sales_inquiry','hot',  2, 1, 18000],
  ['Sofia Bouaziz','s.bouaziz@delice-holding.com','+216 71 860 200','Pricing for 40 sales seats','sales_inquiry','hot', 5, 4, 42000],
  ['Karim Haddad','karim@vermeg.com','+216 98 332 411','Integration with existing ERP','partnership','warm', 10, 9, 30000],
  ['Leïla Mansour','leila.mansour@poulina.com.tn','+216 71 200 044','General information request','sales_inquiry','warm', 12, 11, 9000],
  ['Yassine Gharbi','yassine.gharbi@talan.com','','Asked about onboarding timeline','sales_inquiry','warm', 16, 16, 15000],
  ['Nadia Cherif','nadia.cherif@sagemcom.com','+216 70 014 220','Renewal discussion','sales_inquiry','hot', 22, 3, 26000],
  ['Mohamed Ali Khelifi','','+216 55 778 109','Complaint about response delay','complaint','cold', 9, 8, 0],
  ['Ines Belhadj','ines.belhadj@biat.com.tn','+216 71 340 733','Requested a callback','support_request','warm', 14, 13, 7000],
  ['Omar Jelassi','omar.jelassi@orange.tn','+216 98 110 540','Comparing vendors','sales_inquiry','warm', 30, 28, 21000],
  ['Rania Ayari','rania.ayari@sopal.com.tn','','Newsletter signup, low intent','irrelevant','cold', 21, 21, 0],
  ['Hatem Souissi','hatem@cynapsys.de','+216 36 401 200','Wants a technical workshop','partnership','hot', 1, 1, 38000],
  ['Fatma Zouari','fatma.zouari@stb.com.tn','+216 71 132 000','Asked for a quote last month','sales_inquiry','warm', 40, 35, 17000],
  ['Bilel Mejri','bilel.mejri@tunisietelecom.tn','+216 50 220 880','Interested in analytics module','sales_inquiry','hot', 6, 6, 24000],
  ['Sarra Lahmar','sarra.lahmar@monoprix.tn','+216 71 950 010','Follow-up needed, went quiet','sales_inquiry','warm', 27, 24, 12000]
];
function buildDataset(){
  return SEED.map((r,i)=>({
    id: 1000 + i,
    name: r[0],
    email_from: r[1],
    phone: r[2],
    type: 'opportunity',
    interest: r[3],
    intent: r[4],
    priority: r[5],
    create_date: isoDaysAgo(r[6]),
    write_date:  isoDaysAgo(r[7]),
    expected_revenue: r[8]
  }));
}
