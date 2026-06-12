/* ============================================================================
   Backend configuration. Local-only, no secrets — values are safe defaults
   overridable by environment variables.
   ========================================================================== */
"use strict";
const path = require("path");

module.exports = {
  PORT: process.env.PORT || 3000,
  ROOT: path.join(__dirname, ".."),            // project root (serves index.html + src/)
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, "data"), // NeDB files live here
  TOKEN_BYTES: 24
};
