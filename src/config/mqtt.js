const mqtt = require("mqtt");
const { MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD } = require("./env");

const options = {
  reconnectPeriod: 1000,
  connectTimeout: 5000,
};

if (MQTT_USERNAME && MQTT_PASSWORD) {
  options.username = MQTT_USERNAME;
  options.password = MQTT_PASSWORD;
}

const client = mqtt.connect(MQTT_BROKER, options);

client.on("connect", () => {
  console.log("MQTT connected successfully");
});

client.on("error", (err) => {
  console.error("MQTT error:", err.message);
});

client.on("offline", () => {
  console.warn("MQTT client offline");
});

module.exports = client;