/* ============================================================================
   Auth service — signup / login / session verification. Passwords are scrypt-
   hashed (see lib/security). Sessions are in-memory bearer tokens (a local
   single-process server; tokens reset on restart, which is fine for this app).
   ========================================================================== */
"use strict";
const { usersRepo } = require("../repositories");
const { hashPassword, verifyPassword, newToken } = require("../lib/security");

const sessions = new Map();              // token -> { email, name, role }
const publicUser = (u) => ({ email: u.email, name: u.name, role: u.role });

async function signup({ name, email, password }){
  email = String(email || "").trim().toLowerCase();
  name = String(name || "").trim();
  if(!name || !email || !password) { const e = new Error("Name, email and password are required."); e.status = 400; throw e; }
  if(await usersRepo.findByEmail(email)) { const e = new Error("An account with that email already exists."); e.status = 409; throw e; }
  const user = await usersRepo.create({ name, email, role: "Sales", password: hashPassword(password), created_at: new Date().toISOString() });
  return issue(user);
}

async function login({ email, password }){
  email = String(email || "").trim().toLowerCase();
  const user = await usersRepo.findByEmail(email);
  if(!user || !verifyPassword(password, user.password)) { const e = new Error("Invalid email or password."); e.status = 401; throw e; }
  return issue(user);
}

function issue(user){
  const token = newToken();
  const u = publicUser(user);
  sessions.set(token, u);
  return { token, user: u };
}

function verify(token){ return token ? sessions.get(token) || null : null; }
function logout(token){ sessions.delete(token); }

module.exports = { signup, login, verify, logout };
