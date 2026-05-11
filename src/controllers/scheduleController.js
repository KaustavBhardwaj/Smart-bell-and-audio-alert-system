const { validateFilename } = require("../utils/validation");
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  updateSchedule
} = require("../services/scheduleService");

function listSchedules(req, res) {
  try {
    const schedules = getSchedules();
    res.json({ count: schedules.length, schedules });
  } catch (err) {
    res.status(500).json({ error: "Failed to list schedules", details: err.message });
  }
}

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

function addSchedule(req, res) {
  try {
    const {
      id,
      filename,
      text,
      time,
      days = [],
      repeat = false
    } = req.body;

    // Validate ID
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({ error: "schedule id is required" });
    }

    // Validate either filename or text is provided
    if (!filename && !text) {
      return res.status(400).json({ error: "either filename or text is required" });
    }

    // Validate filename if provided
    if (filename) {
      const validation = validateFilename(filename);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Validate text length if provided
    if (text && text.length > 5000) {
      return res.status(400).json({ error: "text is too long (max 5000 characters)" });
    }

    // Validate time format
    if (!time || !time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "time must be in HH:MM format" });
    }

    // Validate days if provided
    if (days && days.length > 0) {
      const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const invalidDays = days.filter(d => !validDays.includes(d.toLowerCase()));
      if (invalidDays.length > 0) {
        return res.status(400).json({ error: `invalid days: ${invalidDays.join(", ")}` });
      }
    }

    const schedule = createSchedule({
      id,
      filename,
      text,
      time,
      days: days.length > 0 ? days.map(d => d.toLowerCase()) : [],
      repeat,
      playText: !!text
    });

    res.status(201).json({
      created: true,
      schedule
    });
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to create schedule", details: err.message });
  }
}

function editSchedule(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate time if provided
    if (updates.time && !updates.time.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({ error: "time must be in HH:MM format" });
    }

    // Validate days if provided
    if (updates.days && updates.days.length > 0) {
      const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const invalidDays = updates.days.filter(d => !validDays.includes(d.toLowerCase()));
      if (invalidDays.length > 0) {
        return res.status(400).json({ error: `invalid days: ${invalidDays.join(", ")}` });
      }
    }

    const schedule = updateSchedule(id, updates);
    res.json({ updated: true, schedule });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to update schedule", details: err.message });
  }
}

function removeSchedule(req, res) {
  try {
    const { id } = req.params;
    deleteSchedule(id);
    res.json({ deleted: true, id });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to delete schedule", details: err.message });
  }
}

module.exports = {
  listSchedules,
  getSchedule,
  addSchedule,
  editSchedule,
  removeSchedule
};
