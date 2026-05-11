const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { playFile } = require("./audioService");
const { publishBellOn, publishPlayUrl } = require("./mqttService");
const { textToSpeech } = require("./ttsService");
const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");

const SCHEDULES_FILE = path.join(__dirname, "../data/schedules.json");
const jobs = {}; // Store active cron jobs

// Load schedules from file
function loadSchedules() {
  try {
    if (fs.existsSync(SCHEDULES_FILE)) {
      const data = fs.readFileSync(SCHEDULES_FILE, "utf-8");
      return JSON.parse(data).schedules || [];
    }
  } catch (err) {
    console.error("Error loading schedules:", err.message);
  }
  return [];
}

// Save schedules to file
function saveSchedules(schedules) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify({ schedules }, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving schedules:", err.message);
    return false;
  }
}

// Convert time (HH:MM) to cron format (minute hour * * *)
function timeToCronExpression(time, days = null) {
  const [hour, minute] = time.split(":");

  if (days && days.length > 0) {
    // Map day names to cron day numbers (0=Sunday, 1=Monday, etc.)
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const dayNumbers = days
      .map((d) => dayMap[d.toLowerCase()])
      .filter((d) => d !== undefined);

    if (dayNumbers.length > 0) {
      const dayList = dayNumbers.join(",");
      return `${minute} ${hour} * * ${dayList}`;
    }
  }

  return `${minute} ${hour} * * *`; // Every day
}

// Create a unified schedule (bell or announcement)
function createSchedule(scheduleData) {
  const {
    id,
    name,
    type, // "bell", "announcement", "tts-announcement"
    filename,
    text,
    language = "en",
    time,
    days = [],
    repeat = true,
    enabled = true,
    duration,
  } = scheduleData;

  // Validation
  if (!id) {
    throw new Error("Schedule ID is required");
  }

  if (!type || !["bell", "announcement", "tts-announcement"].includes(type)) {
    throw new Error("Type must be 'bell', 'announcement', or 'tts-announcement'");
  }

  if (type === "announcement" && !filename) {
    throw new Error("filename is required for announcement schedule");
  }

  if (type === "tts-announcement" && !text) {
    throw new Error("text is required for TTS schedule");
  }

  if (!time || !time.match(/^\d{2}:\d{2}$/)) {
    throw new Error("Time must be in HH:MM format");
  }

  // Get existing schedules
  const schedules = loadSchedules();

  // Check if ID already exists
  if (schedules.some((s) => s.id === id)) {
    throw new Error("Schedule with this ID already exists");
  }

  // Create cron expression
  const cronExpression = timeToCronExpression(time, days);

  const schedule = {
    id,
    name: name || id,
    type,
    filename: filename || null,
    text: text || null,
    language: language || "en",
    time,
    days: days.length > 0 ? days : ["everyday"],
    repeat,
    enabled,
    duration: duration || null,
    cronExpression,
    createdAt: new Date().toISOString(),
  };

  // Schedule the job if enabled
  if (enabled) {
    scheduleJob(schedule);
  }

  // Save to file
  schedules.push(schedule);
  saveSchedules(schedules);

  console.log(`[SCHEDULE] Created ${type} schedule: ${id}`);
  return schedule;
}

// Schedule a job using cron - handles bell, file announcement, and TTS announcement schedules
function scheduleJob(schedule) {
  const { id, type, cronExpression, filename, text, language } = schedule;

  try {
    // Cancel existing job if any
    if (jobs[id]) {
      jobs[id].stop();
      delete jobs[id];
    }

    // Create new cron job
    jobs[id] = cron.schedule(cronExpression, async () => {
      console.log(`[SCHEDULE] Running scheduled job: ${id} (type: ${type})`);

      try {
        if (type === "bell") {
          // Trigger bell via MQTT to bell node
          console.log(`[SCHEDULE] Triggering bell: ${id}`);
          publishBellOn();
        } else if (type === "announcement") {
          // Play audio file to audio node
          if (filename) {
            const url = playFile(filename);
            console.log(`[SCHEDULE] Triggered file playback: ${url}`);
          }
        } else if (type === "tts-announcement") {
          // Generate WAV from TTS and publish its URL to audio node
          if (text) {
            console.log(`[SCHEDULE] Triggering TTS announcement: "${text}"`);

            const baseName = sanitizeBaseName(`tts_schedule_${id}`);
            const timestamp = Date.now();
            const outputFilename = `${baseName}_${timestamp}.wav`;
            const outputPath = path.join(MEDIA_PATH, outputFilename);

            await textToSpeech(
              text,
              outputPath,
              language || "en",
              1.0,
              true
            );

            const fileUrl = `${PUBLIC_BASE_URL}/media/${outputFilename}`;
            publishPlayUrl(fileUrl);

            console.log(`[SCHEDULE] TTS generated and published: ${fileUrl}`);
          }
        }
      } catch (err) {
        console.error(`[SCHEDULE] Failed to execute ${id}:`, err.message);
      }
    });

    console.log(
      `[SCHEDULE] Registered: ${id} at ${cronExpression} (type: ${type})`
    );
    return true;
  } catch (err) {
    console.error(`[SCHEDULE] Error scheduling job ${id}:`, err.message);
    return false;
  }
}

// Get all schedules
function getSchedules() {
  return loadSchedules();
}

// Get schedule by ID
function getScheduleById(id) {
  const schedules = loadSchedules();
  return schedules.find((s) => s.id === id);
}

// Delete schedule
function deleteSchedule(id) {
  const schedules = loadSchedules();
  const index = schedules.findIndex((s) => s.id === id);

  if (index === -1) {
    throw new Error("Schedule not found");
  }

  // Stop cron job
  if (jobs[id]) {
    jobs[id].stop();
    delete jobs[id];
  }

  // Remove from array and save
  schedules.splice(index, 1);
  saveSchedules(schedules);

  console.log(`[SCHEDULE] Deleted schedule: ${id}`);
  return true;
}

// Update schedule
function updateSchedule(id, updates) {
  const schedules = loadSchedules();
  const schedule = schedules.find((s) => s.id === id);

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const oldEnabled = schedule.enabled;

  Object.assign(schedule, updates, {
    updatedAt: new Date().toISOString(),
  });

  if (updates.time || updates.days) {
    schedule.cronExpression = timeToCronExpression(
      schedule.time,
      schedule.days
    );
  }

  // stop job if disabled
  if (schedule.enabled === false) {
    if (jobs[id]) {
      jobs[id].stop();
      delete jobs[id];
      console.log(`[SCHEDULE] Stopped job for ${id}`);
    }
  }
  // start or restart job if enabled
  else if (
    schedule.enabled === true &&
    (!oldEnabled || updates.time || updates.days)
  ) {
    scheduleJob(schedule);
    console.log(`[SCHEDULE] Started/updated job for ${id}`);
  }

  saveSchedules(schedules);
  return schedule;
}

function initializeSchedules() {
  const schedules = loadSchedules();
  let count = 0;
  let bellCount = 0;
  let announcementCount = 0;
  let ttsCount = 0;

  schedules.forEach((schedule) => {
    if (schedule.enabled) {
      const result = scheduleJob(schedule);
      if (result) {
        count++;
        if (schedule.type === "bell") bellCount++;
        else if (schedule.type === "announcement") announcementCount++;
        else if (schedule.type === "tts-announcement") ttsCount++;
      }
    }
  });

  console.log(
    `[SCHEDULE] Initialized ${count} jobs - ${bellCount} bells, ${announcementCount} announcements, ${ttsCount} TTS`
  );
}

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  updateSchedule,
  initializeSchedules,
  loadSchedules,
  saveSchedules,
};