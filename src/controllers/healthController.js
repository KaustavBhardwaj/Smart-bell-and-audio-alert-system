const { PUBLIC_BASE_URL } = require("../config/env");
const { isMqttConnected } = require("../services/mqttService");

function root(req, res) {
  res.send("Announcement server is running");
}

function health(req, res) {
  res.json({
    ok: true,
    server: PUBLIC_BASE_URL,
    mqtt: isMqttConnected(),
  });
}

module.exports = { root, health };