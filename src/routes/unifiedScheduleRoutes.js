const express = require("express");
const router = express.Router();
const {
  listSchedules,
  getSchedule,
  addBellSchedule,
  addAnnouncementSchedule,
  addTTSSchedule,
  updateScheduleHandler,
  deleteScheduleHandler,
  toggleSchedule,
  getAvailableAudioFiles,
  deleteAvailableAudioFile
} = require("../controllers/unifiedScheduleController");

// =============================
// SCHEDULE MANAGEMENT
// =============================



/**
 * GET /api/schedules
 * List all schedules (grouped by type)
 */
router.get("/api/schedules", listSchedules);

/**
 * GET /api/schedules/:id
 * Get specific schedule by ID
 */
router.get("/api/schedules/files/available", getAvailableAudioFiles);
router.delete("/api/schedules/files/:id", deleteAvailableAudioFile);

router.get("/api/schedules/:id", getSchedule);

// =============================
// CREATE SCHEDULES BY TYPE
// =============================

/**
 * POST /api/schedules/bell
 * Create a bell schedule
 * Body: { id, name?, time: "HH:MM", days: [], duration?: 5, enabled?: true }
 */
router.post("/api/schedules/bell", addBellSchedule);

/**
 * POST /api/schedules/announcement
 * Create an announcement schedule (play audio file)
 * Body: { id, name?, filename, time: "HH:MM", days: [], enabled?: true }
 */
router.post("/api/schedules/announcement", addAnnouncementSchedule);

/**
 * POST /api/schedules/tts
 * Create a TTS announcement schedule
 * Body: { id, name?, text, time: "HH:MM", days: [], enabled?: true }
 */
router.post("/api/schedules/tts", addTTSSchedule);

// =============================
// UPDATE/DELETE
// =============================

/**
 * PUT /api/schedules/:id
 * Update a schedule
 */
router.put("/api/schedules/:id", updateScheduleHandler);

/**
 * DELETE /api/schedules/:id
 * Delete a schedule
 */
router.delete("/api/schedules/:id", deleteScheduleHandler);

/**
 * POST /api/schedules/:id/toggle
 * 
 * Enable/disable a schedule
 */

router.post("/api/schedules/:id/toggle", toggleSchedule);

// =============================
// AUDIO FILES
// =============================

/**
 * GET /api/schedules/files/available
 * Get list of available audio files for announcements
 */


module.exports = router;
