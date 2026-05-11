const path = require("path");
const fs = require("fs");
const { PUBLIC_BASE_URL, MEDIA_PATH } = require("../config/env");
const { publishPlayUrl } = require("./mqttService");

// Volume management
let currentVolume = 70; // Default volume

const AUDIO_FILES_PATH = path.join(__dirname, "../data/audioFiles.json");

function buildMediaUrl(filename) {
  return `${PUBLIC_BASE_URL}/media/${filename}`;
}

function fileExistsInMedia(filename) {
  return fs.existsSync(path.join(MEDIA_PATH, filename));
}

function playFile(filename, target = "all") {
  const fullPath = path.join(MEDIA_PATH, filename);
  const exists = fs.existsSync(fullPath);

  console.log("[AUDIO] playFile:", filename);
  console.log("[AUDIO] Exists:", exists);
  console.log("[AUDIO] Full path:", fullPath);

  if (!exists) {
    throw new Error(`Media file not found: ${filename}`);
  }

  const url = buildMediaUrl(filename);
  console.log("[AUDIO] URL:", url);

  publishPlayUrl(url, target);
  return url;
}

function setVolume(volume) {
  currentVolume = Math.max(0, Math.min(100, volume));
  console.log(`[AUDIO] Volume set to ${currentVolume}%`);
  return currentVolume;
}

function getVolume() {
  return currentVolume;
}

function registerAudioFile(filename, name, description = "", duration = 0) {
  try {
    let audioFilesData = { audioFiles: [] };
    
    // Load existing audioFiles.json if it exists
    if (fs.existsSync(AUDIO_FILES_PATH)) {
      const content = fs.readFileSync(AUDIO_FILES_PATH, "utf-8");
      audioFilesData = JSON.parse(content);
    }

    // Create unique ID from filename (remove extension and timestamp)
    const baseName = filename.replace(/\.[^.]+$/, "").split("_").slice(0, -1).join("_") || filename;
    let id = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    // Ensure unique ID
    let counter = 1;
    const originalId = id;
    while (audioFilesData.audioFiles.some(f => f.id === id)) {
      id = `${originalId}-${counter}`;
      counter++;
    }

    // Add new audio file entry
    const newFile = {
      id,
      filename,
      name: name || baseName.replace(/_/g, " ").trim(),
      description: description || "",
      duration: duration || 0,
      uploadedAt: new Date().toISOString(),
      type: "file"
    };

    audioFilesData.audioFiles.push(newFile);

    // Save updated audioFiles.json
    fs.writeFileSync(AUDIO_FILES_PATH, JSON.stringify(audioFilesData, null, 2));
    console.log(`[AUDIO] File registered: ${filename} with ID: ${id}`);

    return newFile;
  } catch (err) {
    console.error("[AUDIO] Error registering file:", err);
    throw err;
  }
}

module.exports = {
  buildMediaUrl,
  fileExistsInMedia,
  playFile,
  setVolume,
  getVolume,
  registerAudioFile,
};