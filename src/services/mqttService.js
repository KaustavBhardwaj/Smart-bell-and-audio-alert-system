const client = require("../config/mqtt");
const { BELL_MQTT_TOPIC } = require("../config/env");

const AUDIO_TOPICS = {
  node1: "school/audio/node1",
  node2: "school/audio/node2",
  all: "school/audio/all",
};

function getAudioTopic(target = "all") {
  return AUDIO_TOPICS[target] || AUDIO_TOPICS.all;
}

function publishPlayUrl(url, target = "all") {
  const message = `PLAY_URL|${url}`;
  const topic = getAudioTopic(target);

  console.log("[MQTT] Publishing audio:", message);
  console.log("[MQTT] Target:", target);
  console.log("[MQTT] Topic:", topic);

  client.publish(topic, message);
}

function publishStop(target = "all") {
  const topic = getAudioTopic(target);
  console.log("[MQTT] Publishing STOP to:", topic);
  client.publish(topic, "STOP");
}

function publishVolume(volume, target = "all") {
  const message = `VOLUME|${Math.max(0, Math.min(100, volume))}`;
  const topic = getAudioTopic(target);

  console.log("[MQTT] Publishing volume to:", topic);
  client.publish(topic, message);
}

function publishBellOn() {
  client.publish(BELL_MQTT_TOPIC, "ON");
}

function publishBellOff() {
  client.publish(BELL_MQTT_TOPIC, "OFF");
}

function publishEmergency() {
  client.publish(BELL_MQTT_TOPIC, "EMERGENCY");
}

function isMqttConnected() {
  return client.connected;
}

module.exports = {
  publishPlayUrl,
  publishStop,
  publishVolume,
  publishBellOn,
  publishBellOff,
  publishEmergency,
  isMqttConnected,
};