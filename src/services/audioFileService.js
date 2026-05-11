const fs = require("fs");
const path = require("path");

const AUDIO_FILES_PATH = path.join(__dirname, "../data/audioFiles.json");

/**
 * Load all audio files from data file
 */
function loadAudioFiles() {
  try {
    if (fs.existsSync(AUDIO_FILES_PATH)) {
      const data = fs.readFileSync(AUDIO_FILES_PATH, "utf-8");
      return JSON.parse(data).audioFiles || [];
    }
  } catch (err) {
    console.error("Error loading audio files:", err.message);
  }
  return [];
}

/**
 * Save audio files to data file
 */
function saveAudioFiles(files) {
  try {
    fs.writeFileSync(AUDIO_FILES_PATH, JSON.stringify({ audioFiles: files }, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving audio files:", err.message);
    return false;
  }
}

/**
 * Add new audio file metadata
 */
function addAudioFile(audioData) {
  const { id, filename, name, description, duration, type = "file" } = audioData;

  if (!id || !filename || !name) {
    throw new Error("id, filename, and name are required");
  }

  const files = loadAudioFiles();

  // Check if ID already exists
  if (files.some(f => f.id === id)) {
    throw new Error(`Audio file with ID '${id}' already exists`);
  }

  const newFile = {
    id,
    filename,
    name,
    description: description || "",
    duration: duration || 0,
    uploadedAt: new Date().toISOString(),
    type
  };

  files.push(newFile);
  saveAudioFiles(files);

  console.log(`[AUDIO] Added audio file: ${id} (${filename})`);
  return newFile;
}

/**
 * Get audio file by ID
 */
function getAudioFileById(id) {
  const files = loadAudioFiles();
  return files.find(f => f.id === id);
}

/**
 * Get audio file by filename
 */
function getAudioFileByFilename(filename) {
  const files = loadAudioFiles();
  return files.find(f => f.filename === filename);
}

/**
 * Get all audio files
 */
function getAllAudioFiles() {
  return loadAudioFiles();
}

/**
 * Update audio file metadata
 */
function updateAudioFile(id, updates) {
  const files = loadAudioFiles();
  const file = files.find(f => f.id === id);

  if (!file) {
    throw new Error(`Audio file with ID '${id}' not found`);
  }

  Object.assign(file, updates, {
    updatedAt: new Date().toISOString()
  });

  saveAudioFiles(files);
  console.log(`[AUDIO] Updated audio file: ${id}`);
  return file;
}

/**
 * Delete audio file metadata
 */
function deleteAudioFile(id) {
  const files = loadAudioFiles();
  const index = files.findIndex(f => f.id === id);

  if (index === -1) {
    throw new Error(`Audio file with ID '${id}' not found`);
  }

  const deleted = files.splice(index, 1);
  saveAudioFiles(files);

  console.log(`[AUDIO] Deleted audio file: ${id}`);
  return deleted[0];
}

module.exports = {
  loadAudioFiles,
  saveAudioFiles,
  addAudioFile,
  getAudioFileById,
  getAudioFileByFilename,
  getAllAudioFiles,
  updateAudioFile,
  deleteAudioFile
};
