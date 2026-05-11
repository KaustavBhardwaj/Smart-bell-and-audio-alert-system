const express = require("express");
const {
  listAnnouncements,
  playTest,
  playExistingFile,
  stopPlayback,
  getAudioVolume,
  setAudioVolume,
} = require("../controllers/playbackController");

const router = express.Router();

router.get("/announcement/list", listAnnouncements);
router.post("/announcement/test", playTest);
router.post("/announcement/play-file", playExistingFile);
router.post("/announcement/stop", stopPlayback);
router.get("/audio/volume", getAudioVolume);
router.put("/audio/volume", setAudioVolume);

module.exports = router;