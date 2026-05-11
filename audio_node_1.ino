#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>

#include <PubSubClient.h>
#include "driver/i2s.h"

const char* ssid = "LAPTOP";
const char* password = "kk123456";

const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* mqttTopic = "school/audio/node1";

#define I2S_DOUT 25
#define I2S_BCLK 26
#define I2S_LRC  27

#define I2S_PORT I2S_NUM_0
#define SAMPLE_RATE 16000
#define BUFFER_SIZE 1024

// Volume control (0-100)
int audioVolume = 100;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

bool stopPlayback = false;
bool isPlaying = false;

void setupI2S() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = 0,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_LRC,
    .data_out_num = I2S_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);

  Serial.println("I2S initialized");
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  mqttClient.setServer(mqttServer, mqttPort);

  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32AudioNode-" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      mqttClient.subscribe(mqttTopic); 
      mqttClient.subscribe("school/audio/all");
      Serial.print("Subscribed to topic: ");
      Serial.println(mqttTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 2 sec");
      delay(2000);
    }
  }
}

bool readExact(Client& client, uint8_t* buffer, size_t len) {
  size_t totalRead = 0;
  unsigned long start = millis();

  while (totalRead < len) {
    if (client.available()) {
      int n = client.read(buffer + totalRead, len - totalRead);
      if (n > 0) {
        totalRead += n;
      }
    }

    if (!client.connected() && !client.available()) {
      return false;
    }

    if (millis() - start > 5000) {
      return false;
    }

    mqttClient.loop();
  }

  return true;
}

bool skipHTTPHeaders(Client& client) {
  String line;
  bool statusOk = false;

  while (client.connected()) {
    line = client.readStringUntil('\n');
    line.trim();

    if (line.startsWith("HTTP/1.1 200") || line.startsWith("HTTP/1.0 200")) {
      statusOk = true;
    }

    if (line.length() == 0) {
      break;
    }

    mqttClient.loop();
  }

  if (!statusOk) {
    Serial.println("HTTP response not OK");
    return false;
  }

  Serial.println("HTTP headers skipped");
  return true;
}

bool skipWavHeader(Client& client) {
  uint8_t header[44];

  if (!readExact(client, header, 44)) {
    Serial.println("Failed to read WAV header");
    return false;
  }

  if (!(header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F')) {
    Serial.println("Invalid WAV: missing RIFF");
    return false;
  }

  if (!(header[8] == 'W' && header[9] == 'A' && header[10] == 'V' && header[11] == 'E')) {
    Serial.println("Invalid WAV: missing WAVE");
    return false;
  }

  uint16_t audioFormat = header[20] | (header[21] << 8);
  uint16_t channels = header[22] | (header[23] << 8);
  uint32_t sampleRate = header[24] | (header[25] << 8) | (header[26] << 16) | (header[27] << 24);
  uint16_t bitsPerSample = header[34] | (header[35] << 8);

  Serial.println("WAV header read");
  Serial.print("Audio format: ");
  Serial.println(audioFormat);
  Serial.print("Channels: ");
  Serial.println(channels);
  Serial.print("Sample rate: ");
  Serial.println(sampleRate);
  Serial.print("Bits per sample: ");
  Serial.println(bitsPerSample);

  if (audioFormat != 1) {
    Serial.println("Unsupported WAV: only PCM supported");
    return false;
  }

  if (channels != 1) {
    Serial.println("Unsupported WAV: use mono");
    return false;
  }

  if (bitsPerSample != 16) {
    Serial.println("Unsupported WAV: use 16-bit");
    return false;
  }

  if (sampleRate != SAMPLE_RATE) {
    Serial.println("Sample rate mismatch. Use 16000 Hz.");
    return false;
  }

  return true;
}
bool parseUrl(const String& url, String& host, int& port, String& path, bool& isHttps) {
  isHttps = false;

  String temp;

  if (url.startsWith("https://")) {
    isHttps = true;
    temp = url.substring(8);
  } else if (url.startsWith("http://")) {
    isHttps = false;
    temp = url.substring(7);
  } else {
    Serial.println("Only http:// or https:// URLs supported");
    return false;
  }

  int slashIndex = temp.indexOf('/');
  if (slashIndex == -1) {
    Serial.println("Invalid URL path");
    return false;
  }

  String hostPort = temp.substring(0, slashIndex);
  path = temp.substring(slashIndex);

  int colonIndex = hostPort.indexOf(':');

  if (colonIndex == -1) {
    host = hostPort;
    port = isHttps ? 443 : 80;
  } else {
    host = hostPort.substring(0, colonIndex);
    port = hostPort.substring(colonIndex + 1).toInt();
  }

  return true;
}

void stopAudioNow() {
  stopPlayback = true;
  i2s_zero_dma_buffer(I2S_PORT);
  Serial.println("Stop requested");
}

void streamWavFromUrl(const String& url) {
  if (isPlaying) {
    Serial.println("Already playing, stopping previous audio");
    stopAudioNow();
    delay(100);
  }

  String host;
  String path;
  int port;
  bool isHttps;

  if (!parseUrl(url, host, port, path, isHttps)) {
    return;
  }

  WiFiClient normalClient;
  WiFiClientSecure secureClient;

  Client* httpClient;

  if (isHttps) {
    secureClient.setInsecure();
    httpClient = &secureClient;
  } else {
    httpClient = &normalClient;
  }

  stopPlayback = false;
  isPlaying = true;

  Serial.println("Starting playback from URL:");
  Serial.println(url);

  Serial.print("Connecting to server ");
  Serial.print(host);
  Serial.print(":");
  Serial.println(port);

  if (!httpClient->connect(host.c_str(), port)) {
    Serial.println("Server connection failed");
    isPlaying = false;
    return;
  }

  httpClient->print(String("GET ") + path + " HTTP/1.1\r\n" +
                    "Host: " + host + "\r\n" +
                    "Connection: close\r\n\r\n");

  Serial.println("HTTP/HTTPS request sent");

  if (!skipHTTPHeaders(*httpClient)) {
    httpClient->stop();
    isPlaying = false;
    return;
  }

  if (!skipWavHeader(*httpClient)) {
    httpClient->stop();
    isPlaying = false;
    return;
  }

  uint8_t buffer[BUFFER_SIZE];
  size_t bytesWritten;

  Serial.println("Starting WAV stream...");

  while ((httpClient->connected() || httpClient->available()) && !stopPlayback) {
    mqttClient.loop();

    int availableBytes = httpClient->available();

    if (availableBytes > 0) {
      int toRead = availableBytes;

      if (toRead > BUFFER_SIZE) {
        toRead = BUFFER_SIZE;
      }

      int bytesRead = httpClient->read(buffer, toRead);

      if (bytesRead > 0) {
        if (audioVolume < 100) {
          int16_t* samples = (int16_t*)buffer;
          int sampleCount = bytesRead / 2;

          for (int i = 0; i < sampleCount; i++) {
            int32_t adjusted = (int32_t)samples[i] * audioVolume / 100;

            if (adjusted > 32767) adjusted = 32767;
            if (adjusted < -32768) adjusted = -32768;

            samples[i] = (int16_t)adjusted;
          }
        }

        i2s_write(I2S_PORT, buffer, bytesRead, &bytesWritten, portMAX_DELAY);
      }
    } else {
      delay(1);
    }
  }

  httpClient->stop();
  i2s_zero_dma_buffer(I2S_PORT);

  if (stopPlayback) {
    Serial.println("Playback stopped");
  } else {
    Serial.println("WAV stream finished");
  }

  isPlaying = false;
  stopPlayback = false;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";

  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.print("[MQTT] Message on ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(msg);

  if (msg == "STOP") {
    Serial.println("[AUDIO] Stop requested");
    stopAudioNow();
    return;
  }

  // Handle volume control
  if (msg.startsWith("VOLUME|")) {
    String volumeStr = msg.substring(7);
    int volume = volumeStr.toInt();
    audioVolume = constrain(volume, 0, 100);
    Serial.print("[AUDIO] Volume set to ");
    Serial.print(audioVolume);
    Serial.println("%");
    return;
  }

  // Handle direct URL playback
  if (msg.startsWith("PLAY_URL|")) {
    String url = msg.substring(9);
    Serial.println("[AUDIO] Playing URL from announcement");
    streamWavFromUrl(url);
    return;
  }

  // Handle file playback requests from scheduled announcements
  if (msg.startsWith("PLAY_FILE|")) {
    String filename = msg.substring(10);
    // Construct full URL based on server IP/port
    // Assuming server is at http://10.91.181.13:3000
    String url = "https://smart-bell-and-audio-alert-system.onrender.com/media/" + filename;
    Serial.println("[AUDIO] Playing scheduled announcement: " + filename);
    streamWavFromUrl(url);
    return;
  }

  Serial.println("[AUDIO] Unknown command: " + msg);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== ESP32 MQTT WAV AUDIO NODE ===");

  setupI2S();
  connectWiFi();

  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  Serial.println("Ready for commands");
}

void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();
}