const path = require("path");
const fs = require("fs");
const { PUBLIC_BASE_URL, MEDIA_PATH } = require("../config/env");
const { publishPlayUrl } = require("./mqttService");

let currentVolume = 70;

function buildMediaUrl(filename) {
  return `${PUBLIC_BASE_URL.replace(/\/$/, "")}/media/${encodeURIComponent(filename)}`;
}

function getMediaPath(filename) {
  return path.join(MEDIA_PATH, filename);
}

function fileExistsInMedia(filename) {
  return fs.existsSync(getMediaPath(filename));
}

async function downloadCloudFileToMedia(cloudUrl, filename) {
  if (!cloudUrl) {
    throw new Error("Cloud URL missing for saved audio file");
  }

  const response = await fetch(cloudUrl);

  if (!response.ok) {
    throw new Error(`Failed to download cloud audio: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 44) {
    throw new Error("Downloaded cloud audio is too small or invalid");
  }

  fs.mkdirSync(MEDIA_PATH, { recursive: true });

  const fullPath = getMediaPath(filename);
  fs.writeFileSync(fullPath, buffer);

  console.log(`[AUDIO] Restored ${filename} from Cloudinary to media folder`);

  return fullPath;
}

async function ensureMediaFileAvailable(filename, cloudUrl = null) {
  const fullPath = getMediaPath(filename);

  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  return await downloadCloudFileToMedia(cloudUrl, filename);
}

function playFile(filename, target = "all") {
  const fullPath = getMediaPath(filename);

  console.log("[AUDIO] playFile:", filename);
  console.log("[AUDIO] Exists:", fs.existsSync(fullPath));
  console.log("[AUDIO] Full path:", fullPath);

  if (!fs.existsSync(fullPath)) {
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

module.exports = {
  buildMediaUrl,
  getMediaPath,
  fileExistsInMedia,
  ensureMediaFileAvailable,
  playFile,
  setVolume,
  getVolume,
};