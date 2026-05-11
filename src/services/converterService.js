const { spawn } = require("child_process");
const path = require("path");

// Use the FFmpeg build installed on the system
const { FFMPEG_PATH } = require("../config/env");
const ffmpegPath = FFMPEG_PATH;

function convertToAnnouncementWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-i", inputPath,
      "-ac", "1",
      "-ar", "16000",
      "-acodec", "pcm_s16le",
      outputPath
    ]);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}

module.exports = { convertToAnnouncementWav };