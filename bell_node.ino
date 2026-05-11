#include <WiFi.h>
#include <PubSubClient.h>
#include "time.h"

// ---------- WIFI ----------
const char* ssid = "LAPTOP";
const char* password = "kk123456";

// ---------- MQTT ----------
const char* mqtt_server = "broker.hivemq.com";
WiFiClient espClient;
PubSubClient client(espClient);

// ---------- BUZZER ----------
#define BUZZER 5

// ---------- TIME ----------
const char* ntpServer = "pool.ntp.org";
long gmtOffset_sec = 19800;
int daylightOffset_sec = 0;

// ---------- BELL ----------
bool bellActive = false;
unsigned long bellStart = 0;
int bellDuration = 5;
bool isEmergency = false;
int emergencyRepeatCount = 0;

// ---------- STATUS ----------
unsigned long lastStatusTime = 0;
int statusInterval = 5000;

// ---------- DEBUG ----------
unsigned long lastLog = 0;

// ---------- SCHEDULE ----------
#define MAX_SCHEDULES 10
int bellHour[MAX_SCHEDULES];
int bellMinute[MAX_SCHEDULES];
int totalSchedules = 0;

// =============================
// BELL CONTROL
// =============================
void startBell() {
  Serial.println("BELL ON");
  digitalWrite(BUZZER, HIGH);
  bellActive = true;
  bellStart = millis();
}

void stopBell() {
  Serial.println("BELL OFF");
  digitalWrite(BUZZER, LOW);
  bellActive = false;
}

// =============================
// STATUS SYSTEM
// =============================
void sendStatus() {
  if (bellActive) {
    client.publish("school/status/bell", "ACTIVE");
  } else {
    client.publish("school/status/bell", "IDLE");
  }
}

// =============================
// MQTT CALLBACK
// =============================
void callback(char* topic, byte* payload, unsigned int length) {

  String message = "";

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("[MQTT] Received: " + message);

  if (message == "ON") {
    startBell();
    isEmergency = false;
  }
  else if (message == "OFF") {
    stopBell();
    isEmergency = false;
    emergencyRepeatCount = 0;
  }
  else if (message == "EMERGENCY") {
    Serial.println("[EMERGENCY] Emergency bell triggered!");
    isEmergency = true;
    emergencyRepeatCount = 3; // Ring 3 times
    startBell();
  }
}

// =============================
// WIFI CONNECT
// =============================
void setup_wifi() {

  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());
}

// =============================
// MQTT CONNECT
// =============================
void reconnect() {

  while (!client.connected()) {

    Serial.print("Connecting MQTT...");

    String clientId = "ESP32-Bell-" + String(random(1000, 9999));

    if (client.connect(clientId.c_str())) {
      Serial.println("MQTT connected");

      client.subscribe("school/bell");

      // 🔥 IMPORTANT: Sync status after reconnect
      sendStatus();

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying...");
      delay(2000);
    }
  }
}

// =============================
// CHECK SCHEDULE
// =============================
void checkSchedule() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) return;

  int currentHour = timeinfo.tm_hour;
  int currentMinute = timeinfo.tm_min;
  int currentSecond = timeinfo.tm_sec;

  if (currentSecond != 0) return;

  for (int i = 0; i < totalSchedules; i++) {

    if (bellHour[i] == currentHour &&
        bellMinute[i] == currentMinute) {

      startBell();

      Serial.printf("Bell Ringing %02d:%02d\n",
                    currentHour, currentMinute);
    }
  }
}

// =============================
// HANDLE AUTO STOP & EMERGENCY REPEAT
// =============================
void handleBell() {

  if (bellActive &&
      millis() - bellStart >= bellDuration * 1000UL) {

    if (isEmergency && emergencyRepeatCount > 0) {
      // Emergency bell - repeat
      emergencyRepeatCount--;
      bellStart = millis();
      Serial.printf("[EMERGENCY] Repeating... %d times left\n", emergencyRepeatCount);
    } else {
      // Normal bell - stop
      stopBell();
      isEmergency = false;
    }
  }
}

// =============================
// SETUP
// =============================
void setup() {

  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  setup_wifi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  Serial.println("Smart Bell Ready");
}

// =============================
// LOOP
// =============================
void loop() {

  // 🔥 WIFI RECONNECT (CRITICAL)
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }

    Serial.println("\nWiFi Reconnected");
  }

  // MQTT
  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  checkSchedule();
  handleBell();

  // 🔥 STATUS SYSTEM
  if (millis() - lastStatusTime > statusInterval) {
    lastStatusTime = millis();
    sendStatus();
  }

  // 🔥 DEBUG LOG
  if (millis() - lastLog > 3000) {
    lastLog = millis();
    Serial.println("Running... Bell Active: " + String(bellActive));
  }
}