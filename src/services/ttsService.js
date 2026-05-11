const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { URL } = require("url");
const { playFile } = require("./audioService");

// Change this path only if your ffmpeg location is different
const { FFMPEG_PATH } = require("../config/env");
const ffmpegPath = FFMPEG_PATH;

const SUPPORTED_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  bn: "Bengali",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi"
};

function generateFallbackTone(text, outputPath, language = "en") {
  return new Promise((resolve, reject) => {
    const duration = Math.max(1, Math.min(10, text.length / 100));
    const freq = language === "hi" ? 400 : 440;

    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-f", "lavfi",
      "-i", `sine=frequency=${freq}:duration=${duration}`,
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
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg failed with code ${code}`));
      }
    });
  });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const request = protocol.get(url, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close(() => resolve(outputPath));
      });

      fileStream.on("error", (err) => {
        reject(err);
      });
    });

    request.on("error", reject);

    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error("Download timeout"));
    });
  });
}

function convertMp3ToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-i", inputPath,
      "-vn",

      "-filter:a", "volume=2.0",
      
      "-ac", "1",
      "-ar", "16000",
      "-sample_fmt", "s16",
      "-acodec", "pcm_s16le",
      "-f", "wav",
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
      if (code === 0) {
        try {
          fs.unlinkSync(inputPath);
        } catch (e) {}

        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg failed with code ${code}`));
      }
    });
  });
}
async function googleTtsApi(text, language, slow) {
  const encodedText = encodeURIComponent(text);
  const langCode = language === "zh" ? "zh-CN" : language;

  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&q=${encodedText}&client=tw-ob&textlen=${text.length}&speed=${slow ? 0.5 : 1}`;
}

async function textToSpeech(
  text,
  outputPath,
  language = "en",
  speed = 1.0,
  convertToWav = true
) {
  let tempMp3Path = null;

  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    if (text.length > 5000) {
      throw new Error("Text is too long (max 5000 characters)");
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      throw new Error(
        `Unsupported language: ${language}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`
      );
    }

    const slow = false;

    tempMp3Path = convertToWav
      ? outputPath.replace(/\.wav$/i, ".mp3")
      : outputPath;

    let ttsSuccess = false;

    try {
      const ttsUrl = await googleTtsApi(text, language, slow);
      await downloadFile(ttsUrl, tempMp3Path);
      ttsSuccess = true;
      console.log("TTS: Downloaded from Google");
    } catch (downloadErr) {
      console.log(`TTS: Google download failed (${downloadErr.message}), using fallback tone`);
      ttsSuccess = false;
    }

    if (ttsSuccess && convertToWav) {
      await convertMp3ToWav(tempMp3Path, outputPath);
      const wavStats = fs.statSync(outputPath);

      return {
        success: true,
        filename: path.basename(outputPath),
        filepath: outputPath,
        text,
        language,
        speed,
        format: "wav",
        size: wavStats.size,
        method: "google-tts"
      };
    }

    if (ttsSuccess && !convertToWav) {
      const mp3Stats = fs.statSync(tempMp3Path);

      return {
        success: true,
        filename: path.basename(tempMp3Path),
        filepath: tempMp3Path,
        text,
        language,
        speed,
        format: "mp3",
        size: mp3Stats.size,
        method: "google-tts"
      };
    }

    await generateFallbackTone(text, outputPath, language);
    const wavStats = fs.statSync(outputPath);

    return {
      success: true,
      filename: path.basename(outputPath),
      filepath: outputPath,
      text,
      language,
      speed,
      format: "wav",
      size: wavStats.size,
      method: "fallback-tone"
    };
  } catch (err) {
    if (tempMp3Path && fs.existsSync(tempMp3Path)) {
      try {
        fs.unlinkSync(tempMp3Path);
      } catch (e) {}
    }

    throw new Error(`TTS conversion failed: ${err.message}`);
  }
}

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Generate TTS audio and immediately play it
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<object>} - Result with URL
 */
async function generateAndPlayTTS(text, language = "en") {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `tts-${timestamp}.wav`;
    const outputPath = path.join(__dirname, `../../media/${filename}`);

    // Generate TTS
    const result = await textToSpeech(text, outputPath, language, 1.0, true);

    if (!result.success) {
      throw new Error("TTS generation failed");
    }

    // Play the generated file
    const url = playFile(filename);
    
    console.log(`[TTS] Generated and playing: ${filename}`);
    return {
      success: true,
      text,
      language,
      filename,
      url,
      method: result.method
    };
  } catch (err) {
    console.error(`[TTS] Error in generateAndPlayTTS:`, err.message);
    throw err;
  }
}

module.exports = {
  textToSpeech,
  generateAndPlayTTS,
  getSupportedLanguages,
  SUPPORTED_LANGUAGES
};