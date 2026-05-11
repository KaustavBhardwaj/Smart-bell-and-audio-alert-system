const express = require("express");
const router = express.Router();
const emergencyController = require("../controllers/emergencyBellController");

/**
 * GET /emergency/status
 * Get emergency bell status and configuration
 */
router.get("/emergency/status", emergencyController.getStatus);

/**
 * POST /emergency/trigger
 * Immediately trigger the emergency bell
 */
router.post("/emergency/trigger", emergencyController.trigger);
router.post("/emergency/stop", emergencyController.stop);
/**
 * PUT /emergency/enable
 * Enable/disable emergency bell
 * Body: { enabled: boolean }
 */
router.put("/emergency/enable", emergencyController.setStatus);

/**
 * PUT /emergency/config
 * Update emergency bell configuration
 * Body: { repeatCount: number, repeatInterval: number, duration: number, etc. }
 */
router.put("/emergency/config", emergencyController.updateConfig);

module.exports = router;
