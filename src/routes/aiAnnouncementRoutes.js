const express = require("express");
const {
  createAiAnnouncement
} = require("../controllers/aiAnnouncementController");

const router = express.Router();

router.post("/announcement/ai", createAiAnnouncement);

module.exports = router;