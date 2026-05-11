const { listMediaFiles } = require("../services/fileService");
const { playFile, fileExistsInMedia, setVolume, getVolume } = require("../services/audioService");
const { publishStop, publishVolume } = require("../services/mqttService");
const { validateFilename } = require("../utils/validation");

function listAnnouncements(req, res) {
  const files = listMediaFiles();
  res.json({ count: files.length, files });
}

function playTest(req, res) {
  const url = playFile("test.wav");
  res.json({ sent: true, type: "test", url });
}

function playExistingFile(req, res) {
  const { filename, volume, target = "all" } = req.body;

  // Validate filename first
  const validation = validateFilename(filename);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  if (!fileExistsInMedia(filename)) {
    return res.status(404).json({ error: "file not found" });
  }

  // Handle volume if provided (0-100)
  let volumeLevel = 70; // default
  if (volume !== undefined) {
    volumeLevel = Math.max(0, Math.min(100, parseInt(volume) || 70));
    setVolume(volumeLevel);
    publishVolume(volumeLevel, target);
  }

  const url = playFile(filename, target);
  res.json({ sent: true, filename, url, volume: volumeLevel, target });
}

function stopPlayback(req, res) {
  const { target = "all" } = req.body;
publishStop(target);
  res.json({ sent: true, command: "STOP" });
}

function getAudioVolume(req, res) {
  const volume = getVolume();
  res.json({ volume });
}

function setAudioVolume(req, res) {
  const { volume } = req.body;
  
  if (volume === undefined || typeof volume !== 'number') {
    return res.status(400).json({ error: "volume must be a number (0-100)" });
  }

  const volumeLevel = Math.max(0, Math.min(100, volume));
  setVolume(volumeLevel);
  publishVolume(volumeLevel);
  
  res.json({ volume: volumeLevel, message: "Volume updated" });
}

module.exports = {
  listAnnouncements,
  playTest,
  playExistingFile,
  stopPlayback,
  getAudioVolume,
  setAudioVolume,
};