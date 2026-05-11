const path = require("path");
const fs = require("fs");

const { MEDIA_PATH, PUBLIC_BASE_URL } = require("../config/env");
const { sanitizeBaseName } = require("../utils/sanitize");
const { validateFileUpload } = require("../utils/validation");
const { convertToAnnouncementWav } = require("../services/converterService");
const { playFile } = require("../services/audioService");
const { addAudioFile } = require("../services/audioFileService");

async function uploadOnly(req, res) {
  let uploadedPath = null;

  try {
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

    const fileEntry = await addAudioFile({
      filename: outputFilename,
      name: baseName.replace(/_/g, " "),
      description: `Uploaded announcement: ${req.file.originalname}`,
      duration: 0,
      type: "file",
    });

    res.json({
      converted: true,
      filename: outputFilename,
      url: `${PUBLIC_BASE_URL}/media/${outputFilename}`,
      fileId: fileEntry.id,
      file: fileEntry,
      format: "wav",
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16,
      registered: true,
      message: "File uploaded and saved in MongoDB successfully",
    });
  } catch (err) {
    if (uploadedPath) fs.unlink(uploadedPath, () => {});

    res.status(500).json({
      error: "conversion failed",
      details: err.message,
    });
  }
}

async function uploadAndPlay(req, res) {
  let uploadedPath = null;

  try {
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

    const fileEntry = await addAudioFile({
      filename: outputFilename,
      name: baseName.replace(/_/g, " "),
      description: `Uploaded announcement: ${req.file.originalname}`,
      duration: 0,
      type: "file",
    });

    const url = playFile(outputFilename);

    res.json({
      converted: true,
      played: true,
      filename: outputFilename,
      url,
      fileId: fileEntry.id,
      file: fileEntry,
      registered: true,
      message: "File uploaded, saved in MongoDB, and playing",
    });
  } catch (err) {
    if (uploadedPath) fs.unlink(uploadedPath, () => {});

    res.status(500).json({
      error: "upload and play failed",
      details: err.message,
    });
  }
}

module.exports = {
  uploadOnly,
  uploadAndPlay,
};