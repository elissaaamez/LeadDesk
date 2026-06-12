/* ============================================================================
   Security helpers — password hashing (scrypt, Node built-in: no native deps)
   and random session tokens. No third-party crypto libraries.
   ========================================================================== */
"use strict";
const crypto = require("crypto");
const { TOKEN_BYTES } = require("../config");

function hashPassword(pw){
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return salt + ":" + hash;
}
function verifyPassword(pw, stored){
  if(!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  const a = Buffer.from(test, "hex"), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newToken(){ return crypto.randomBytes(TOKEN_BYTES).toString("hex"); }

module.exports = { hashPassword, verifyPassword, newToken };
