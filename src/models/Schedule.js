const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    type: {
      type: String,
      enum: ["bell", "announcement", "tts-announcement"],
      required: true,
    },
    filename: String,
    text: String,
    language: { type: String, default: "en" },
    time: { type: String, required: true },
    days: { type: [String], default: ["everyday"] },
    repeat: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    duration: Number,
    cronExpression: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);