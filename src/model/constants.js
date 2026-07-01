/* ============================================================================
   MODEL · CONSTANTS — static configuration: default webhook endpoints, the
   demo user directory, and the navigation map. No DOM, no behaviour.
   ========================================================================== */
"use strict";

/* ----------------------------------------------------------- CONSTANTS --- */
const DEFAULTS = {
  leadCapture:'http://localhost:5678/webhook/lead-capture',
  leadList:   'http://localhost:5678/webhook/crm-list-leads',
  analytics:  'http://localhost:5678/webhook/crm-summary',
  followUp:   'http://localhost:5678/webhook/smart-follow-up',
  assistant:  'http://localhost:5678/webhook/crm-ai-assistant'
};
const USERS = [
  { email:'manager@company.com', password:'admin123', name:'Sales Manager', role:'Manager' },
  { email:'sales@company.com',   password:'sales123', name:'Sales Employee', role:'Sales' }
];
const NAV = [
  { sec:'Operations' },
  { tab:'dashboard', label:'Dashboard',        icon:'grid' },
  { tab:'capture',   label:'Lead Capture',     icon:'send' },
  { tab:'workspace', label:'Lead Workspace',   icon:'users' },
  { tab:'followup',  label:'Follow-Up Center', icon:'refresh' },
  { sec:'Intelligence' },
  { tab:'assistant', label:'CRM Assistant',    icon:'bot' },
  { sec:'System' },
  { tab:'architecture', label:'Architecture',  icon:'layers' },
  { tab:'settings',  label:'Settings',         icon:'settings' }
];
