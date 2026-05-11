const path = require("path");
const cron = require("node-cron");

const { playFile } = require("./audioService");
const { publishBellOn, publishPlayUrl } = require("./mqttService");
const { textToSpeech } = require("./ttsService");

const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");

const Schedule = require("../models/Schedule");

const jobs = {};

// Convert time (HH:MM) to cron format
function timeToCronExpression(time, days = null) {
  const [hour, minute] = time.split(":");

  if (days && days.length > 0 && !days.includes("everyday")) {
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
      .map((d) => dayMap[String(d).toLowerCase()])
      .filter((d) => d !== undefined);

    if (dayNumbers.length > 0) {
      return `${minute} ${hour} * * ${dayNumbers.join(",")}`;
    }
  }

  return `${minute} ${hour} * * *`;
}

// Create schedule: bell, announcement, or TTS announcement
async function createSchedule(scheduleData) {
  const {
    id,
    name,
    type,
    filename,
    text,
    language = "en",
    time,
    days = [],
    repeat = true,
    enabled = true,
    duration,
  } = scheduleData;

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

  const existing = await Schedule.findOne({ id });

  if (existing) {
    throw new Error("Schedule with this ID already exists");
  }

  const finalDays = days.length > 0 ? days : ["everyday"];
  const cronExpression = timeToCronExpression(time, finalDays);

  const schedule = await Schedule.create({
    id,
    name: name || id,
    type,
    filename: filename || null,
    text: text || null,
    language,
    time,
    days: finalDays,
    repeat,
    enabled,
    duration: duration || null,
    cronExpression,
  });

  if (enabled) {
    scheduleJob(schedule);
  }

  console.log(`[SCHEDULE] Created ${type} schedule: ${id}`);
  return schedule;
}

// Schedule cron job
function scheduleJob(schedule) {
  const { id, type, cronExpression, filename, text, language } = schedule;

  try {
    if (jobs[id]) {
      jobs[id].stop();
      delete jobs[id];
    }

    jobs[id] = cron.schedule(cronExpression, async () => {
      console.log(`[SCHEDULE] Running scheduled job: ${id} (${type})`);

      try {
        if (type === "bell") {
          console.log(`[SCHEDULE] Triggering bell: ${id}`);
          publishBellOn();
        }

        else if (type === "announcement") {
          if (filename) {
            const url = playFile(filename);
            console.log(`[SCHEDULE] Triggered file playback: ${url}`);
          }
        }

        else if (type === "tts-announcement") {
          if (text) {
            console.log(`[SCHEDULE] Triggering TTS: "${text}"`);

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

    console.log(`[SCHEDULE] Registered: ${id} at ${cronExpression} (${type})`);
    return true;
  } catch (err) {
    console.error(`[SCHEDULE] Error scheduling job ${id}:`, err.message);
    return false;
  }
}

// Get all schedules
async function getSchedules() {
  return await Schedule.find({}).sort({ createdAt: -1 });
}

// Get schedule by ID
async function getScheduleById(id) {
  return await Schedule.findOne({ id });
}

// Delete schedule
async function deleteSchedule(id) {
  const schedule = await Schedule.findOne({ id });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  if (jobs[id]) {
    jobs[id].stop();
    delete jobs[id];
  }

  await Schedule.deleteOne({ id });

  console.log(`[SCHEDULE] Deleted schedule: ${id}`);
  return true;
}

// Update schedule
async function updateSchedule(id, updates) {
  const schedule = await Schedule.findOne({ id });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const oldEnabled = schedule.enabled;

  Object.assign(schedule, updates);

  if (updates.time || updates.days) {
    const finalDays =
      schedule.days && schedule.days.length > 0
        ? schedule.days
        : ["everyday"];

    schedule.days = finalDays;
    schedule.cronExpression = timeToCronExpression(schedule.time, finalDays);
  }

  await schedule.save();

  if (schedule.enabled === false) {
    if (jobs[id]) {
      jobs[id].stop();
      delete jobs[id];
      console.log(`[SCHEDULE] Stopped job for ${id}`);
    }
  } else if (
    schedule.enabled === true &&
    (!oldEnabled || updates.time || updates.days)
  ) {
    scheduleJob(schedule);
    console.log(`[SCHEDULE] Started/updated job for ${id}`);
  }

  return schedule;
}

// Initialize all enabled schedules from MongoDB
async function initializeSchedules() {
  const schedules = await Schedule.find({ enabled: true });

  let count = 0;
  let bellCount = 0;
  let announcementCount = 0;
  let ttsCount = 0;

  schedules.forEach((schedule) => {
    const result = scheduleJob(schedule);

    if (result) {
      count++;

      if (schedule.type === "bell") bellCount++;
      else if (schedule.type === "announcement") announcementCount++;
      else if (schedule.type === "tts-announcement") ttsCount++;
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
  scheduleJob,
};