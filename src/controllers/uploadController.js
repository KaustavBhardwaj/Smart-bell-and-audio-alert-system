const path = require("path");
const fs = require("fs");
const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");
const { validateFileUpload } = require("../utils/validation");
const { convertToAnnouncementWav } = require("../services/converterService");
const { playFile, registerAudioFile } = require("../services/audioService");

async function uploadOnly(req, res) {
  let uploadedPath = null;

  try {
    // Validate file upload
    const validation = validateFileUpload(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    uploadedPath = req.file.path;

    const baseName = sanitizeBaseName(req.file.originalname || "announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    const outputPath = path.join(MEDIA_PATH, outputFilename);

    await convertToAnnouncementWav(uploadedPath, outputPath);
    fs.unlink(uploadedPath, () => {});

    // Register the file in audioFiles.json
    const fileEntry = registerAudioFile(
      outputFilename,
      baseName.replace(/_/g, " "),
      `Uploaded announcement: ${req.file.originalname}`,
      0
    );

    res.json({
      converted: true,
      filename: outputFilename,
      url: `${PUBLIC_BASE_URL}/media/${outputFilename}`,
      fileId: fileEntry.id,
      format: "wav",
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16,
      registered: true,
      message: "File uploaded and registered successfully"
    });
  } catch (err) {
    if (uploadedPath) fs.unlink(uploadedPath, () => {});
    res.status(500).json({ error: "conversion failed", details: err.message });
  }
}

async function uploadAndPlay(req, res) {
  let uploadedPath = null;

  try {
    // Validate file upload
    const validation = validateFileUpload(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    uploadedPath = req.file.path;

    const baseName = sanitizeBaseName(req.file.originalname || "announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    const outputPath = path.join(MEDIA_PATH, outputFilename);

    await convertToAnnouncementWav(uploadedPath, outputPath);
    fs.unlink(uploadedPath, () => {});

    // Register the file in audioFiles.json
    const fileEntry = registerAudioFile(
      outputFilename,
      baseName.replace(/_/g, " "),
      `Uploaded announcement: ${req.file.originalname}`,
      0
    );

    const url = playFile(outputFilename);

    res.json({
      converted: true,
      played: true,
      filename: outputFilename,
      url,
      fileId: fileEntry.id,
      registered: true,
      message: "File uploaded, registered and playing"
    });
  } catch (err) {
    if (uploadedPath) fs.unlink(uploadedPath, () => {});
    res.status(500).json({ error: "upload and play failed", details: err.message });
  }
}

module.exports = {
  uploadOnly,
  uploadAndPlay,
};