// const path = require("path");

// const ROOT_DIR = path.join(__dirname, "../..");

// module.exports = {
//   PORT: process.env.PORT || 3000,
//   SERVER_IP: process.env.SERVER_IP || "192.168.33.39",

//   MQTT_BROKER: process.env.MQTT_BROKER || "mqtt://broker.hivemq.com",
//   MQTT_TOPIC: process.env.MQTT_TOPIC || "school/audio",
//   BELL_MQTT_TOPIC: process.env.BELL_MQTT_TOPIC || "school/bell",

//   MEDIA_PATH: path.join(ROOT_DIR, "media"),
//   UPLOADS_PATH: path.join(ROOT_DIR, "uploads"),
// };



const path = require("path");

const ROOT_DIR = path.join(__dirname, "../..");

module.exports = {
  PORT: process.env.PORT || 3000,

  PUBLIC_BASE_URL:
    process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  MQTT_BROKER: process.env.MQTT_BROKER || "mqtt://broker.hivemq.com",
  MQTT_USERNAME: process.env.MQTT_USERNAME || "",
  MQTT_PASSWORD: process.env.MQTT_PASSWORD || "",

  BELL_MQTT_TOPIC: process.env.BELL_MQTT_TOPIC || "school/bell",
  AUDIO_MQTT_TOPIC: process.env.AUDIO_MQTT_TOPIC || "school/audio",

  FFMPEG_PATH: process.env.FFMPEG_PATH || "ffmpeg",

  API_KEY: process.env.API_KEY || "",

  MEDIA_PATH: path.join(ROOT_DIR, "media"),
  UPLOADS_PATH: path.join(ROOT_DIR, "uploads"),
};