const {
  getEmergencyBellStatus,
  triggerEmergencyBell,
  stopEmergencyBell,
  setEmergencyBellStatus,
  updateEmergencyBellConfig
} = require("../services/emergencyBellService");

// =============================
// GET EMERGENCY BELL STATUS
// =============================
function getStatus(req, res) {
  try {
    const status = getEmergencyBellStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to get status", details: err.message });
  }
}

// =============================
// TRIGGER EMERGENCY BELL
// =============================
function trigger(req, res) {
  try {
    const result = triggerEmergencyBell();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// ENABLE/DISABLE EMERGENCY BELL
// =============================
function setStatus(req, res) {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be boolean" });
    }

    const bell = setEmergencyBellStatus(enabled);
    res.json({ 
      message: `Emergency bell ${enabled ? "enabled" : "disabled"}`, 
      bell 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}



function stop(req, res) {
  try {
    const result = stopEmergencyBell();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================
// UPDATE CONFIGURATION
// =============================
function updateConfig(req, res) {
  try {
    const updates = req.body;
    const bell = updateEmergencyBellConfig(updates);
    res.json({ message: "Configuration updated", bell });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getStatus,
  trigger,
  stop,
  setStatus,
  updateConfig
};