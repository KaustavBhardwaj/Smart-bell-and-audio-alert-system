const multer = require("multer");
const { UPLOADS_PATH } = require("../config/env");

const upload = multer({
  dest: UPLOADS_PATH,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

module.exports = upload;