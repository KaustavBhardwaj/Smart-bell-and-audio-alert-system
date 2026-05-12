const path = require("path");
const fs = require("fs");

const { MEDIA_PATH } = require("../config/env");
const cloudinary = require("../config/cloudinary");

const { sanitizeBaseName } = require("../utils/sanitize");
const { validateFileUpload } = require("../utils/validation");
const { convertToAnnouncementWav } = require("../services/converterService");
const { publishPlayUrl } = require("../services/mqttService");
const { addAudioFile } = require("../services/audioFileService");
const { buildMediaUrl } = require("../services/audioService");

async function safeDelete(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
}

async function uploadToCloudinary(outputPath, outputFilename) {
  return cloudinary.uploader.upload(outputPath, {
    resource_type: "raw",
    folder: "iot-audio-files",
    public_id: outputFilename.replace(".wav", ""),
    use_filename: false,
    unique_filename: false,
    overwrite: true,
  });
}

async function saveAudioFileToDB(req, outputFilename, baseName, cloudUpload, localUrl) {
  return addAudioFile({
    filename: outputFilename,
    name: baseName.replace(/_/g, " "),
    description: `Uploaded announcement: ${req.file.originalname}`,
    duration: 0,
    type: "file",

    // local server URL for ESP32 playback
    url: localUrl,
    localUrl,

    // cloud backup URL
    cloudUrl: cloudUpload.secure_url,
    publicId: cloudUpload.public_id,
  });
}

async function uploadOnly(req, res) {
  let uploadedPath = null;
  let outputPath = null;

  try {
    const validation = validateFileUpload(req.file);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    uploadedPath = req.file.path;

    const baseName = sanitizeBaseName(req.file.originalname || "announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    outputPath = path.join(MEDIA_PATH, outputFilename);

    await convertToAnnouncementWav(uploadedPath, outputPath);
    await safeDelete(uploadedPath);

    const localUrl = buildMediaUrl(outputFilename);

    const cloudUpload = await uploadToCloudinary(outputPath, outputFilename);

    const fileEntry = await saveAudioFileToDB(
      req,
      outputFilename,
      baseName,
      cloudUpload,
      localUrl
    );

    // IMPORTANT:
    // Do NOT delete outputPath.
    // ESP32 and /play-file need this local WAV file.

    res.json({
      converted: true,
      uploadedToCloudinary: true,
      savedLocally: true,
      filename: outputFilename,

      // use this for ESP32/local playback
      url: localUrl,
      localUrl,

      // use this as backup/cloud reference
      cloudUrl: cloudUpload.secure_url,

      fileId: fileEntry.id || fileEntry._id,
      file: fileEntry,

      format: "wav",
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16,
      registered: true,
      message: "File uploaded, converted, stored locally, uploaded to Cloudinary, and saved in MongoDB",
    });
  } catch (err) {
    await safeDelete(uploadedPath);

    // delete converted file only if upload failed
    await safeDelete(outputPath);

    res.status(500).json({
      error: "upload failed",
      details: err.message,
    });
  }
}

async function uploadAndPlay(req, res) {
  let uploadedPath = null;
  let outputPath = null;

  try {
    const validation = validateFileUpload(req.file);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { target = "all" } = req.body;

    uploadedPath = req.file.path;

    const baseName = sanitizeBaseName(req.file.originalname || "announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    outputPath = path.join(MEDIA_PATH, outputFilename);

    await convertToAnnouncementWav(uploadedPath, outputPath);
    await safeDelete(uploadedPath);

    const localUrl = buildMediaUrl(outputFilename);

    const cloudUpload = await uploadToCloudinary(outputPath, outputFilename);

    const fileEntry = await saveAudioFileToDB(
      req,
      outputFilename,
      baseName,
      cloudUpload,
      localUrl
    );

    // IMPORTANT:
    // Play local backend URL, not Cloudinary URL.
    // ESP32 works better with your backend WAV format.
    publishPlayUrl(localUrl, target);

    // Do NOT delete outputPath.

    res.json({
      converted: true,
      uploadedToCloudinary: true,
      savedLocally: true,
      played: true,
      target,
      filename: outputFilename,

      // ESP32 playback URL
      url: localUrl,
      localUrl,

      // cloud backup URL
      cloudUrl: cloudUpload.secure_url,

      fileId: fileEntry.id || fileEntry._id,
      file: fileEntry,

      format: "wav",
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16,
      registered: true,
      message: "File uploaded, converted, stored locally, uploaded to Cloudinary, saved in MongoDB, and playing",
    });
  } catch (err) {
    await safeDelete(uploadedPath);
    await safeDelete(outputPath);

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