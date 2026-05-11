const path = require("path");
const fs = require("fs");

const { MEDIA_PATH } = require("../config/env");
const cloudinary = require("../config/cloudinary");

const { sanitizeBaseName } = require("../utils/sanitize");
const { validateFileUpload } = require("../utils/validation");
const { convertToAnnouncementWav } = require("../services/converterService");
const { publishPlayUrl } = require("../services/mqttService");
const { addAudioFile } = require("../services/audioFileService");

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
    fs.unlink(uploadedPath, () => {});

    const cloudUpload = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      folder: "iot-audio-files",
      public_id: outputFilename.replace(".wav", ""),
      format: "wav",
    });

    const fileEntry = await addAudioFile({
      filename: outputFilename,
      name: baseName.replace(/_/g, " "),
      description: `Uploaded announcement: ${req.file.originalname}`,
      duration: 0,
      type: "file",
      cloudUrl: cloudUpload.secure_url,
      publicId: cloudUpload.public_id,
    });

    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlink(outputPath, () => {});
    }

    res.json({
      converted: true,
      uploadedToCloudinary: true,
      filename: outputFilename,
      url: cloudUpload.secure_url,
      cloudUrl: cloudUpload.secure_url,
      fileId: fileEntry.id,
      file: fileEntry,
      format: "wav",
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16,
      registered: true,
      message: "File uploaded, converted, stored in Cloudinary, and saved in MongoDB",
    });
  } catch (err) {
    if (uploadedPath && fs.existsSync(uploadedPath)) fs.unlink(uploadedPath, () => {});
    if (outputPath && fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

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

    uploadedPath = req.file.path;

    const baseName = sanitizeBaseName(req.file.originalname || "announcement");
    const outputFilename = `${baseName}_${Date.now()}.wav`;
    outputPath = path.join(MEDIA_PATH, outputFilename);

    await convertToAnnouncementWav(uploadedPath, outputPath);
    fs.unlink(uploadedPath, () => {});

    const cloudUpload = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      folder: "iot-audio-files",
      public_id: outputFilename.replace(".wav", ""),
      format: "wav",
    });

    const fileEntry = await addAudioFile({
      filename: outputFilename,
      name: baseName.replace(/_/g, " "),
      description: `Uploaded announcement: ${req.file.originalname}`,
      duration: 0,
      type: "file",
      cloudUrl: cloudUpload.secure_url,
      publicId: cloudUpload.public_id,
    });

    publishPlayUrl(cloudUpload.secure_url);

    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlink(outputPath, () => {});
    }

    res.json({
      converted: true,
      uploadedToCloudinary: true,
      played: true,
      filename: outputFilename,
      url: cloudUpload.secure_url,
      cloudUrl: cloudUpload.secure_url,
      fileId: fileEntry.id,
      file: fileEntry,
      registered: true,
      message: "File uploaded, stored in Cloudinary, saved in MongoDB, and playing",
    });
  } catch (err) {
    if (uploadedPath && fs.existsSync(uploadedPath)) fs.unlink(uploadedPath, () => {});
    if (outputPath && fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

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