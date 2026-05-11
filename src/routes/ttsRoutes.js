const express = require("express");
const {
  generateTTS,
  listLanguages,
  previewTTS
} = require("../controllers/ttsController");

const router = express.Router();

router.post("/announcement/tts", generateTTS);
router.get("/announcement/tts/languages", listLanguages);
router.post("/announcement/tts/preview", previewTTS);

module.exports = router;