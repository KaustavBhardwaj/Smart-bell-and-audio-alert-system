const fs = require("fs");
const path = require("path");
const { publishBellOn } = require("./mqttService");

const schedulesPath = path.join(__dirname, "../data/bellSchedules.json");

const triggeredMap = new Set();

function getTodayName(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function getCurrentTime(date) {
  return date.toTimeString().slice(0, 5); // HH:MM
}

function loadSchedules() {
  if (!fs.existsSync(schedulesPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(schedulesPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read bell schedules:", error.message);
    return [];
  }
}

function saveSchedules(schedules) {
  fs.writeFileSync(schedulesPath, JSON.stringify(schedules, null, 2));
}

function triggerBellSchedule(schedule) {
  console.log(`Scheduled bell triggered: ${schedule.title} at ${schedule.time}`);
  publishBellOn();
}

function checkBellSchedules() {
  const schedules = loadSchedules();
  const now = new Date();

  const today = getTodayName(now);
  const currentTime = getCurrentTime(now);
  const currentDate = now.toISOString().slice(0, 10);

  for (const schedule of schedules) {
    const runKey = `${schedule.id}_${currentDate}_${currentTime}`;

    const shouldRun =
      schedule.enabled &&
      schedule.days.includes(today) &&
      schedule.time === currentTime;

    if (shouldRun && !triggeredMap.has(runKey)) {
      triggeredMap.add(runKey);
      triggerBellSchedule(schedule);
    }
  }
}

function startBellScheduler() {
  console.log("Bell scheduler started");
  setInterval(() => {
    checkBellSchedules();
  }, 10000); // every 10 sec
}

function getAllBellSchedules() {
  return loadSchedules();
}

function addBellSchedule(schedule) {
  const schedules = loadSchedules();

  const newSchedule = {
    id: Date.now(),
    title: schedule.title,
    time: schedule.time,
    days: schedule.days,
    enabled: schedule.enabled ?? true,
  };

  schedules.push(newSchedule);
  saveSchedules(schedules);

  return newSchedule;
}

function deleteBellSchedule(id) {
  const schedules = loadSchedules();
  const filtered = schedules.filter((item) => String(item.id) !== String(id));

  saveSchedules(filtered);
  return filtered;
}

function toggleBellSchedule(id) {
  const schedules = loadSchedules();

  const updated = schedules.map((item) => {
    if (String(item.id) === String(id)) {
      return { ...item, enabled: !item.enabled };
    }
    return item;
  });

  saveSchedules(updated);
  return updated.find((item) => String(item.id) === String(id));
}

module.exports = {
  startBellScheduler,
  getAllBellSchedules,
  addBellSchedule,
  deleteBellSchedule,
  toggleBellSchedule,
};