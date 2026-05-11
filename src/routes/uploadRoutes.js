const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadOnly,
  uploadAndPlay,
} = require("../controllers/uploadController");

const router = express.Router();

router.post("/announcement/upload", upload.single("audio"), uploadOnly);
router.post("/announcement/upload-and-play", upload.single("audio"), uploadAndPlay);

module.exports = router;