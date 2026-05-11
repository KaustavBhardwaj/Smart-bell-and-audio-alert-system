const mongoose = require("mongoose");

const audioFileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  name: String,
  description: String,
  duration: Number,
  type: String,
  uploadedAt: { type: Date, default: Date.now },
  cloudUrl: String,
publicId: String,
}, { timestamps: true });

module.exports = mongoose.model("AudioFile", audioFileSchema);