const path = require("path");
const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");
const { textToSpeech } = require("../services/ttsService");
const { publishPlayUrl } = require("../services/mqttService");
const { generateAnnouncement } = require("../services/aiAnnouncementService");

async function createAiAnnouncement(req, res) {
  try {
    const {
      prompt,
      language = "en",
      target = "all",
      autoPlay = true
    } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const announcementText = await generateAnnouncement(prompt);

    const baseName = sanitizeBaseName("ai_announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    const outputPath = path.join(MEDIA_PATH, outputFilename);

    await textToSpeech(
      announcementText,
      outputPath,
      language,
      1.0,
      true
    );

    const fileUrl = `${PUBLIC_BASE_URL}/media/${outputFilename}`;

    if (autoPlay) {
      publishPlayUrl(fileUrl, target);
    }

    res.json({
      success: true,
      prompt,
      announcementText,
      filename: outputFilename,
      url: fileUrl,
      target,
      played: autoPlay
    });
  } catch (err) {
    res.status(500).json({
      error: "AI announcement failed",
      details: err.message
    });
  }
}

module.exports = {
  createAiAnnouncement,
};