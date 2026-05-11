const express = require("express");
const { ringBell, stopBell } = require("../controllers/bellController");

const router = express.Router();

router.post("/bell/on", ringBell);
router.post("/bell/off", stopBell);

module.exports = router;