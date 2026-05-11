const fs = require("fs");
const path = require("path");
const { MEDIA_PATH } = require("../config/env");
const {
  getAllAudioFiles,
  deleteAudioFile
} = require("../services/audioFileService");

const { validateFilename } = require("../utils/validation");
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  updateSchedule
} = require("../services/scheduleService");
// const { getAllAudioFiles } = require("../services/audioFileService");  


async function deleteAvailableAudioFile(req, res) {
  try {
    const { id } = req.params;

    const deletedFile = await deleteAudioFile(id);

    const filePath = path.join(MEDIA_PATH, deletedFile.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      deleted: true,
      id,
      filename: deletedFile.filename,
      message: "Audio file deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      error: "Failed to delete audio file",
      details: err.message,
    });
  }
}

// =============================
// GET SCHEDULES
// =============================
function listSchedules(req, res) {
  try {
    const schedules = getSchedules();
    const grouped = {
      bells: schedules.filter(s => s.type === "bell"),
      announcements: schedules.filter(s => s.type === "announcement"),
      ttsAnnouncements: schedules.filter(s => s.type === "tts-announcement"),
      total: schedules.length
    };
    res.json({ count: schedules.length, grouped, schedules });
  } catch (err) {
    res.status(500).json({ error: "Failed to list schedules", details: err.message });
  }
}

// =============================
// GET SINGLE SCHEDULE
// =============================
function getSchedule(req, res) {
  try {
    const { id } = req.params;
    const schedule = getScheduleById(id);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: "Failed to get schedule", details: err.message });
  }
}

// =============================
// CREATE BELL SCHEDULE
// =============================
function addBellSchedule(req, res) {
  try {
    const { id, name, time, days = [], duration = 5, enabled = true } = req.body;

    // Validate
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({ error: "schedule id is required" });
    }

    if (!time || !time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "time must be HH:MM format" });
    }

    const schedule = createSchedule({
      id,
      name: name || id,
      type: "bell",
      time,
      days,
      enabled,
      duration
    });

    res.status(201).json({ message: "Bell schedule created", schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// CREATE ANNOUNCEMENT SCHEDULE
// =============================
function addAnnouncementSchedule(req, res) {
  try {
    const { id, name, filename, time, days = [], enabled = true } = req.body;

    // Validate
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({ error: "schedule id is required" });
    }

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ error: "filename is required" });
    }

    const validation = validateFilename(filename);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!time || !time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "time must be HH:MM format" });
    }

    const schedule = createSchedule({
      id,
      name: name || id,
      type: "announcement",
      filename,
      time,
      days,
      enabled
    });

    res.status(201).json({ message: "Announcement schedule created", schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// CREATE TTS ANNOUNCEMENT SCHEDULE
// =============================
function addTTSSchedule(req, res) {
  try {
    const { id, name, text, language = "en", time, days = [], enabled = true } = req.body;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({ error: "schedule id is required" });
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required for TTS" });
    }

    if (!time || !time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "time must be HH:MM format" });
    }

    const schedule = createSchedule({
      id,
      name: name || id,
      type: "tts-announcement",
      text,
      language,
      time,
      days,
      enabled
    });

    res.status(201).json({ message: "TTS announcement schedule created", schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// UPDATE SCHEDULE
// =============================
function updateScheduleHandler(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = updateSchedule(id, updates);
    res.json({ message: "Schedule updated", schedule: updated });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

// =============================
// DELETE SCHEDULE
// =============================
function deleteScheduleHandler(req, res) {
  try {
    const { id } = req.params;
    deleteSchedule(id);
    res.json({ message: "Schedule deleted", id });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

// =============================
// TOGGLE SCHEDULE ENABLED/DISABLED
// =============================
function toggleSchedule(req, res) {
  try {
    const { id } = req.params;
    const schedule = getScheduleById(id);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const updated = updateSchedule(id, { enabled: !schedule.enabled });
    res.json({ 
      message: `Schedule ${updated.enabled ? "enabled" : "disabled"}`, 
      schedule: updated 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// GET AVAILABLE AUDIO FILES
// =============================
async function getAvailableAudioFiles(req, res) {
  try {
    const files = await getAllAudioFiles();

    res.json({
      count: files.length,
      files,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to get audio files",
      details: err.message,
    });
  }
}

module.exports = {
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
};
