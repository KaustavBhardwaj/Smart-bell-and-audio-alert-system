const mongoose = require("mongoose");

const emergencyBellSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  enabled: { type: Boolean, default: true },
  repeatCount: { type: Number, default: 3 },
  repeatInterval: { type: Number, default: 1000 },
  lastTriggeredAt: Date,
  lastStoppedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("EmergencyBell", emergencyBellSchema);