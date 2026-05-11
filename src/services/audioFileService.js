const AudioFile = require("../models/AudioFile");

function makeAudioId(filename) {
  const baseName =
    filename.replace(/\.[^.]+$/, "").split("_").slice(0, -1).join("_") ||
    filename.replace(/\.[^.]+$/, "");

  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueId(filename) {
  const originalId = makeAudioId(filename) || `audio-${Date.now()}`;
  let id = originalId;
  let counter = 1;

  while (await AudioFile.findOne({ id })) {
    id = `${originalId}-${counter}`;
    counter++;
  }

  return id;
}

async function addAudioFile(audioData) {
  const { filename, name, description, duration = 0, type = "file" } = audioData;

  if (!filename) {
    throw new Error("filename is required");
  }

  const existingByFilename = await AudioFile.findOne({ filename });

  if (existingByFilename) {
    return existingByFilename;
  }

  const id = audioData.id || await generateUniqueId(filename);

  const newFile = await AudioFile.create({
  id,
  filename,
  name: name || filename,
  description: description || "",
  duration,
  type,
  cloudUrl: audioData.cloudUrl || null,
  publicId: audioData.publicId || null,
  uploadedAt: new Date(),
});

  console.log(`[AUDIO] Added audio file to MongoDB: ${id} (${filename})`);

  return newFile;
}

async function getAudioFileById(id) {
  return await AudioFile.findOne({ id });
}

async function getAudioFileByFilename(filename) {
  return await AudioFile.findOne({ filename });
}

async function getAllAudioFiles() {
  return await AudioFile.find({}).sort({ uploadedAt: -1 });
}

async function updateAudioFile(id, updates) {
  const updated = await AudioFile.findOneAndUpdate(
    { id },
    updates,
    { new: true }
  );

  if (!updated) {
    throw new Error(`Audio file with ID '${id}' not found`);
  }

  return updated;
}

async function deleteAudioFile(id) {
  const deleted = await AudioFile.findOneAndDelete({ id });

  if (!deleted) {
    throw new Error(`Audio file with ID '${id}' not found`);
  }

  return deleted;
}

module.exports = {
  addAudioFile,
  getAudioFileById,
  getAudioFileByFilename,
  getAllAudioFiles,
  updateAudioFile,
  deleteAudioFile,
};