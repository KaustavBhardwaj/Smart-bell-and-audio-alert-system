const fs = require("fs");
const path = require("path");
const { MEDIA_PATH } = require("../config/env");

function listMediaFiles() {
  const files = fs.readdirSync(MEDIA_PATH);
  return files.filter((file) => path.extname(file).toLowerCase() === ".wav");
}

module.exports = { listMediaFiles };