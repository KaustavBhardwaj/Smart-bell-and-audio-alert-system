const { listMediaFiles } = require("../services/fileService");
const { playFile, ensureMediaFileAvailable, setVolume, getVolume } = require("../services/audioService");
const { publishStop, publishVolume } = require("../services/mqttService");
const { validateFilename } = require("../utils/validation");
const { getAudioFileByFilename } = require("../services/audioFileService");

function listAnnouncements(req, res) {
  const files = listMediaFiles();
  res.json({ count: files.length, files });
}

function playTest(req, res) {
  const url = playFile("test.wav");
  res.json({ sent: true, type: "test", url });
}

async function playExistingFile(req, res) {
  const { filename, url, volume, target = "all" } = req.body;

  let volumeLevel = 70;

  if (volume !== undefined) {
    volumeLevel = Math.max(0, Math.min(100, parseInt(volume) || 70));
    setVolume(volumeLevel);
    publishVolume(volumeLevel, target);
  }

  if (filename) {
   const fileRecord = await getAudioFileByFilename(filename);

await ensureMediaFileAvailable(filename, fileRecord?.cloudUrl);

const localUrl = playFile(filename, target);

return res.json({
  sent: true,
  source: "backend-media-restored",
  filename,
  url: localUrl,
  restoredFromCloud: Boolean(fileRecord?.cloudUrl),
  volume: volumeLevel,
  target,
});
  }

  if (url) {
    const { publishPlayUrl } = require("../services/mqttService");
    publishPlayUrl(url, target);

    return res.json({
      sent: true,
      source: "direct-url",
      url,
      volume: volumeLevel,
      target,
    });
  }

  return res.status(400).json({
    error: "filename or url is required",
  });
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