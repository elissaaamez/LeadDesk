/* ============================================================================
   Assistant service — Local-mode AI assistant that responds to CRM questions
   from the local opportunity dataset (no Ollama/n8n dependency).
   ========================================================================== */
"use strict";
const { opportunitiesRepo } = require("../repositories");
const { daysSince } = require("../lib/domain");

async function handleQuery(message) {
  if (!message || typeof message !== "string") {
    return { text: "Please provide a question." };
  }

  const m = message.toLowerCase().trim();
  const opps = (await opportunitiesRepo.all()).filter(l => l.type === "opportunity");

  // Numeric ID lookup: "show 1005", "lead 1010"
  const idMatch = message.match(/\b(\d{3,5})\b/);
  if (idMatch) {
    const found = opps.find(x => String(x.id) === idMatch[1]);
    if (!found) return { text: "Lead not found." };
    return {
      text: "Here is the opportunity:",
      records: [{
        id: found.id,
        name: found.name,
        email: found.email_from || "not provided",
        phone: found.phone || "not provided"
      }]
    };
  }

  // Count queries: "how many", "count", "number of"
  if (/how many|count|number of|total/.test(m)) {
    const inactive = opps.filter(l => {
      const d = daysSince(l.write_date || l.create_date);
      return d != null && d >= 7;
    }).length;
    const newWeek = opps.filter(l => {
      const d = daysSince(l.create_date);
      return d != null && d <= 7;
    }).length;
    return {
      text: `There are ${opps.length} opportunities in the pipeline — ${newWeek} new this week and ${inactive} inactive for a week or more.`
    };
  }

  // Follow-up/draft queries
  if (/draft|follow.?up|write|message|email|respond/.test(m)) {
    const named = opps.find(l => m.includes(l.name.toLowerCase().split(" ")[0]));
    const l = named || opps.find(l => {
      const d = daysSince(l.write_date || l.create_date);
      return d >= 7;
    }) || opps[0];
    if (!l) return { text: "No opportunities found to draft follow-up for." };
    const followUp = `Dear ${l.name},\n\nI hope you are doing well. I am reaching out to follow up regarding your interest in our CRM automation solution. It has been a little while since we last connected, and I wanted to check whether you would like to continue the discussion.\n\nIf it helps, I would be glad to arrange a short call or share more details tailored to your needs.\n\nBest regards,\nSales Team`;
    return { text: `Suggested follow-up for ${l.name}:\n\n${followUp}` };
  }

  // List/show all
  if (/list|show|all|display|find|get|opportun|lead/.test(m)) {
    const subset = opps.slice(0, 8);
    return {
      text: `Showing ${subset.length} of ${opps.length} opportunities:`,
      records: subset.map(l => ({
        id: l.id,
        name: l.name,
        email: l.email_from || "not provided",
        phone: l.phone || "not provided"
      }))
    };
  }

  // Hot/priority queries
  if (/hot|priority|urgent|high/.test(m)) {
    const hot = opps.filter(l => l.priority === "hot");
    return {
      text: `${hot.length} hot opportunities right now:`,
      records: hot.map(l => ({
        id: l.id,
        name: l.name,
        email: l.email_from || "not provided",
        phone: l.phone || "not provided"
      }))
    };
  }

  // Help/greeting
  if (/hello|hi|hey|help|what can you|start/.test(m)) {
    return {
      text: "I can list opportunities, look one up by ID (e.g. \"show 1003\"), count records, find hot leads, or draft a follow-up. What would you like?"
    };
  }

  // Default fallback
  return {
    text: "I work on CRM opportunities. Try: \"list all opportunities\", \"show 1004\", \"how many leads\", \"hot opportunities\", or \"draft a follow-up for [name]\"."
  };
}

module.exports = { handleQuery };
