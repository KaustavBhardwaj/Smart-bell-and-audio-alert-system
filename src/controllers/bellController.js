const { publishBellOn, publishBellOff } = require("../services/mqttService");

function ringBell(req, res) {
  publishBellOn();
  res.json({
    sent: true,
    node: "bell",
    command: "ON"
  });
}

function stopBell(req, res) {
  publishBellOff();
  res.json({
    sent: true,
    node: "bell",
    command: "OFF"
  });
}

module.exports = {
  ringBell,
  stopBell,
};