/* ============================================================================
   Screenshot harness — drives the real app in headless Chrome (via the running
   static server) and captures every use case to ./screenshots. Demo mode only,
   so it has zero backend side effects. Run:  npm run screenshots
   (requires `npm start` running on PORT, default 3000)
   ========================================================================== */
"use strict";
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:" + (process.env.PORT || 3000) + "/";
const OUT = path.join(__dirname, "..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }).then(c => c.newPage());
  page.setDefaultTimeout(15000);
  const log = [];
  let n = 0;
  const shot = async (name) => {
    n++;
    const file = `${String(n).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    const bytes = fs.statSync(path.join(OUT, file)).size;
    log.push({ file, bytes });
    console.log(`  ✓ ${file} (${Math.round(bytes / 1024)} KB)`);
  };
  // Wait until Tailwind's CDN JIT has actually applied styles (body bg = --paper).
  const waitTailwind = async () => {
    await page.waitForFunction(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    }, { timeout: 15000 });
    await page.waitForTimeout(350);
  };
  const click = async (sel) => { await page.click(sel); };
  const nav = async (tab) => { await page.click(`.nav-item[data-tab="${tab}"]`); await page.waitForTimeout(250); };

  try {
    console.log("Capturing use cases from " + BASE);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await waitTailwind();

    // --- Pre-login flow ---
    await shot("landing");
    await click('[data-go="signup"]'); await page.waitForSelector("#signupForm"); await page.waitForTimeout(200);
    await shot("signup");
    await click('[data-go="login"]'); await page.waitForSelector("#loginForm"); await page.waitForTimeout(200);
    await shot("login");

    // --- Sign in (demo manager, fields prefilled) ---
    await page.click('#loginForm button[type="submit"]');
    await page.waitForSelector(".nav-item", { timeout: 8000 });
    await page.waitForTimeout(500);
    await shot("dashboard");

    // Dashboard analytics (Demo — on-device summary)
    await click("#runAnalytics");
    await page.waitForFunction(() => (document.querySelector("#summaryBox")?.innerText || "").includes("CRM Daily Summary"), { timeout: 8000 });
    await page.waitForTimeout(300);
    await shot("dashboard-analytics");

    // Lead capture — created
    await nav("capture");
    await page.waitForSelector("#cap_msg");
    await page.fill("#cap_msg", "Hello, I'm Nour Ben Salah from Tunisitech. We'd like a demo of your automation suite for ~15 reps. Reach me at nour.bensalah@tunisitech.tn or +216 24 778 991.");
    await click("#capBtn");
    await page.waitForFunction(() => (document.querySelector("#capResult")?.innerText || "").includes("Opportunity created"), { timeout: 8000 });
    await page.waitForTimeout(300);
    await shot("capture-created");

    // Lead capture — duplicate (email already in the demo dataset)
    await page.fill("#cap_msg", "Hi, this is Karim Haddad again, karim@vermeg.com, following up on the ERP integration.");
    await click("#capBtn");
    await page.waitForFunction(() => (document.querySelector("#capResult")?.innerText || "").includes("Duplicate detected"), { timeout: 8000 });
    await page.waitForTimeout(300);
    await shot("capture-duplicate");

    // Lead workspace + detail + drafted follow-up
    await nav("workspace");
    await page.waitForSelector(".lead-row");
    await shot("workspace");
    await page.click(".lead-row");
    await page.waitForSelector("#ws_draft");
    await page.click("#ws_draft");
    await page.waitForFunction(() => (document.querySelector("#ws_mail")?.innerText || "").length > 30, { timeout: 8000 });
    await page.waitForTimeout(300);
    await shot("workspace-detail");

    // Follow-up center (Demo batch)
    await nav("followup");
    await page.waitForSelector("#runFollow");
    await page.click("#runFollow");
    await page.waitForSelector("#followBox [data-copy]", { timeout: 12000 });
    await page.waitForTimeout(400);
    await shot("followup");

    // CRM assistant (Demo — answers from local dataset)
    await nav("assistant");
    await page.waitForSelector("#chatMsg");
    await page.fill("#chatMsg", "List all opportunities");
    await page.click("#chatSend");
    await page.waitForFunction(() => (document.querySelector("#chatLog")?.innerText || "").includes("Showing"), { timeout: 12000 });
    await page.waitForTimeout(400);
    await shot("assistant");

    // Architecture
    await nav("architecture");
    await page.waitForFunction(() => document.body.innerText.includes("Three-layer architecture"), { timeout: 8000 });
    await shot("architecture");

    // Settings
    await nav("settings");
    await page.waitForSelector("#saveCfg");
    await page.waitForTimeout(200);
    await shot("settings");

    fs.writeFileSync(path.join(OUT, "_manifest.json"), JSON.stringify(log, null, 2));
    console.log(`\nDone — ${log.length} screenshots in ${OUT}`);
    const tiny = log.filter(x => x.bytes < 5000);
    if (tiny.length) { console.log("WARNING: suspiciously small files:", tiny); process.exitCode = 2; }
  } catch (e) {
    console.error("SCREENSHOT RUN FAILED:", e.message);
    await page.screenshot({ path: path.join(OUT, "_error.png"), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
