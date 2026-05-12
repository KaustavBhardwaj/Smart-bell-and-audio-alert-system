const { spawn } = require("child_process");
const fs = require("fs");
const { FFMPEG_PATH } = require("../config/env");

const ffmpegPath = FFMPEG_PATH;

function convertToAnnouncementWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-i", inputPath,

      // important: remove metadata chunks
      "-map_metadata", "-1",
      "-bitexact",

      "-af", "volume=1.4",
      // ESP32-safe format
      "-vn",
      "-ac", "1",
      "-ar", "16000",
      "-sample_fmt", "s16",
      "-acodec", "pcm_s16le",
      "-f", "wav",

      outputPath
    ]);

    let stderr = "";

    ffmpeg.stderr.on("data", data => {
      stderr += data.toString();
    });

    ffmpeg.on("error", err => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    ffmpeg.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}

module.exports = { convertToAnnouncementWav };