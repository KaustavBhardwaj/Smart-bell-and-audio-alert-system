const path = require("path");
const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");
const {
  textToSpeech,
  SUPPORTED_LANGUAGES
} = require("../services/ttsService");
const { playFile } = require("../services/audioService");
const { publishPlayUrl } = require("../services/mqttService");

async function generateTTS(req, res) {
  try {
    const {
      text,
      language = "en",
      speed = 1.0,
      autoPlay = false,
      convertToWav = true
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text field is required" });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ error: "text cannot be empty" });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: "text is too long (max 5000 characters)" });
    }

    if (speed < 0.5 || speed > 2.0) {
      return res.status(400).json({ error: "speed must be between 0.5 and 2.0" });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ error: "unsupported language code" });
    }

    const baseName = sanitizeBaseName("tts_announcement");
    const timestamp = Date.now();
    const format = convertToWav ? "wav" : "mp3";
    const outputFilename = `${baseName}_${timestamp}.${format}`;
    const outputPath = path.join(MEDIA_PATH, outputFilename);

    const result = await textToSpeech(
      text,
      outputPath,
      language,
      speed,
      convertToWav
    );

    const fileUrl = `${PUBLIC_BASE_URL}/media/${outputFilename}`;

    const response = {
      converted: true,
      filename: outputFilename,
      url: fileUrl,
      text,
      language,
      languageName: SUPPORTED_LANGUAGES[language] || language,
      speed,
      format,
      size: result.size,
      method: result.method,
      played: false
    };

    if (autoPlay) {
      if (convertToWav) {
        publishPlayUrl(fileUrl);
        response.played = true;
        response.playMethod = "mqtt";
      } else {
        playFile(outputFilename);
        response.played = true;
        response.playMethod = "direct";
      }
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      error: "TTS generation failed",
      details: err.message
    });
  }
}

async function listLanguages(req, res) {
  try {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code,
      name
    }));

    return res.json({
      languages,
      default: "en"
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to get languages",
      details: err.message
    });
  }
}

async function previewTTS(req, res) {
  try {
    const { text, language = "en", volume } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text field is required" });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ error: "unsupported language code" });
    }

    // Handle volume if provided
    if (volume !== undefined) {
      const volumeLevel = Math.max(0, Math.min(100, parseInt(volume) || 70));
      const { publishVolume } = require("../services/mqttService");
      publishVolume(volumeLevel);
    }

    const previewText = text.length > 200 ? text.substring(0, 200) : text;

    const baseName = sanitizeBaseName("tts_preview");
    const timestamp = Date.now();
    const outputFilename = `${baseName}_${timestamp}.wav`;
    const outputPath = path.join(MEDIA_PATH, outputFilename);

    await textToSpeech(previewText, outputPath, language, 1.0, true);

    const fileUrl = `${PUBLIC_BASE_URL}/media/${outputFilename}`;

    publishPlayUrl(fileUrl);

    return res.json({
      converted: true,
      filename: outputFilename,
      url: fileUrl,
      text: previewText,
      language,
      languageName: SUPPORTED_LANGUAGES[language] || language,
      played: true,
      playMethod: "mqtt"
    });
  } catch (err) {
    return res.status(500).json({
      error: "TTS preview failed",
      details: err.message
    });
  }
}

module.exports = {
  generateTTS,
  listLanguages,
  previewTTS
};