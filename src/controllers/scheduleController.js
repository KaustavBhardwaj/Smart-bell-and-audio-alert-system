const { validateFilename } = require("../utils/validation");

const {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  updateSchedule,
} = require("../services/scheduleService");

async function listSchedules(req, res) {
  try {
    const schedules = await getSchedules();

    res.json({
      count: schedules.length,
      schedules,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to list schedules",
      details: err.message,
    });
  }
}

async function getSchedule(req, res) {
  try {
    const { id } = req.params;

    const schedule = await getScheduleById(id);

    if (!schedule) {
      return res.status(404).json({
        error: "Schedule not found",
      });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({
      error: "Failed to get schedule",
      details: err.message,
    });
  }
}

async function addSchedule(req, res) {
  try {
    const {
      id,
      name,
      filename,
      text,
      language = "en",
      time,
      days = [],
      repeat = false,
      enabled = true,
    } = req.body;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({
        error: "schedule id is required",
      });
    }

    if (!filename && !text) {
      return res.status(400).json({
        error: "either filename or text is required",
      });
    }

    if (filename) {
      const validation = validateFilename(filename);

      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
        });
      }
    }

    if (text && text.length > 5000) {
      return res.status(400).json({
        error: "text is too long, max 5000 characters",
      });
    }

    if (!time || !time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({
        error: "time must be in HH:MM format",
      });
    }

    if (days && days.length > 0) {
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      const invalidDays = days.filter(
        (d) => !validDays.includes(String(d).toLowerCase())
      );

      if (invalidDays.length > 0) {
        return res.status(400).json({
          error: `invalid days: ${invalidDays.join(", ")}`,
        });
      }
    }

    const scheduleType = filename ? "announcement" : "tts-announcement";

    const schedule = await createSchedule({
      id,
      name: name || id,
      type: scheduleType,
      filename: filename || null,
      text: text || null,
      language,
      time,
      days: days.length > 0 ? days.map((d) => String(d).toLowerCase()) : [],
      repeat,
      enabled,
    });

    res.status(201).json({
      created: true,
      schedule,
    });
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({
        error: err.message,
      });
    }

    res.status(500).json({
      error: "Failed to create schedule",
      details: err.message,
    });
  }
}

async function editSchedule(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.time && !updates.time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({
        error: "time must be in HH:MM format",
      });
    }

    if (updates.days && updates.days.length > 0) {
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      const invalidDays = updates.days.filter(
        (d) => !validDays.includes(String(d).toLowerCase())
      );

      if (invalidDays.length > 0) {
        return res.status(400).json({
          error: `invalid days: ${invalidDays.join(", ")}`,
        });
      }

      updates.days = updates.days.map((d) => String(d).toLowerCase());
    }

    const schedule = await updateSchedule(id, updates);

    res.json({
      updated: true,
      schedule,
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        error: err.message,
      });
    }

    res.status(500).json({
      error: "Failed to update schedule",
      details: err.message,
    });
  }
}

async function removeSchedule(req, res) {
  try {
    const { id } = req.params;

    await deleteSchedule(id);

    res.json({
      deleted: true,
      id,
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        error: err.message,
      });
    }

    res.status(500).json({
      error: "Failed to delete schedule",
      details: err.message,
    });
  }
}

module.exports = {
  listSchedules,
  getSchedule,
  addSchedule,
  editSchedule,
  removeSchedule,
};