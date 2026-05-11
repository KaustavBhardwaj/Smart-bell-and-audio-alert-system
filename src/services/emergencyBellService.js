const fs = require("fs");
const path = require("path");
const { publishBellOn, publishEmergency, publishBellOff } = require("./mqttService");

const EMERGENCY_PATH = path.join(__dirname, "../data/emergencySchedule.json");

/**
 * Load emergency bell configuration
 */
function loadEmergencyBell() {
  try {
    if (fs.existsSync(EMERGENCY_PATH)) {
      const data = fs.readFileSync(EMERGENCY_PATH, "utf-8");
      return JSON.parse(data).emergencyBell || null;
    }
  } catch (err) {
    console.error("Error loading emergency bell:", err.message);
  }
  return null;
}

/**
 * Save emergency bell configuration
 */
function saveEmergencyBell(config) {
  try {
    fs.writeFileSync(EMERGENCY_PATH, JSON.stringify({ emergencyBell: config }, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving emergency bell:", err.message);
    return false;
  }
}

/**
 * Get emergency bell status
 */
function getEmergencyBellStatus() {
  const bell = loadEmergencyBell();
  return {
    ...bell,
    isEnabled: bell?.enabled || false,
    lastTriggeredAt: bell?.lastTriggeredAt || null
  };
}

/**
 * Trigger emergency bell - sends immediate signal to bell node
 */
function triggerEmergencyBell() {
  const bell = loadEmergencyBell();

  if (!bell?.enabled) {
    throw new Error("Emergency bell is not enabled");
  }

  try {
    // Publish emergency signal via MQTT
    publishEmergency();

    // Update last triggered time
    bell.lastTriggeredAt = new Date().toISOString();
    saveEmergencyBell(bell);

    console.log("[EMERGENCY] Emergency bell triggered!");
    return {
      success: true,
      message: "Emergency bell triggered",
      triggeredAt: bell.lastTriggeredAt,
      repeatCount: bell.repeatCount,
      repeatInterval: bell.repeatInterval
    };
  } catch (err) {
    console.error("[EMERGENCY] Failed to trigger emergency bell:", err.message);
    throw err;
  }
}

/**
 * Enable/Disable emergency bell
 */
function setEmergencyBellStatus(enabled) {
  const bell = loadEmergencyBell();

  if (!bell) {
    throw new Error("Emergency bell configuration not found");
  }

  bell.enabled = enabled;
  saveEmergencyBell(bell);

  // ✅ ADD THIS BLOCK
  if (!enabled) {
    publishBellOff();   // ← THIS STOPS THE BELL IMMEDIATELY
    console.log("[EMERGENCY] Stop signal sent");
  }

  console.log(`[EMERGENCY] Bell ${enabled ? "enabled" : "disabled"}`);
  return bell;
}

/**
 * Update emergency bell configuration
 */
function updateEmergencyBellConfig(updates) {
  const bell = loadEmergencyBell();

  if (!bell) {
    throw new Error("Emergency bell configuration not found");
  }

  Object.assign(bell, updates, {
    updatedAt: new Date().toISOString()
  });

  saveEmergencyBell(bell);
  console.log("[EMERGENCY] Configuration updated");
  return bell;
}

function stopEmergencyBell() {
  const bell = loadEmergencyBell();

  publishBellOff();

  if (bell) {
    bell.lastStoppedAt = new Date().toISOString();
    saveEmergencyBell(bell);
  }

  console.log("[EMERGENCY] Emergency bell stopped");

  return {
    success: true,
    message: "Emergency bell stopped",
    stoppedAt: bell?.lastStoppedAt || new Date().toISOString()
  };
}

module.exports = {
  loadEmergencyBell,
  saveEmergencyBell,
  getEmergencyBellStatus,
  triggerEmergencyBell,
  stopEmergencyBell,
  setEmergencyBellStatus,
  updateEmergencyBellConfig
};
