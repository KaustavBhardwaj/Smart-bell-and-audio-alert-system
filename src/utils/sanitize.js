const path = require("path");

function sanitizeBaseName(filename) {
  return path
    .parse(filename)
    .name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
}

module.exports = { sanitizeBaseName };